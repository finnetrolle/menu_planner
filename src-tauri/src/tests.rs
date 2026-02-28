#[cfg(test)]
mod api_tests {
    use rusqlite::Connection;
    use crate::models::Ingredient;

    fn setup_test_db() -> Connection {
        // Используем тестовую базу данных в памяти
        let conn = Connection::open_in_memory().expect("Failed to create test database");

        // Создаем таблицы
        conn.execute(
            "CREATE TABLE IF NOT EXISTS ingredients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                protein REAL NOT NULL,
                fat REAL NOT NULL,
                carbohydrates REAL NOT NULL
            )",
            [],
        ).expect("Failed to create ingredients table");

        conn.execute(
            "CREATE TABLE IF NOT EXISTS dishes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                weight REAL
            )",
            [],
        ).expect("Failed to create dishes table");

        conn.execute(
            "CREATE TABLE IF NOT EXISTS dish_ingredients (
                dish_id INTEGER NOT NULL,
                ingredient_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                PRIMARY KEY (dish_id, ingredient_id)
            )",
            [],
        ).expect("Failed to create dish_ingredients table");

        conn
    }

    #[test]
    fn test_create_ingredient() {
        let conn = setup_test_db();

        let ingredient = Ingredient {
            id: None,
            name: "Тестовый продукт".to_string(),
            protein: 20.0,
            fat: 5.0,
            carbohydrates: 30.0,
        };

        let result = conn.execute(
            "INSERT INTO ingredients (name, protein, fat, carbohydrates) VALUES (?1, ?2, ?3, ?4)",
            (&ingredient.name, ingredient.protein, ingredient.fat, ingredient.carbohydrates),
        );

        assert!(result.is_ok());
        let id = conn.last_insert_rowid();
        assert!(id > 0);
    }

    #[test]
    fn test_get_ingredient() {
        let conn = setup_test_db();

        let ingredient = Ingredient {
            id: None,
            name: "Яблоко".to_string(),
            protein: 0.5,
            fat: 0.3,
            carbohydrates: 14.0,
        };

        conn.execute(
            "INSERT INTO ingredients (name, protein, fat, carbohydrates) VALUES (?1, ?2, ?3, ?4)",
            (&ingredient.name, ingredient.protein, ingredient.fat, ingredient.carbohydrates),
        ).expect("Failed to insert ingredient");

        let mut stmt = conn.prepare("SELECT id, name, protein, fat, carbohydrates FROM ingredients WHERE name = ?1")
            .expect("Failed to prepare statement");

        let result = stmt.query_row([&ingredient.name], |row| {
            Ok(Ingredient {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                protein: row.get(2)?,
                fat: row.get(3)?,
                carbohydrates: row.get(4)?,
            })
        });

        assert!(result.is_ok());
        let found = result.unwrap();
        assert_eq!(found.name, ingredient.name);
        assert_eq!(found.protein, ingredient.protein);
    }

    #[test]
    fn test_create_dish_with_ingredients() {
        let conn = setup_test_db();

        // Сначала создаем ингредиент
        conn.execute(
            "INSERT INTO ingredients (name, protein, fat, carbohydrates) VALUES (?1, ?2, ?3, ?4)",
            ("Курица", 24.0, 1.0, 0.0),
        ).expect("Failed to insert ingredient");

        let ingredient_id = conn.last_insert_rowid();

        // Создаем блюдо
        conn.execute(
            "INSERT INTO dishes (name, weight) VALUES (?1, ?2)",
            ("Куриная грудка", Some(150.0)),
        ).expect("Failed to insert dish");

        let dish_id = conn.last_insert_rowid();

        // Добавляем ингредиент в блюдо
        conn.execute(
            "INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES (?1, ?2, ?3)",
            (dish_id, ingredient_id, 150.0),
        ).expect("Failed to add ingredient to dish");

        // Проверяем чтение блюда
        let mut stmt = conn.prepare("SELECT id, name, weight FROM dishes WHERE id = ?1")
            .expect("Failed to prepare statement");

        let dish = stmt.query_row([dish_id], |row| {
            Ok::<_, rusqlite::Error>((row.get::<_, i64>(0)?, row.get::<_, String>(1)?, row.get::<_, Option<f64>>(2)?))
        }).expect("Failed to query dish");

        assert_eq!(dish.1, "Куриная грудка");
        assert_eq!(dish.2, Some(150.0));
    }

    #[test]
    fn test_update_ingredient() {
        let conn = setup_test_db();

        conn.execute(
            "INSERT INTO ingredients (name, protein, fat, carbohydrates) VALUES (?1, ?2, ?3, ?4)",
            ("Гречка", 12.0, 3.4, 72.0),
        ).expect("Failed to insert ingredient");

        let id = conn.last_insert_rowid();

        // Обновляем
        conn.execute(
            "UPDATE ingredients SET protein = ?1 WHERE id = ?2",
            (12.5, id),
        ).expect("Failed to update ingredient");

        // Проверяем
        let mut stmt = conn.prepare("SELECT protein FROM ingredients WHERE id = ?1")
            .expect("Failed to prepare statement");

        let protein: f64 = stmt.query_row([id], |row| row.get(0)).expect("Failed to query protein");

        assert_eq!(protein, 12.5);
    }

    #[test]
    fn test_delete_ingredient() {
        let conn = setup_test_db();

        conn.execute(
            "INSERT INTO ingredients (name, protein, fat, carbohydrates) VALUES (?1, ?2, ?3, ?4)",
            ("Морковь", 1.3, 0.1, 7.2),
        ).expect("Failed to insert ingredient");

        let id = conn.last_insert_rowid();

        // Удаляем
        conn.execute("DELETE FROM ingredients WHERE id = ?1", [id])
            .expect("Failed to delete ingredient");

        // Проверяем что не существует
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM ingredients WHERE id = ?1")
            .expect("Failed to prepare statement");

        let count: i64 = stmt.query_row([id], |row| row.get(0)).expect("Failed to query count");

        assert_eq!(count, 0);
    }
}
