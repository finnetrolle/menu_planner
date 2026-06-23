mod seed_data;

use rusqlite::{params, params_from_iter, Connection};
use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
    sync::OnceLock,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager, Runtime};

use seed_data::{SeedDish, SeedIngredient, SEED_DISHES, SEED_INGREDIENTS};

const DB_FILE_NAME: &str = "menu_planner.db";
const LEGACY_APP_IDENTIFIERS: &[&str] = &["com.menuplanner.app"];
static DB_PATH: OnceLock<PathBuf> = OnceLock::new();

#[cfg_attr(not(test), allow(dead_code))]
pub enum SeedMode {
    Disabled,
    SampleData,
}

mod migrations {
    use refinery::embed_migrations;

    embed_migrations!("./migrations");
}

pub fn resolve_app_db_path<R: Runtime>(app_handle: &AppHandle<R>) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {e}"))?;

    fs::create_dir_all(&app_data_dir).map_err(|e| {
        format!(
            "Failed to create app data directory {:?}: {}",
            app_data_dir, e
        )
    })?;

    let app_db_path = app_data_dir.join(DB_FILE_NAME);
    let legacy_candidates = legacy_db_candidates(
        &app_data_dir,
        &app_db_path,
        std::env::current_exe().ok().as_deref(),
    );

    restore_legacy_database_if_needed(&app_db_path, &legacy_candidates)?;

    Ok(app_db_path)
}

fn legacy_db_candidates(
    app_data_dir: &Path,
    current_db_path: &Path,
    current_exe_path: Option<&Path>,
) -> Vec<PathBuf> {
    let mut candidates = Vec::new();

    if let Some(app_support_root) = app_data_dir.parent() {
        for legacy_identifier in LEGACY_APP_IDENTIFIERS {
            let legacy_db_path = app_support_root.join(legacy_identifier).join(DB_FILE_NAME);

            if legacy_db_path != current_db_path && !candidates.contains(&legacy_db_path) {
                candidates.push(legacy_db_path);
            }
        }
    }

    if let Some(executable_dir) = current_exe_path.and_then(Path::parent) {
        let legacy_db_path = executable_dir.join(DB_FILE_NAME);

        if legacy_db_path != current_db_path && !candidates.contains(&legacy_db_path) {
            candidates.push(legacy_db_path);
        }
    }

    candidates
}

fn restore_legacy_database_if_needed(
    current_db_path: &Path,
    legacy_candidates: &[PathBuf],
) -> Result<(), String> {
    let Some(legacy_db_path) = newest_existing_db_path(legacy_candidates)? else {
        return Ok(());
    };

    if !current_db_path.exists() {
        copy_database_file(&legacy_db_path, current_db_path)?;
        return Ok(());
    }

    if database_contains_only_seed_data(current_db_path)? {
        copy_database_file(&legacy_db_path, current_db_path)?;
    }

    Ok(())
}

fn newest_existing_db_path(candidates: &[PathBuf]) -> Result<Option<PathBuf>, String> {
    let mut newest_candidate: Option<(SystemTime, PathBuf)> = None;

    for candidate in candidates {
        if !candidate.is_file() {
            continue;
        }

        let modified = fs::metadata(candidate)
            .map_err(|e| format!("Failed to inspect legacy database {:?}: {}", candidate, e))?
            .modified()
            .unwrap_or(UNIX_EPOCH);

        match &newest_candidate {
            Some((current_modified, _)) if modified <= *current_modified => {}
            _ => newest_candidate = Some((modified, candidate.clone())),
        }
    }

    Ok(newest_candidate.map(|(_, path)| path))
}

fn copy_database_file(source: &Path, destination: &Path) -> Result<(), String> {
    if let Some(parent_dir) = destination.parent() {
        fs::create_dir_all(parent_dir).map_err(|e| {
            format!(
                "Failed to create database destination directory {:?}: {}",
                parent_dir, e
            )
        })?;
    }

    fs::copy(source, destination).map_err(|e| {
        format!(
            "Failed to copy legacy database from {:?} to {:?}: {}",
            source, destination, e
        )
    })?;

    Ok(())
}

fn database_contains_only_seed_data(path: &Path) -> Result<bool, String> {
    let conn = Connection::open(path)
        .map_err(|e| format!("Failed to inspect database {:?}: {}", path, e))?;

    configure_connection(&conn)?;

    let only_seed_ingredients = table_contains_only_seed_names(
        &conn,
        "ingredients",
        SEED_INGREDIENTS.iter().map(|ingredient| ingredient.name),
    )?;
    let only_seed_dishes =
        table_contains_only_seed_names(&conn, "dishes", SEED_DISHES.iter().map(|dish| dish.name))?;

    Ok(only_seed_ingredients && only_seed_dishes)
}

fn table_contains_only_seed_names<'a, I>(
    conn: &Connection,
    table_name: &str,
    allowed_names: I,
) -> Result<bool, String>
where
    I: IntoIterator<Item = &'a str>,
{
    let allowed_names: Vec<&str> = allowed_names.into_iter().collect();
    let placeholders = vec!["?"; allowed_names.len()].join(", ");
    let query = format!("SELECT COUNT(*) FROM {table_name} WHERE name NOT IN ({placeholders})");
    let unexpected_rows_count: i64 = conn
        .query_row(
            &query,
            params_from_iter(allowed_names.iter().copied()),
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to inspect table '{}': {}", table_name, e))?;

    Ok(unexpected_rows_count == 0)
}

pub fn configure_database_path(db_path: PathBuf) -> Result<(), String> {
    match DB_PATH.set(db_path.clone()) {
        Ok(()) => Ok(()),
        Err(_) => match DB_PATH.get() {
            Some(existing) if existing == &db_path => Ok(()),
            Some(existing) => Err(format!(
                "Database path is already configured: {:?}",
                existing
            )),
            None => Err("Database path is not configured".to_string()),
        },
    }
}

pub fn get_db_path() -> Result<&'static PathBuf, String> {
    DB_PATH
        .get()
        .ok_or_else(|| "Database path is not configured".to_string())
}

#[cfg_attr(not(test), allow(dead_code))]
pub fn bootstrap_connection(conn: &mut Connection, seed_mode: SeedMode) -> Result<(), String> {
    bootstrap_connection_internal(conn, seed_mode, true)
}

fn bootstrap_connection_internal(
    conn: &mut Connection,
    seed_mode: SeedMode,
    should_seed: bool,
) -> Result<(), String> {
    configure_connection(conn)?;
    run_migrations(conn)?;

    if should_seed && matches!(seed_mode, SeedMode::SampleData) {
        seed_database(conn)?;
    }

    Ok(())
}

#[cfg_attr(not(test), allow(dead_code))]
pub fn open_in_memory_connection(seed_mode: SeedMode) -> Result<Connection, String> {
    let mut conn = Connection::open_in_memory()
        .map_err(|e| format!("Failed to open in-memory database: {}", e))?;

    bootstrap_connection(&mut conn, seed_mode)?;

    Ok(conn)
}

pub fn open_connection_at(path: &Path, seed_mode: SeedMode) -> Result<Connection, String> {
    let is_new_database = !path.exists();

    if let Some(parent_dir) = path.parent() {
        fs::create_dir_all(parent_dir)
            .map_err(|e| format!("Failed to create parent directory {:?}: {}", parent_dir, e))?;
    }

    let mut conn = Connection::open(path)
        .map_err(|e| format!("Failed to open database at {:?}: {}", path, e))?;

    bootstrap_connection_internal(&mut conn, seed_mode, is_new_database)?;

    Ok(conn)
}

pub fn get_connection() -> Result<Connection, String> {
    let db_path = get_db_path()?;
    open_connection_at(db_path, SeedMode::SampleData)
}

pub fn seed_database(conn: &mut Connection) -> Result<(), String> {
    let tx = conn
        .unchecked_transaction()
        .map_err(|e| format!("Failed to start seed transaction: {}", e))?;

    let ingredient_ids = seed_ingredients(&tx)?;
    seed_dishes(&tx, &ingredient_ids)?;

    tx.commit()
        .map_err(|e| format!("Failed to commit seed transaction: {}", e))?;

    Ok(())
}

fn configure_connection(conn: &Connection) -> Result<(), String> {
    conn.execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|e| format!("Failed to enable foreign keys: {}", e))?;

    conn.busy_timeout(Duration::from_secs(5))
        .map_err(|e| format!("Failed to configure busy timeout: {}", e))?;

    Ok(())
}

fn run_migrations(conn: &mut Connection) -> Result<(), String> {
    migrations::migrations::runner()
        .set_grouped(true)
        .run(conn)
        .map_err(|e| format!("Failed to run migrations: {}", e))?;

    Ok(())
}

fn seed_ingredients(tx: &rusqlite::Transaction<'_>) -> Result<HashMap<i64, i64>, String> {
    let mut ingredient_ids = HashMap::with_capacity(SEED_INGREDIENTS.len());

    for ingredient in SEED_INGREDIENTS {
        insert_seed_ingredient(tx, ingredient)?;

        let ingredient_id: i64 = tx
            .query_row(
                "SELECT id FROM ingredients WHERE name = ?1",
                params![ingredient.name],
                |row| row.get(0),
            )
            .map_err(|e| {
                format!(
                    "Failed to fetch seeded ingredient '{}': {}",
                    ingredient.name, e
                )
            })?;

        ingredient_ids.insert(ingredient.legacy_id, ingredient_id);
    }

    Ok(ingredient_ids)
}

fn seed_dishes(
    tx: &rusqlite::Transaction<'_>,
    ingredient_ids: &HashMap<i64, i64>,
) -> Result<(), String> {
    for dish in SEED_DISHES {
        insert_seed_dish(tx, dish, ingredient_ids)?;
    }

    Ok(())
}

fn insert_seed_ingredient(
    tx: &rusqlite::Transaction<'_>,
    ingredient: &SeedIngredient,
) -> Result<(), String> {
    tx.execute(
        "INSERT OR IGNORE INTO ingredients (name, protein, fat, carbohydrates) VALUES (?1, ?2, ?3, ?4)",
        params![
            ingredient.name,
            ingredient.protein,
            ingredient.fat,
            ingredient.carbohydrates
        ],
    )
    .map_err(|e| format!("Failed to seed ingredient '{}': {}", ingredient.name, e))?;

    Ok(())
}

fn insert_seed_dish(
    tx: &rusqlite::Transaction<'_>,
    dish: &SeedDish,
    ingredient_ids: &HashMap<i64, i64>,
) -> Result<(), String> {
    tx.execute(
        "INSERT OR IGNORE INTO dishes (name, weight) VALUES (?1, ?2)",
        params![dish.name, dish.weight],
    )
    .map_err(|e| format!("Failed to seed dish '{}': {}", dish.name, e))?;

    let dish_id: i64 = tx
        .query_row(
            "SELECT id FROM dishes WHERE name = ?1",
            params![dish.name],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to fetch seeded dish '{}': {}", dish.name, e))?;

    let ingredient_rows_count: i64 = tx
        .query_row(
            "SELECT COUNT(*) FROM dish_ingredients WHERE dish_id = ?1",
            params![dish_id],
            |row| row.get(0),
        )
        .map_err(|e| {
            format!(
                "Failed to inspect seeded ingredients for dish '{}': {}",
                dish.name, e
            )
        })?;

    if ingredient_rows_count > 0 {
        return Ok(());
    }

    for ingredient in dish.ingredients {
        let ingredient_id = ingredient_ids
            .get(&ingredient.legacy_ingredient_id)
            .copied()
            .ok_or_else(|| {
                format!(
                    "Seed ingredient id {} is missing for dish '{}'",
                    ingredient.legacy_ingredient_id, dish.name
                )
            })?;

        tx.execute(
            "INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES (?1, ?2, ?3)",
            params![dish_id, ingredient_id, ingredient.amount],
        )
        .map_err(|e| {
            format!(
                "Failed to seed ingredient row for dish '{}': {}",
                dish.name, e
            )
        })?;
    }

    Ok(())
}

#[cfg(test)]
mod database_path_tests {
    use super::{
        database_contains_only_seed_data, legacy_db_candidates, open_connection_at,
        restore_legacy_database_if_needed, SeedMode,
    };
    use rusqlite::params;
    use std::{
        fs,
        path::{Path, PathBuf},
        time::{SystemTime, UNIX_EPOCH},
    };

    struct TestDir {
        path: PathBuf,
    }

    impl TestDir {
        fn new(name: &str) -> Self {
            let unique_suffix = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("System time should be after UNIX_EPOCH")
                .as_nanos();
            let path = std::env::temp_dir().join(format!(
                "menu_planner_{name}_{}_{}",
                std::process::id(),
                unique_suffix
            ));

            fs::create_dir_all(&path).expect("Failed to create temp test directory");

            Self { path }
        }

        fn path(&self) -> &Path {
            &self.path
        }
    }

    impl Drop for TestDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.path);
        }
    }

    fn seed_database_at(path: &Path) {
        let _conn = open_connection_at(path, SeedMode::SampleData)
            .expect("Failed to create seeded database");
    }

    fn seed_database_with_custom_dish(path: &Path, ingredient: &str, dish: &str) {
        let conn = open_connection_at(path, SeedMode::SampleData)
            .expect("Failed to create source database");

        conn.execute(
            "INSERT INTO ingredients (name, protein, fat, carbohydrates) VALUES (?1, ?2, ?3, ?4)",
            params![ingredient, 10.0, 5.0, 20.0],
        )
        .expect("Failed to insert custom ingredient");
        let ingredient_id = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO dishes (name, weight) VALUES (?1, ?2)",
            params![dish, 250.0],
        )
        .expect("Failed to insert custom dish");
        let dish_id = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES (?1, ?2, ?3)",
            params![dish_id, ingredient_id, 250.0],
        )
        .expect("Failed to link custom dish ingredient");
    }

    fn has_dish(path: &Path, dish: &str) -> bool {
        let conn = open_connection_at(path, SeedMode::Disabled).expect("Failed to open database");
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM dishes WHERE name = ?1",
                params![dish],
                |row| row.get(0),
            )
            .expect("Failed to query dish count");

        count == 1
    }

    #[test]
    fn legacy_candidates_include_old_identifier_and_executable_directory() {
        let test_dir = TestDir::new("legacy_candidates");
        let app_support_dir = test_dir
            .path()
            .join("Application Support")
            .join("com.menuplanner");
        let current_db_path = app_support_dir.join("menu_planner.db");
        let executable_path = test_dir
            .path()
            .join("Menu Planner.app")
            .join("Contents")
            .join("MacOS")
            .join("menu-planner");

        let candidates =
            legacy_db_candidates(&app_support_dir, &current_db_path, Some(&executable_path));

        assert!(candidates.contains(
            &test_dir
                .path()
                .join("Application Support")
                .join("com.menuplanner.app")
                .join("menu_planner.db")
        ));
        assert!(candidates.contains(
            &test_dir
                .path()
                .join("Menu Planner.app")
                .join("Contents")
                .join("MacOS")
                .join("menu_planner.db")
        ));
    }

    #[test]
    fn restores_missing_database_from_legacy_source() {
        let test_dir = TestDir::new("restore_missing");
        let current_db_path = test_dir
            .path()
            .join("Application Support")
            .join("com.menuplanner")
            .join("menu_planner.db");
        let legacy_db_path = test_dir.path().join("legacy").join("menu_planner.db");

        seed_database_with_custom_dish(
            &legacy_db_path,
            "Ингредиент из старой версии",
            "Блюдо из старой версии",
        );

        restore_legacy_database_if_needed(&current_db_path, std::slice::from_ref(&legacy_db_path))
            .expect("Failed to restore missing database from legacy");

        assert!(current_db_path.exists());
        assert!(has_dish(&current_db_path, "Блюдо из старой версии"));
        assert!(!database_contains_only_seed_data(&current_db_path).unwrap());
    }

    #[test]
    fn restores_seed_only_database_from_legacy_source() {
        let test_dir = TestDir::new("restore_seed_only");
        let current_db_path = test_dir
            .path()
            .join("Application Support")
            .join("com.menuplanner")
            .join("menu_planner.db");
        let legacy_db_path = test_dir.path().join("legacy").join("menu_planner.db");

        seed_database_at(&current_db_path);
        seed_database_with_custom_dish(
            &legacy_db_path,
            "Пользовательский ингредиент",
            "Пользовательское блюдо",
        );

        assert!(database_contains_only_seed_data(&current_db_path).unwrap());

        restore_legacy_database_if_needed(&current_db_path, std::slice::from_ref(&legacy_db_path))
            .expect("Failed to restore seed-only database from legacy");

        assert!(has_dish(&current_db_path, "Пользовательское блюдо"));
    }

    #[test]
    fn keeps_current_database_when_it_already_has_user_data() {
        let test_dir = TestDir::new("keep_current");
        let current_db_path = test_dir
            .path()
            .join("Application Support")
            .join("com.menuplanner")
            .join("menu_planner.db");
        let legacy_db_path = test_dir.path().join("legacy").join("menu_planner.db");

        seed_database_with_custom_dish(
            &current_db_path,
            "Текущий ингредиент",
            "Текущее пользовательское блюдо",
        );
        seed_database_with_custom_dish(
            &legacy_db_path,
            "Старый ингредиент",
            "Старое пользовательское блюдо",
        );

        restore_legacy_database_if_needed(&current_db_path, std::slice::from_ref(&legacy_db_path))
            .expect("Failed while deciding whether to keep current database");

        assert!(has_dish(&current_db_path, "Текущее пользовательское блюдо"));
        assert!(!has_dish(&current_db_path, "Старое пользовательское блюдо"));
    }
}
