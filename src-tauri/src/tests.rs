#[cfg(test)]
mod data_layer_tests {
    use crate::database::{
        bootstrap_connection, open_in_memory_connection, seed_database, SeedMode,
    };
    use crate::error::AppError;
    use crate::models::{Dish, DishIngredient};
    use crate::repositories::{DishRepository, Repository};
    use rusqlite::{params, Connection};

    fn setup_test_db() -> Connection {
        open_in_memory_connection(SeedMode::Disabled)
            .expect("Failed to bootstrap in-memory database")
    }

    fn insert_ingredient(conn: &Connection, name: &str) -> i64 {
        conn.execute(
            "INSERT INTO ingredients (name, protein, fat, carbohydrates) VALUES (?1, ?2, ?3, ?4)",
            params![name, 10.0, 5.0, 20.0],
        )
        .expect("Failed to insert ingredient");

        conn.last_insert_rowid()
    }

    fn dish_ingredient_count(conn: &Connection, dish_id: i64) -> i64 {
        conn.query_row(
            "SELECT COUNT(*) FROM dish_ingredients WHERE dish_id = ?1",
            params![dish_id],
            |row| row.get(0),
        )
        .expect("Failed to count dish ingredients")
    }

    fn dish_name(conn: &Connection, dish_id: i64) -> String {
        conn.query_row(
            "SELECT name FROM dishes WHERE id = ?1",
            params![dish_id],
            |row| row.get(0),
        )
        .expect("Failed to fetch dish name")
    }

    #[test]
    fn bootstrap_applies_migrations_and_connection_pragmas() {
        let mut conn =
            Connection::open_in_memory().expect("Failed to create raw in-memory database");

        bootstrap_connection(&mut conn, SeedMode::Disabled).expect("Failed to bootstrap database");

        let foreign_keys: i64 = conn
            .query_row("PRAGMA foreign_keys", [], |row| row.get(0))
            .expect("Failed to read foreign_keys pragma");
        assert_eq!(foreign_keys, 1);

        let tables = [
            "ingredients",
            "dishes",
            "dish_ingredients",
            "goals",
            "refinery_schema_history",
        ];

        for table in tables {
            let exists: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = ?1",
                    params![table],
                    |row| row.get(0),
                )
                .expect("Failed to query sqlite_master");

            assert_eq!(exists, 1, "Table '{}' should exist after bootstrap", table);
        }
    }

    #[test]
    fn seed_database_is_idempotent_and_excludes_test_entries() {
        let mut conn = setup_test_db();

        seed_database(&mut conn).expect("Failed to seed database");

        let ingredient_count_before: i64 = conn
            .query_row("SELECT COUNT(*) FROM ingredients", [], |row| row.get(0))
            .expect("Failed to count ingredients");
        let dish_count_before: i64 = conn
            .query_row("SELECT COUNT(*) FROM dishes", [], |row| row.get(0))
            .expect("Failed to count dishes");
        let dish_ingredient_count_before: i64 = conn
            .query_row("SELECT COUNT(*) FROM dish_ingredients", [], |row| {
                row.get(0)
            })
            .expect("Failed to count dish ingredients");

        seed_database(&mut conn).expect("Failed to reseed database");

        let ingredient_count_after: i64 = conn
            .query_row("SELECT COUNT(*) FROM ingredients", [], |row| row.get(0))
            .expect("Failed to count ingredients after reseed");
        let dish_count_after: i64 = conn
            .query_row("SELECT COUNT(*) FROM dishes", [], |row| row.get(0))
            .expect("Failed to count dishes after reseed");
        let dish_ingredient_count_after: i64 = conn
            .query_row("SELECT COUNT(*) FROM dish_ingredients", [], |row| {
                row.get(0)
            })
            .expect("Failed to count dish ingredients after reseed");

        assert_eq!(ingredient_count_before, ingredient_count_after);
        assert_eq!(dish_count_before, dish_count_after);
        assert_eq!(dish_ingredient_count_before, dish_ingredient_count_after);

        let test_entries_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM ingredients WHERE name IN (?1, ?2, ?3, ?4, ?5)",
                params![
                    "Тестовый ингредиент",
                    "Для обновления",
                    "Тестовый ингредиент для блюда",
                    "Test Ingredient",
                    "Ingredient To Update"
                ],
                |row| row.get(0),
            )
            .expect("Failed to count removed seed entries");

        assert_eq!(test_entries_count, 0);
    }

    #[test]
    fn deleting_ingredient_cascades_dish_ingredient_rows() {
        let conn = setup_test_db();

        let ingredient_id = insert_ingredient(&conn, "Каскадный ингредиент");

        conn.execute(
            "INSERT INTO dishes (name, weight) VALUES (?1, ?2)",
            params!["Каскадное блюдо", 100.0],
        )
        .expect("Failed to insert dish");
        let dish_id = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES (?1, ?2, ?3)",
            params![dish_id, ingredient_id, 100.0],
        )
        .expect("Failed to insert dish ingredient");

        conn.execute(
            "DELETE FROM ingredients WHERE id = ?1",
            params![ingredient_id],
        )
        .expect("Failed to delete ingredient");

        assert_eq!(dish_ingredient_count(&conn, dish_id), 0);
    }

    #[test]
    fn deleting_dish_cascades_dish_ingredient_rows() {
        let conn = setup_test_db();
        let repo = DishRepository;
        let ingredient_id = insert_ingredient(&conn, "Ингредиент для удаления блюда");

        let dish_id = repo
            .create(
                &conn,
                &Dish {
                    id: None,
                    name: "Блюдо на удаление".to_string(),
                    weight: Some(200.0),
                    ingredients: vec![DishIngredient {
                        ingredient_id,
                        amount: 200.0,
                    }],
                },
            )
            .expect("Failed to create dish");

        repo.delete(&conn, dish_id).expect("Failed to delete dish");

        assert_eq!(dish_ingredient_count(&conn, dish_id), 0);
    }

    #[test]
    fn create_dish_rolls_back_when_ingredient_insert_fails() {
        let conn = setup_test_db();
        let repo = DishRepository;
        let valid_ingredient_id = insert_ingredient(&conn, "Валидный ингредиент");

        let result = repo.create(
            &conn,
            &Dish {
                id: None,
                name: "Нестабильное блюдо".to_string(),
                weight: Some(150.0),
                ingredients: vec![
                    DishIngredient {
                        ingredient_id: valid_ingredient_id,
                        amount: 100.0,
                    },
                    DishIngredient {
                        ingredient_id: 999_999,
                        amount: 50.0,
                    },
                ],
            },
        );

        assert!(matches!(result, Err(AppError::Database(_))));

        let dishes_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM dishes WHERE name = ?1",
                params!["Нестабильное блюдо"],
                |row| row.get(0),
            )
            .expect("Failed to count dishes");

        let dish_ingredients_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM dish_ingredients", [], |row| {
                row.get(0)
            })
            .expect("Failed to count dish ingredients");

        assert_eq!(dishes_count, 0);
        assert_eq!(dish_ingredients_count, 0);
    }

    #[test]
    fn update_dish_rolls_back_when_new_ingredient_insert_fails() {
        let conn = setup_test_db();
        let repo = DishRepository;
        let first_ingredient_id = insert_ingredient(&conn, "Первый ингредиент");
        let second_ingredient_id = insert_ingredient(&conn, "Второй ингредиент");

        let dish_id = repo
            .create(
                &conn,
                &Dish {
                    id: None,
                    name: "Исходное блюдо".to_string(),
                    weight: Some(100.0),
                    ingredients: vec![DishIngredient {
                        ingredient_id: first_ingredient_id,
                        amount: 100.0,
                    }],
                },
            )
            .expect("Failed to create initial dish");

        let result = repo.update(
            &conn,
            dish_id,
            &Dish {
                id: Some(dish_id),
                name: "Сломанное обновление".to_string(),
                weight: Some(180.0),
                ingredients: vec![
                    DishIngredient {
                        ingredient_id: second_ingredient_id,
                        amount: 120.0,
                    },
                    DishIngredient {
                        ingredient_id: 999_999,
                        amount: 60.0,
                    },
                ],
            },
        );

        assert!(matches!(result, Err(AppError::Database(_))));
        assert_eq!(dish_name(&conn, dish_id), "Исходное блюдо");
        assert_eq!(dish_ingredient_count(&conn, dish_id), 1);

        let preserved_ingredient_id: i64 = conn
            .query_row(
                "SELECT ingredient_id FROM dish_ingredients WHERE dish_id = ?1",
                params![dish_id],
                |row| row.get(0),
            )
            .expect("Failed to fetch preserved ingredient");

        assert_eq!(preserved_ingredient_id, first_ingredient_id);
    }

    #[test]
    fn create_dish_rejects_duplicate_ingredients_before_db_constraint() {
        let conn = setup_test_db();
        let repo = DishRepository;
        let ingredient_id = insert_ingredient(&conn, "Повторяющийся ингредиент");

        let result = repo.create(
            &conn,
            &Dish {
                id: None,
                name: "Блюдо с дублем".to_string(),
                weight: Some(120.0),
                ingredients: vec![
                    DishIngredient {
                        ingredient_id,
                        amount: 60.0,
                    },
                    DishIngredient {
                        ingredient_id,
                        amount: 60.0,
                    },
                ],
            },
        );

        let error = result.expect_err("Duplicate ingredient should be rejected");
        assert!(matches!(
            error,
            AppError::Duplicate {
                entity: "dish_ingredient",
                field: "ingredient_id",
                ..
            }
        ));

        let dishes_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM dishes", [], |row| row.get(0))
            .expect("Failed to count dishes");

        assert_eq!(dishes_count, 0);
    }
}

#[cfg(test)]
mod planner_service_tests {
    use crate::database::{open_in_memory_connection, SeedMode};
    use crate::models::{Dish, DishIngredient, Goals};
    use crate::repositories::{DishRepository, Repository};
    use crate::services::menu_service::{MenuPlanRequest, MenuService, SelectedDish};
    use rusqlite::{params, Connection};

    fn setup_test_db() -> Connection {
        open_in_memory_connection(SeedMode::Disabled)
            .expect("Failed to bootstrap in-memory database")
    }

    fn insert_ingredient(
        conn: &Connection,
        name: &str,
        protein: f64,
        fat: f64,
        carbohydrates: f64,
    ) -> i64 {
        conn.execute(
            "INSERT INTO ingredients (name, protein, fat, carbohydrates) VALUES (?1, ?2, ?3, ?4)",
            params![name, protein, fat, carbohydrates],
        )
        .expect("Failed to insert ingredient");

        conn.last_insert_rowid()
    }

    fn create_dish(conn: &Connection, name: &str, ingredients: Vec<DishIngredient>) -> i64 {
        let repo = DishRepository;

        repo.create(
            conn,
            &Dish {
                id: None,
                name: name.to_string(),
                weight: None,
                ingredients,
            },
        )
        .expect("Failed to create dish")
    }

    fn get_all_dishes(conn: &Connection) -> Vec<Dish> {
        let repo = DishRepository;
        repo.get_all(conn).expect("Failed to load dishes")
    }

    fn assert_close(actual: f64, expected: f64) {
        assert!(
            (actual - expected).abs() < 0.0001,
            "Expected {expected}, got {actual}"
        );
    }

    #[test]
    fn menu_plan_scales_nutrition_by_portions_and_compares_to_goals() {
        let conn = setup_test_db();
        let ingredient_id = insert_ingredient(&conn, "Рис", 10.0, 5.0, 20.0);
        let dish_id = create_dish(
            &conn,
            "Рисовая тарелка",
            vec![DishIngredient {
                ingredient_id,
                amount: 100.0,
            }],
        );

        let request = MenuPlanRequest {
            selected_dishes: vec![SelectedDish {
                dish_id,
                portions: 2.0,
            }],
            goals: Some(Goals {
                id: None,
                protein: 20.0,
                fat: 10.0,
                carbohydrates: 40.0,
            }),
        };

        let plan = MenuService::build_menu_plan(&conn, &request, &get_all_dishes(&conn))
            .expect("Failed to build menu plan");

        assert_eq!(plan.items.len(), 1);
        assert_close(plan.total_nutrition.protein, 20.0);
        assert_close(plan.total_nutrition.fat, 10.0);
        assert_close(plan.total_nutrition.carbohydrates, 40.0);
        assert_close(plan.total_nutrition.calories, 330.0);

        let item = &plan.items[0];
        assert_eq!(item.dish_id, dish_id);
        assert_close(item.portions, 2.0);
        assert_close(item.weight, 200.0);
        assert_close(item.calories, 330.0);

        let comparison = plan
            .goal_comparison
            .expect("Goal comparison should be present");
        assert_close(comparison.calories.percentage, 100.0);
        assert_close(comparison.protein.percentage, 100.0);
        assert_close(comparison.fat.percentage, 100.0);
        assert_close(comparison.carbohydrates.percentage, 100.0);
    }

    #[test]
    fn menu_plan_handles_empty_selection() {
        let conn = setup_test_db();

        let request = MenuPlanRequest {
            selected_dishes: vec![],
            goals: Some(Goals {
                id: None,
                protein: 160.0,
                fat: 70.0,
                carbohydrates: 210.0,
            }),
        };

        let plan = MenuService::build_menu_plan(&conn, &request, &get_all_dishes(&conn))
            .expect("Failed to build empty menu plan");

        assert!(plan.items.is_empty());
        assert!(plan.shopping_list.is_empty());
        assert_close(plan.total_nutrition.calories, 0.0);
        assert_close(plan.total_nutrition.protein, 0.0);
        assert_close(plan.total_nutrition.fat, 0.0);
        assert_close(plan.total_nutrition.carbohydrates, 0.0);

        let comparison = plan
            .goal_comparison
            .expect("Goal comparison should exist for provided goals");
        assert_close(comparison.calories.percentage, 0.0);
        assert_close(comparison.protein.percentage, 0.0);
        assert_close(comparison.fat.percentage, 0.0);
        assert_close(comparison.carbohydrates.percentage, 0.0);
    }

    #[test]
    fn menu_plan_ignores_broken_ingredient_rows() {
        let conn = setup_test_db();
        let valid_ingredient_id = insert_ingredient(&conn, "Курица", 24.0, 2.0, 0.0);
        let dish_id = create_dish(
            &conn,
            "Курица с legacy-ошибкой",
            vec![DishIngredient {
                ingredient_id: valid_ingredient_id,
                amount: 100.0,
            }],
        );

        conn.execute_batch("PRAGMA foreign_keys = OFF;")
            .expect("Failed to disable foreign keys");
        conn.execute(
            "INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES (?1, ?2, ?3)",
            params![dish_id, 999_999, 50.0],
        )
        .expect("Failed to insert broken ingredient row");
        conn.execute_batch("PRAGMA foreign_keys = ON;")
            .expect("Failed to re-enable foreign keys");

        let request = MenuPlanRequest {
            selected_dishes: vec![SelectedDish {
                dish_id,
                portions: 1.0,
            }],
            goals: None,
        };

        let plan = MenuService::build_menu_plan(&conn, &request, &get_all_dishes(&conn))
            .expect("Failed to build menu plan with broken ingredient row");

        assert_eq!(plan.items.len(), 1);
        assert_eq!(plan.shopping_list.len(), 1);
        assert_eq!(plan.shopping_list[0].ingredient_id, valid_ingredient_id);
        assert_eq!(plan.shopping_list[0].ingredient_name, "Курица");
        assert_close(plan.shopping_list[0].amount, 100.0);
        assert_close(plan.total_nutrition.protein, 24.0);
        assert_close(plan.total_nutrition.fat, 2.0);
        assert_close(plan.total_nutrition.carbohydrates, 0.0);
    }

    #[test]
    fn menu_plan_aggregates_shopping_list_across_dishes_and_portions() {
        let conn = setup_test_db();
        let chicken_id = insert_ingredient(&conn, "Курица", 24.0, 2.0, 0.0);
        let onion_id = insert_ingredient(&conn, "Лук", 1.0, 0.1, 5.7);

        let first_dish_id = create_dish(
            &conn,
            "Курица с луком",
            vec![
                DishIngredient {
                    ingredient_id: chicken_id,
                    amount: 100.0,
                },
                DishIngredient {
                    ingredient_id: onion_id,
                    amount: 50.0,
                },
            ],
        );

        let second_dish_id = create_dish(
            &conn,
            "Лук-гарнир",
            vec![DishIngredient {
                ingredient_id: onion_id,
                amount: 20.0,
            }],
        );

        let request = MenuPlanRequest {
            selected_dishes: vec![
                SelectedDish {
                    dish_id: first_dish_id,
                    portions: 2.0,
                },
                SelectedDish {
                    dish_id: second_dish_id,
                    portions: 3.0,
                },
            ],
            goals: None,
        };

        let plan = MenuService::build_menu_plan(&conn, &request, &get_all_dishes(&conn))
            .expect("Failed to build aggregated menu plan");

        assert_eq!(plan.items.len(), 2);
        assert_eq!(plan.shopping_list.len(), 2);

        let chicken = plan
            .shopping_list
            .iter()
            .find(|item| item.ingredient_id == chicken_id)
            .expect("Chicken should be present in shopping list");
        let onion = plan
            .shopping_list
            .iter()
            .find(|item| item.ingredient_id == onion_id)
            .expect("Onion should be present in shopping list");

        assert_close(chicken.amount, 200.0);
        assert_close(onion.amount, 160.0);
    }
}
