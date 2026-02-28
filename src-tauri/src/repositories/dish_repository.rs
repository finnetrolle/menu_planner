use rusqlite::params;
use crate::models::{Dish, DishIngredient};
use crate::repositories::Repository;
use validator::Validate;

/// Репозиторий для работы с блюдами
pub struct DishRepository;

impl Repository<Dish> for DishRepository {
    fn get_by_id(&self, conn: &rusqlite::Connection, id: i64) -> Result<Option<Dish>, String> {
        let mut stmt = conn.prepare(
            "SELECT d.id, d.name, d.weight, di.ingredient_id, di.amount
             FROM dishes d
             LEFT JOIN dish_ingredients di ON d.id = di.dish_id
             WHERE d.id = ?1"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let dish_rows = stmt.query_map(params![id], |row: &rusqlite::Row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<f64>>(2)?,
                row.get::<_, Option<i64>>(3)?,
                row.get::<_, Option<f64>>(4)?,
            ))
        }).map_err(|e| format!("Failed to query dish: {}", e))?;

        let mut dish_opt: Option<Dish> = None;

        for dish_row in dish_rows {
            let (dish_id, dish_name, dish_weight, ingredient_id_opt, amount_opt) =
                dish_row.map_err(|e| format!("Failed to process dish row: {}", e))?;

            if let Some(dish) = dish_opt.as_mut() {
                // Блюдо уже есть, добавляем ингредиент
                if let (Some(ingredient_id), Some(amount)) = (ingredient_id_opt, amount_opt) {
                    dish.ingredients.push(DishIngredient {
                        ingredient_id,
                        amount,
                    });
                }
            } else {
                // Новое блюдо
                let mut ingredients = Vec::new();
                if let (Some(ingredient_id), Some(amount)) = (ingredient_id_opt, amount_opt) {
                    ingredients.push(DishIngredient {
                        ingredient_id,
                        amount,
                    });
                }
                dish_opt = Some(Dish {
                    id: Some(dish_id),
                    name: dish_name,
                    weight: dish_weight,
                    ingredients,
                });
            }
        }

        Ok(dish_opt)
    }

    fn get_all(&self, conn: &rusqlite::Connection) -> Result<Vec<Dish>, String> {
        // Используем один JOIN запрос вместо N+1 запросов
        let mut stmt = conn.prepare(
            "SELECT d.id, d.name, d.weight, di.ingredient_id, di.amount
             FROM dishes d
             LEFT JOIN dish_ingredients di ON d.id = di.dish_id
             ORDER BY d.name"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let dish_rows = stmt.query_map([], |row: &rusqlite::Row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<f64>>(2)?,
                row.get::<_, Option<i64>>(3)?,
                row.get::<_, Option<f64>>(4)?,
            ))
        }).map_err(|e| format!("Failed to query dishes: {}", e))?;

        // Группируем результаты по блюдам
        let mut dishes_map: std::collections::HashMap<i64, Dish> = std::collections::HashMap::new();

        for dish_row in dish_rows {
            let (dish_id, dish_name, dish_weight, ingredient_id_opt, amount_opt) =
                dish_row.map_err(|e| format!("Failed to process dish row: {}", e))?;

            if let Some(dish) = dishes_map.get_mut(&dish_id) {
                // Блюдо уже есть, добавляем ингредиент
                if let (Some(ingredient_id), Some(amount)) = (ingredient_id_opt, amount_opt) {
                    dish.ingredients.push(DishIngredient {
                        ingredient_id,
                        amount,
                    });
                }
            } else {
                // Новое блюдо
                let mut ingredients = Vec::new();
                if let (Some(ingredient_id), Some(amount)) = (ingredient_id_opt, amount_opt) {
                    ingredients.push(DishIngredient {
                        ingredient_id,
                        amount,
                    });
                }
                dishes_map.insert(
                    dish_id,
                    Dish {
                        id: Some(dish_id),
                        name: dish_name,
                        weight: dish_weight,
                        ingredients,
                    },
                );
            }
        }

        // Преобразуем HashMap в Vec и сортируем по имени
        let mut dishes: Vec<Dish> = dishes_map.into_values().collect();
        dishes.sort_by(|a, b| a.name.cmp(&b.name));

        Ok(dishes)
    }

    fn create(&self, conn: &rusqlite::Connection, item: &Dish) -> Result<i64, String> {
        // Валидация данных перед сохранением
        if let Err(errors) = item.validate() {
            let error_messages: Vec<String> = errors
                .field_errors()
                .iter()
                .flat_map(|(field, errors)| {
                    errors.iter().map(move |e| format!("{}: {}", field, e.code))
                })
                .collect();
            return Err(error_messages.join("; "));
        }

        // Дополнительная валидация ингредиентов
        for (i, ingredient) in item.ingredients.iter().enumerate() {
            if let Err(errors) = ingredient.validate() {
                let error_messages: Vec<String> = errors
                    .field_errors()
                    .iter()
                    .flat_map(|(field, errors)| {
                        errors.iter().map(move |e| format!("Ингредиент {}: {} - {}", i + 1, field, e.code))
                    })
                    .collect();
                return Err(error_messages.join("; "));
            }
        }

        conn.execute(
            "INSERT INTO dishes (name, weight) VALUES (?1, ?2)",
            params![item.name, item.weight],
        ).map_err(|e| format!("Failed to create dish: {}", e))?;

        let dish_id = conn.last_insert_rowid();

        for ingredient in &item.ingredients {
            conn.execute(
                "INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES (?1, ?2, ?3)",
                params![dish_id, ingredient.ingredient_id, ingredient.amount],
            ).map_err(|e| format!("Failed to add ingredient to dish: {}", e))?;
        }

        Ok(dish_id)
    }

    fn update(&self, conn: &rusqlite::Connection, id: i64, item: &Dish) -> Result<(), String> {
        // Валидация данных перед сохранением
        if let Err(errors) = item.validate() {
            let error_messages: Vec<String> = errors
                .field_errors()
                .iter()
                .flat_map(|(field, errors)| {
                    errors.iter().map(move |e| format!("{}: {}", field, e.code))
                })
                .collect();
            return Err(error_messages.join("; "));
        }

        // Дополнительная валидация ингредиентов
        for (i, ingredient) in item.ingredients.iter().enumerate() {
            if let Err(errors) = ingredient.validate() {
                let error_messages: Vec<String> = errors
                    .field_errors()
                    .iter()
                    .flat_map(|(field, errors)| {
                        errors.iter().map(move |e| format!("Ингредиент {}: {} - {}", i + 1, field, e.code))
                    })
                    .collect();
                return Err(error_messages.join("; "));
            }
        }

        conn.execute(
            "UPDATE dishes SET name = ?1, weight = ?2 WHERE id = ?3",
            params![item.name, item.weight, id],
        ).map_err(|e| format!("Failed to update dish: {}", e))?;

        conn.execute("DELETE FROM dish_ingredients WHERE dish_id = ?1", params![id])
            .map_err(|e| format!("Failed to delete old ingredients: {}", e))?;

        for ingredient in &item.ingredients {
            conn.execute(
                "INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES (?1, ?2, ?3)",
                params![id, ingredient.ingredient_id, ingredient.amount],
            ).map_err(|e| format!("Failed to add ingredient to dish: {}", e))?;
        }

        Ok(())
    }

    fn delete(&self, conn: &rusqlite::Connection, id: i64) -> Result<(), String> {
        conn.execute(
            "DELETE FROM dish_ingredients WHERE dish_id = ?1",
            params![id],
        ).map_err(|e| format!("Failed to delete dish ingredients: {}", e))?;

        conn.execute("DELETE FROM dishes WHERE id = ?1", params![id])
            .map_err(|e| format!("Failed to delete dish: {}", e))?;

        Ok(())
    }
}
