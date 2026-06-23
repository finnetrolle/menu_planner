use crate::error::{AppError, AppResult};
use crate::models::Ingredient;
use crate::repositories::Repository;
use rusqlite::{params, OptionalExtension};
use validator::{Validate, ValidationError};

/// Репозиторий для работы с ингредиентами
pub struct IngredientRepository;

impl Repository<Ingredient> for IngredientRepository {
    fn get_by_id(&self, conn: &rusqlite::Connection, id: i64) -> AppResult<Option<Ingredient>> {
        let mut stmt = conn
            .prepare("SELECT id, name, protein, fat, carbohydrates FROM ingredients WHERE id = ?1")
            .map_err(|e| AppError::database(format!("Failed to prepare statement: {}", e)))?;

        let result = stmt
            .query_row(params![id], |row: &rusqlite::Row| {
                Ok(Ingredient {
                    id: Some(row.get(0)?),
                    name: row.get(1)?,
                    protein: row.get(2)?,
                    fat: row.get(3)?,
                    carbohydrates: row.get(4)?,
                })
            })
            .optional()
            .map_err(|e| AppError::database(format!("Failed to query ingredient: {}", e)))?;

        Ok(result)
    }

    fn get_all(&self, conn: &rusqlite::Connection) -> AppResult<Vec<Ingredient>> {
        let mut stmt = conn
            .prepare("SELECT id, name, protein, fat, carbohydrates FROM ingredients ORDER BY name")
            .map_err(|e| AppError::database(format!("Failed to prepare statement: {}", e)))?;

        let ingredient_rows = stmt
            .query_map([], |row: &rusqlite::Row| {
                Ok(Ingredient {
                    id: Some(row.get(0)?),
                    name: row.get(1)?,
                    protein: row.get(2)?,
                    fat: row.get(3)?,
                    carbohydrates: row.get(4)?,
                })
            })
            .map_err(|e| AppError::database(format!("Failed to query ingredients: {}", e)))?;

        let ingredients = ingredient_rows
            .collect::<Result<Vec<_>, rusqlite::Error>>()
            .map_err(|e| AppError::database(format!("Failed to collect ingredients: {}", e)))?;

        Ok(ingredients)
    }

    fn create(&self, conn: &rusqlite::Connection, item: &Ingredient) -> AppResult<i64> {
        validate_ingredient(item)?;

        if ingredient_name_exists(conn, &item.name, None)? {
            return Err(AppError::duplicate("ingredient", "name", item.name.clone()));
        }

        conn.execute(
            "INSERT INTO ingredients (name, protein, fat, carbohydrates) VALUES (?1, ?2, ?3, ?4)",
            params![item.name, item.protein, item.fat, item.carbohydrates],
        )
        .map_err(|e| AppError::database(format!("Failed to create ingredient: {}", e)))?;

        Ok(conn.last_insert_rowid())
    }

    fn update(&self, conn: &rusqlite::Connection, id: i64, item: &Ingredient) -> AppResult<()> {
        validate_ingredient(item)?;

        if ingredient_name_exists(conn, &item.name, Some(id))? {
            return Err(AppError::duplicate("ingredient", "name", item.name.clone()));
        }

        let updated_rows = conn
            .execute(
                "UPDATE ingredients SET name = ?1, protein = ?2, fat = ?3, carbohydrates = ?4 WHERE id = ?5",
                params![item.name, item.protein, item.fat, item.carbohydrates, id],
            )
            .map_err(|e| AppError::database(format!("Failed to update ingredient: {}", e)))?;

        if updated_rows == 0 {
            return Err(AppError::not_found("ingredient", id));
        }

        Ok(())
    }

    fn delete(&self, conn: &rusqlite::Connection, id: i64) -> AppResult<()> {
        let deleted_rows = conn
            .execute("DELETE FROM ingredients WHERE id = ?1", params![id])
            .map_err(|e| AppError::database(format!("Failed to delete ingredient: {}", e)))?;

        if deleted_rows == 0 {
            return Err(AppError::not_found("ingredient", id));
        }

        Ok(())
    }
}

fn validate_ingredient(item: &Ingredient) -> AppResult<()> {
    if let Err(errors) = item.validate() {
        let error_messages: Vec<String> = errors
            .field_errors()
            .iter()
            .flat_map(|(_, errors)| errors.iter().map(validation_error_message))
            .collect();
        return Err(AppError::validation(error_messages.join("; ")));
    }

    Ok(())
}

fn ingredient_name_exists(
    conn: &rusqlite::Connection,
    name: &str,
    exclude_id: Option<i64>,
) -> AppResult<bool> {
    let existing_id = match exclude_id {
        Some(id) => conn
            .query_row(
                "SELECT id FROM ingredients WHERE name = ?1 AND id != ?2",
                params![name, id],
                |row| row.get::<_, i64>(0),
            )
            .optional(),
        None => conn
            .query_row(
                "SELECT id FROM ingredients WHERE name = ?1",
                params![name],
                |row| row.get::<_, i64>(0),
            )
            .optional(),
    }
    .map_err(|e| AppError::database(format!("Failed to check ingredient uniqueness: {}", e)))?;

    Ok(existing_id.is_some())
}

fn validation_error_message(error: &ValidationError) -> String {
    error
        .message
        .as_ref()
        .map(|message| message.to_string())
        .unwrap_or_else(|| error.code.to_string())
}
