use crate::database::get_connection;
use crate::error::{AppError, CommandError};
use crate::models::{Dish, Goals, Ingredient};
use crate::repositories::{DishRepository, GoalsRepository, IngredientRepository, Repository};
use crate::services::menu_service::{MenuPlanRequest, MenuPlanResult, MenuService};
use rusqlite::Connection;

fn open_connection() -> Result<Connection, CommandError> {
    get_connection()
        .map_err(AppError::database)
        .map_err(CommandError::from)
}

// ==================== Ingredients ====================

#[tauri::command]
pub fn get_ingredients() -> Result<Vec<Ingredient>, CommandError> {
    let conn = open_connection()?;
    let repo = IngredientRepository;
    repo.get_all(&conn).map_err(CommandError::from)
}

#[tauri::command]
pub fn get_ingredient(id: i64) -> Result<Option<Ingredient>, CommandError> {
    let conn = open_connection()?;
    let repo = IngredientRepository;
    repo.get_by_id(&conn, id).map_err(CommandError::from)
}

#[tauri::command]
pub fn create_ingredient(ingredient: Ingredient) -> Result<i64, CommandError> {
    let conn = open_connection()?;
    let repo = IngredientRepository;
    repo.create(&conn, &ingredient).map_err(CommandError::from)
}

#[tauri::command]
pub fn update_ingredient(id: i64, ingredient: Ingredient) -> Result<(), CommandError> {
    let conn = open_connection()?;
    let repo = IngredientRepository;
    repo.update(&conn, id, &ingredient)
        .map_err(CommandError::from)
}

#[tauri::command]
pub fn delete_ingredient(id: i64) -> Result<(), CommandError> {
    let conn = open_connection()?;
    let repo = IngredientRepository;
    repo.delete(&conn, id).map_err(CommandError::from)
}

// ==================== Dishes ====================

#[tauri::command]
pub fn get_dishes() -> Result<Vec<Dish>, CommandError> {
    let conn = open_connection()?;
    let repo = DishRepository;
    repo.get_all(&conn).map_err(CommandError::from)
}

#[tauri::command]
pub fn get_dish(id: i64) -> Result<Option<Dish>, CommandError> {
    let conn = open_connection()?;
    let repo = DishRepository;
    repo.get_by_id(&conn, id).map_err(CommandError::from)
}

#[tauri::command]
pub fn create_dish(dish: Dish) -> Result<i64, CommandError> {
    let conn = open_connection()?;
    let repo = DishRepository;
    repo.create(&conn, &dish).map_err(CommandError::from)
}

#[tauri::command]
pub fn update_dish(id: i64, dish: Dish) -> Result<(), CommandError> {
    let conn = open_connection()?;
    let repo = DishRepository;
    repo.update(&conn, id, &dish).map_err(CommandError::from)
}

#[tauri::command]
pub fn delete_dish(id: i64) -> Result<(), CommandError> {
    let conn = open_connection()?;
    let repo = DishRepository;
    repo.delete(&conn, id).map_err(CommandError::from)
}

// ==================== Goals ====================

#[tauri::command]
pub fn get_goals() -> Result<Option<Goals>, CommandError> {
    let conn = open_connection()?;
    let repo = GoalsRepository;
    repo.get_current(&conn).map_err(CommandError::from)
}

#[tauri::command]
pub fn save_goals(goals: Goals) -> Result<(), CommandError> {
    let conn = open_connection()?;
    let repo = GoalsRepository;
    repo.save(&conn, &goals).map_err(CommandError::from)
}

// ==================== Services ====================

#[tauri::command]
pub fn calculate_menu_plan(mut request: MenuPlanRequest) -> Result<MenuPlanResult, CommandError> {
    let conn = open_connection()?;

    let repo = DishRepository;
    let dishes = repo.get_all(&conn).map_err(CommandError::from)?;

    if request.goals.is_none() {
        let goals_repo = GoalsRepository;
        request.goals = goals_repo.get_current(&conn).map_err(CommandError::from)?;
    }

    MenuService::build_menu_plan(&conn, &request, &dishes).map_err(CommandError::from)
}
