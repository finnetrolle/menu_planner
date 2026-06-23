use crate::error::{AppError, AppResult};
use crate::models::{Dish, DishIngredient};
use crate::repositories::Repository;
use rusqlite::{params, OptionalExtension};
use std::collections::{HashMap, HashSet};
use validator::{Validate, ValidationError};

/// Репозиторий для работы с блюдами
pub struct DishRepository;

impl Repository<Dish> for DishRepository {
    fn get_by_id(&self, conn: &rusqlite::Connection, id: i64) -> AppResult<Option<Dish>> {
        let mut stmt = conn
            .prepare(
                "SELECT d.id, d.name, d.weight, di.ingredient_id, di.amount
                 FROM dishes d
                 LEFT JOIN dish_ingredients di ON d.id = di.dish_id
                 WHERE d.id = ?1",
            )
            .map_err(|e| AppError::database(format!("Failed to prepare statement: {}", e)))?;

        let dish_rows = stmt
            .query_map(params![id], |row: &rusqlite::Row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, Option<f64>>(2)?,
                    row.get::<_, Option<i64>>(3)?,
                    row.get::<_, Option<f64>>(4)?,
                ))
            })
            .map_err(|e| AppError::database(format!("Failed to query dish: {}", e)))?;

        let mut dish_opt: Option<Dish> = None;

        for dish_row in dish_rows {
            let (dish_id, dish_name, dish_weight, ingredient_id_opt, amount_opt) = dish_row
                .map_err(|e| AppError::database(format!("Failed to process dish row: {}", e)))?;

            if let Some(dish) = dish_opt.as_mut() {
                if let (Some(ingredient_id), Some(amount)) = (ingredient_id_opt, amount_opt) {
                    dish.ingredients.push(DishIngredient {
                        ingredient_id,
                        amount,
                    });
                }
            } else {
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

    fn get_all(&self, conn: &rusqlite::Connection) -> AppResult<Vec<Dish>> {
        let mut stmt = conn
            .prepare(
                "SELECT d.id, d.name, d.weight, di.ingredient_id, di.amount
                 FROM dishes d
                 LEFT JOIN dish_ingredients di ON d.id = di.dish_id
                 ORDER BY d.name",
            )
            .map_err(|e| AppError::database(format!("Failed to prepare statement: {}", e)))?;

        let dish_rows = stmt
            .query_map([], |row: &rusqlite::Row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, Option<f64>>(2)?,
                    row.get::<_, Option<i64>>(3)?,
                    row.get::<_, Option<f64>>(4)?,
                ))
            })
            .map_err(|e| AppError::database(format!("Failed to query dishes: {}", e)))?;

        let mut dishes_map: HashMap<i64, Dish> = HashMap::new();

        for dish_row in dish_rows {
            let (dish_id, dish_name, dish_weight, ingredient_id_opt, amount_opt) = dish_row
                .map_err(|e| AppError::database(format!("Failed to process dish row: {}", e)))?;

            if let Some(dish) = dishes_map.get_mut(&dish_id) {
                if let (Some(ingredient_id), Some(amount)) = (ingredient_id_opt, amount_opt) {
                    dish.ingredients.push(DishIngredient {
                        ingredient_id,
                        amount,
                    });
                }
            } else {
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

        let mut dishes: Vec<Dish> = dishes_map.into_values().collect();
        dishes.sort_by(|a, b| a.name.cmp(&b.name));

        Ok(dishes)
    }

    fn create(&self, conn: &rusqlite::Connection, item: &Dish) -> AppResult<i64> {
        validate_dish(item)?;

        if dish_name_exists(conn, &item.name, None)? {
            return Err(AppError::duplicate("dish", "name", item.name.clone()));
        }

        let tx = conn
            .unchecked_transaction()
            .map_err(|e| AppError::database(format!("Failed to start transaction: {}", e)))?;

        tx.execute(
            "INSERT INTO dishes (name, weight) VALUES (?1, ?2)",
            params![item.name, item.weight],
        )
        .map_err(|e| AppError::database(format!("Failed to create dish: {}", e)))?;

        let dish_id = tx.last_insert_rowid();

        for ingredient in &item.ingredients {
            tx.execute(
                "INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES (?1, ?2, ?3)",
                params![dish_id, ingredient.ingredient_id, ingredient.amount],
            )
            .map_err(|e| AppError::database(format!("Failed to add ingredient to dish: {}", e)))?;
        }

        tx.commit()
            .map_err(|e| AppError::database(format!("Failed to commit dish creation: {}", e)))?;

        Ok(dish_id)
    }

    fn update(&self, conn: &rusqlite::Connection, id: i64, item: &Dish) -> AppResult<()> {
        validate_dish(item)?;

        if dish_name_exists(conn, &item.name, Some(id))? {
            return Err(AppError::duplicate("dish", "name", item.name.clone()));
        }

        let tx = conn
            .unchecked_transaction()
            .map_err(|e| AppError::database(format!("Failed to start transaction: {}", e)))?;

        let updated_rows = tx
            .execute(
                "UPDATE dishes SET name = ?1, weight = ?2 WHERE id = ?3",
                params![item.name, item.weight, id],
            )
            .map_err(|e| AppError::database(format!("Failed to update dish: {}", e)))?;

        if updated_rows == 0 {
            return Err(AppError::not_found("dish", id));
        }

        tx.execute(
            "DELETE FROM dish_ingredients WHERE dish_id = ?1",
            params![id],
        )
        .map_err(|e| AppError::database(format!("Failed to delete old ingredients: {}", e)))?;

        for ingredient in &item.ingredients {
            tx.execute(
                "INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES (?1, ?2, ?3)",
                params![id, ingredient.ingredient_id, ingredient.amount],
            )
            .map_err(|e| AppError::database(format!("Failed to add ingredient to dish: {}", e)))?;
        }

        tx.commit()
            .map_err(|e| AppError::database(format!("Failed to commit dish update: {}", e)))?;

        Ok(())
    }

    fn delete(&self, conn: &rusqlite::Connection, id: i64) -> AppResult<()> {
        let deleted_rows = conn
            .execute("DELETE FROM dishes WHERE id = ?1", params![id])
            .map_err(|e| AppError::database(format!("Failed to delete dish: {}", e)))?;

        if deleted_rows == 0 {
            return Err(AppError::not_found("dish", id));
        }

        Ok(())
    }
}

fn validate_dish(item: &Dish) -> AppResult<()> {
    if let Err(errors) = item.validate() {
        let error_messages: Vec<String> = errors
            .field_errors()
            .iter()
            .flat_map(|(_, errors)| errors.iter().map(validation_error_message))
            .collect();
        return Err(AppError::validation(error_messages.join("; ")));
    }

    for (index, ingredient) in item.ingredients.iter().enumerate() {
        if let Err(errors) = ingredient.validate() {
            let error_messages: Vec<String> = errors
                .field_errors()
                .iter()
                .flat_map(|(_, errors)| {
                    errors
                        .iter()
                        .map(move |e| {
                            format!(
                                "Ингредиент {}: {}",
                                index + 1,
                                validation_error_message(e)
                            )
                        })
                })
                .collect();
            return Err(AppError::validation(error_messages.join("; ")));
        }
    }

    validate_duplicate_ingredients(item)
}

fn validate_duplicate_ingredients(item: &Dish) -> AppResult<()> {
    let mut seen_ids = HashSet::with_capacity(item.ingredients.len());

    for ingredient in &item.ingredients {
        if !seen_ids.insert(ingredient.ingredient_id) {
            return Err(AppError::duplicate(
                "dish_ingredient",
                "ingredient_id",
                ingredient.ingredient_id.to_string(),
            ));
        }
    }

    Ok(())
}

fn dish_name_exists(
    conn: &rusqlite::Connection,
    name: &str,
    exclude_id: Option<i64>,
) -> AppResult<bool> {
    let existing_id = match exclude_id {
        Some(id) => conn
            .query_row(
                "SELECT id FROM dishes WHERE name = ?1 AND id != ?2",
                params![name, id],
                |row| row.get::<_, i64>(0),
            )
            .optional(),
        None => conn
            .query_row(
                "SELECT id FROM dishes WHERE name = ?1",
                params![name],
                |row| row.get::<_, i64>(0),
            )
            .optional(),
    }
    .map_err(|e| AppError::database(format!("Failed to check dish uniqueness: {}", e)))?;

    Ok(existing_id.is_some())
}

fn validation_error_message(error: &ValidationError) -> String {
    error
        .message
        .as_ref()
        .map(|message| message.to_string())
        .unwrap_or_else(|| error.code.to_string())
}
