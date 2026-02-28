use rusqlite::{Connection, params};
use std::path::PathBuf;

fn seed_database(conn: &Connection) -> Result<(), rusqlite::Error> {
    // Проверяем, есть ли уже данные
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM ingredients", [], |row| row.get(0))?;

    if count > 0 {
        println!("Database already seeded with {} ingredients", count);
        return Ok(());
    }

    println!("Seeding database with initial data...");

    // Ингредиенты
    let ingredients = vec![
        (1, "говядина лопатка лента", 19.4, 6.6, 0.0),
        (2, "курица грудка лента", 24.5, 1.1, 0.0),
        (3, "свинина шея лента", 19.0, 28.0, 0.0),
        (4, "гречневая крупа мистраль", 12.0, 3.4, 72.0),
        (5, "рис лазер", 7.5, 1.5, 77.0),
        (6, "шин рамен", 8.0, 13.0, 67.0),
        (7, "лапша рисовая", 6.4, 0.8, 79.0),
        (8, "спагетти барилла", 14.0, 2.0, 69.7),
        (9, "сливки 20%", 2.5, 20.0, 4.0),
        (10, "сливки 10%", 2.8, 10.0, 4.3),
        (11, "молоко 2,5% пискаревское", 3.0, 2.5, 4.7),
        (12, "молоко 0,5% пармалат", 3.0, 0.5, 4.7),
        (13, "сметана 10 простоквашино", 2.8, 10.0, 3.9),
        (14, "сметана 15 пискаревская", 2.6, 15.0, 3.6),
        (15, "йогурт теос 2%", 8.0, 2.0, 4.2),
        (16, "кефир 1% пискаревский", 3.0, 1.0, 4.0),
        (17, "творог 5% пискаревский", 16.0, 5.0, 3.0),
        (18, "творог 0,5% экомилк", 18.0, 0.5, 1.2),
        (19, "масло сливочное 82,5", 0.6, 82.5, 0.8),
        (20, "масло кунжутное", 0.0, 99.8, 0.0),
        (21, "масло оливковое", 0.0, 100.0, 0.0),
        (22, "масло подсолнечное", 0.0, 99.9, 0.0),
        (23, "вода", 0.0, 0.0, 0.0),
        (24, "яйцо с1", 12.7, 11.5, 0.7),
        (25, "кинза", 2.1, 0.5, 0.9),
        (26, "соленый огурец", 0.0, 0.0, 2.0),
        (27, "свекла", 1.6, 0.2, 10.0),
        (28, "морковь", 1.3, 0.1, 7.2),
        (29, "картофель", 2.0, 0.4, 16.3),
        (30, "перец болгарский", 1.3, 0.1, 5.3),
        (31, "лук", 1.1, 0.1, 5.7),
        (32, "редис", 1.2, 0.1, 3.4),
        (33, "капуста белокочанная", 1.8, 0.1, 4.7),
        (34, "капуста цветная", 2.5, 0.3, 4.2),
        (35, "капуста пакчой", 1.2, 0.2, 2.0),
        (36, "огурцы", 0.8, 0.1, 2.8),
        (37, "помидоры", 1.1, 0.2, 3.7),
        (38, "укроп", 3.5, 1.1, 4.9),
        (39, "айсберг", 0.9, 0.14, 1.7),
        (40, "баклажан", 1.2, 0.1, 4.5),
        (41, "брокколи", 2.57, 0.34, 3.87),
        (42, "кабачок", 0.6, 0.3, 4.6),
        (43, "лук зеленый", 1.3, 0.1, 3.2),
        (44, "сельдерей", 0.69, 0.17, 1.37),
        (45, "зеленый горошек", 3.0, 0.0, 6.0),
        (46, "петрушка", 3.7, 0.4, 7.6),
        (47, "соевый соус", 2.5, 0.0, 13.0),
        (48, "рыбный соус", 12.0, 0.0, 6.0),
        (49, "устричный соус", 5.1, 0.0, 28.0),
        (50, "горчица", 7.5, 9.5, 20.0),
        (51, "майонез рикко провансаль", 0.5, 67.0, 2.1),
        (52, "томатная паста", 5.5, 0.0, 14.0),
        (53, "чеснок", 6.4, 0.5, 31.0),
        (54, "квас очаково", 0.0, 0.0, 6.5),
        (55, "shin ramen", 8.2, 13.0, 68.0),
        (56, "макароны barilla spaghettini n.3", 14.0, 2.0, 69.7),
        (57, "минтай замороженный лента", 16.0, 1.0, 0.0),
        (58, "капуста квашеная", 1.6, 0.07, 4.62),
        (59, "джем махеев", 0.0, 0.0, 68.0),
        (60, "овсянка 2", 13.0, 6.5, 55.0),
        (61, "винный уксус", 0.1, 0.0, 0.4),
        (62, "чернослив", 2.5, 0.5, 58.0),
        (63, "кефир 2.5% пискаревский", 3.0, 2.5, 4.0),
        (64, "банан", 1.1, 0.3, 20.2),
        (65, "яблоко айдаред", 0.4, 0.4, 9.8),
        (66, "батон нива водар хлеба", 8.0, 1.0, 50.0),
        (67, "Молоко 3,2% простоквашино", 2.9, 3.2, 4.7),
        (68, "Лапша пшеничная Midori удон", 12.3, 1.4, 59.2),
        (69, "Апельсин", 0.9, 0.2, 8.4),
        (70, "Имбирь", 1.8, 0.8, 17.8),
        (71, "Крахмал картофельный", 0.0, 0.0, 79.0),
        (72, "Мармелад", 0.0, 0.0, 84.0),
        (73, "Тунец FORTUNA кусочки в собственном соку", 24.1, 0.75, 0.29),
        (74, "Молоко стерилизованное ДОМИК В ДЕРЕВНЕ 1,5%", 3.0, 1.5, 4.7),
        (75, "Optimium nutrition Gold Whey", 75.0, 4.5, 12.0),
        (76, "Тестовый ингредиент", 10.0, 5.0, 20.0),
        (77, "Для обновления", 15.0, 8.0, 25.0),
        (78, "Тестовый ингредиент для блюда", 10.0, 5.0, 20.0),
        (79, "Test Ingredient", 10.0, 5.0, 15.0),
        (80, "Ingredient To Update", 10.0, 4.0, 20.0),
    ];

    let ingredients_count = ingredients.len();

    for (id, name, protein, fat, carbs) in ingredients {
        conn.execute(
            "INSERT INTO ingredients (id, name, protein, fat, carbohydrates) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, name, protein, fat, carbs],
        )?;
    }

    // Блюда
    let dishes = vec![
        (4, "Чашушули", Some(0.0), vec![(1, 140.0), (22, 2.0), (25, 5.0), (30, 50.0), (31, 50.0), (37, 100.0), (46, 5.0), (52, 5.0)]),
        (6, "Окрошка", Some(0.0), vec![(15, 30.0), (24, 60.0), (29, 50.0), (32, 50.0), (36, 50.0), (50, 5.0), (54, 200.0), (2, 100.0)]),
        (8, "Кофе с молоком", Some(0.0), vec![(23, 150.0), (74, 150.0)]),
        (9, "Овсяная каша", Some(0.0), vec![(23, 150.0), (60, 50.0), (74, 150.0)]),
        (13, "Минтай", Some(0.0), vec![(57, 400.0)]),
        (14, "Оливье", Some(0.0), vec![(2, 100.0), (15, 50.0), (24, 48.0), (26, 40.0), (28, 40.0), (29, 80.0), (45, 80.0)]),
        (15, "Куриное филе", Some(0.0), vec![(2, 250.0)]),
        (16, "Картофель фри", Some(0.0), vec![(29, 200.0)]),
        (17, "Щи", Some(0.0), vec![(1, 70.0), (15, 30.0), (22, 2.0), (23, 300.0), (28, 15.0), (29, 20.0), (30, 15.0), (31, 15.0), (52, 7.0), (53, 0.25), (58, 30.0)]),
        (18, "Винегрет", Some(0.0), vec![(22, 5.0), (26, 40.0), (27, 80.0), (28, 80.0), (29, 80.0), (31, 40.0), (45, 80.0), (58, 80.0)]),
        (21, "Шин Рамен", Some(0.0), vec![(23, 300.0), (6, 60.0), (51, 15.0), (53, 20.0), (43, 50.0)]),
        (22, "Греча с молоком", Some(0.0), vec![(4, 100.0), (23, 200.0), (74, 200.0)]),
        (23, "Банан", Some(0.0), vec![(64, 140.0)]),
        (24, "Паста Барилла 100", Some(0.0), vec![(19, 3.0), (8, 100.0)]),
        (26, "Лапша с курицей", Some(0.0), vec![(22, 10.0), (28, 50.0), (30, 50.0), (47, 25.0), (68, 100.0), (69, 70.0), (70, 10.0), (71, 3.0), (2, 75.0), (43, 25.0)]),
        (27, "Мармеладка", Some(0.0), vec![(72, 12.5)]),
        (28, "Яблоко", Some(0.0), vec![(65, 140.0)]),
        (29, "Вареное яйцо", Some(0.0), vec![(24, 60.0)]),
        (30, "Мимоза тунцовая", Some(0.0), vec![(15, 40.0), (24, 30.0), (28, 75.0), (29, 75.0), (31, 25.0), (73, 90.0)]),
        (31, "Протеин", Some(0.0), vec![(75, 31.0)]),
        (32, "Тестовое блюдо", Some(0.0), vec![(78, 150.0)]),
    ];

    let dishes_count = dishes.len();

    for (id, name, weight, ingredients_list) in dishes {
        conn.execute(
            "INSERT OR IGNORE INTO dishes (id, name, weight) VALUES (?1, ?2, ?3)",
            params![id, name, weight],
        )?;

        let dish_id = if id > 0 {
            id as i64
        } else {
            conn.last_insert_rowid()
        };

        for (ing_id, amount) in ingredients_list {
            conn.execute(
                "INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES (?1, ?2, ?3)",
                params![dish_id, ing_id, amount],
            )?;
        }
    }

    println!("Database seeded successfully with {} ingredients and {} dishes", ingredients_count, dishes_count);
    Ok(())
}

pub fn get_db_path() -> PathBuf {
    let mut path = std::env::current_exe().expect("Failed to get exe path");
    path.pop();
    path.push("menu_planner.db");
    path
}

pub fn init_db(is_new: bool) -> Result<Connection, String> {
    let db_path = get_db_path();

    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database at {:?}: {}", db_path, e))?;

    // Create ingredients table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            protein REAL NOT NULL,
            fat REAL NOT NULL,
            carbohydrates REAL NOT NULL
        )",
        [],
    ).map_err(|e| format!("Failed to create ingredients table: {}", e))?;

    // Create index on ingredients.name for faster lookups
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name)",
        [],
    ).map_err(|e| format!("Failed to create index on ingredients.name: {}", e))?;

    // Create dishes table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS dishes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            weight REAL
        )",
        [],
    ).map_err(|e| format!("Failed to create dishes table: {}", e))?;

    // Create index on dishes.name for faster lookups
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_dishes_name ON dishes(name)",
        [],
    ).map_err(|e| format!("Failed to create index on dishes.name: {}", e))?;

    // Create dish_ingredients table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS dish_ingredients (
            dish_id INTEGER NOT NULL,
            ingredient_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            PRIMARY KEY (dish_id, ingredient_id),
            FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
            FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
        )",
        [],
    ).map_err(|e| format!("Failed to create dish_ingredients table: {}", e))?;

    // Create index on dish_ingredients.dish_id for faster JOIN queries
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_dish_ingredients_dish_id ON dish_ingredients(dish_id)",
        [],
    ).map_err(|e| format!("Failed to create index on dish_ingredients.dish_id: {}", e))?;

    // Create goals table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY DEFAULT 1,
            protein REAL NOT NULL,
            fat REAL NOT NULL,
            carbohydrates REAL NOT NULL
        )",
        [],
    ).map_err(|e| format!("Failed to create goals table: {}", e))?;

    // Seed with initial data if this is a new database
    if is_new {
        seed_database(&conn)
            .map_err(|e| format!("Failed to seed database: {}", e))?;
    }

    Ok(conn)
}

pub fn get_connection() -> Result<Connection, String> {
    let db_path = get_db_path();

    let is_new = !db_path.exists();

    if is_new {
        return init_db(true);
    }

    Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))
}
