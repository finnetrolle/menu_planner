use crate::error::{AppError, AppResult};
use crate::models::Goals;
use crate::repositories::Repository;
use rusqlite::{params, OptionalExtension};
use validator::{Validate, ValidationError};

/// Репозиторий для работы с целями (Goals)
pub struct GoalsRepository;

impl Repository<Goals> for GoalsRepository {
    fn get_by_id(&self, conn: &rusqlite::Connection, id: i64) -> AppResult<Option<Goals>> {
        let result = conn
            .query_row(
                "SELECT id, protein, fat, carbohydrates FROM goals WHERE id = ?1",
                params![id],
                |row: &rusqlite::Row| {
                    Ok(Goals {
                        id: Some(row.get(0)?),
                        protein: row.get(1)?,
                        fat: row.get(2)?,
                        carbohydrates: row.get(3)?,
                    })
                },
            )
            .optional()
            .map_err(|e| AppError::database(format!("Failed to query goals: {}", e)))?;

        Ok(result)
    }

    fn get_all(&self, conn: &rusqlite::Connection) -> AppResult<Vec<Goals>> {
        let mut stmt = conn
            .prepare("SELECT id, protein, fat, carbohydrates FROM goals")
            .map_err(|e| AppError::database(format!("Failed to prepare statement: {}", e)))?;

        let goals_rows = stmt
            .query_map([], |row: &rusqlite::Row| {
                Ok(Goals {
                    id: Some(row.get(0)?),
                    protein: row.get(1)?,
                    fat: row.get(2)?,
                    carbohydrates: row.get(3)?,
                })
            })
            .map_err(|e| AppError::database(format!("Failed to query goals: {}", e)))?;

        let goals = goals_rows
            .collect::<Result<Vec<_>, rusqlite::Error>>()
            .map_err(|e| AppError::database(format!("Failed to collect goals: {}", e)))?;

        Ok(goals)
    }

    fn create(&self, conn: &rusqlite::Connection, item: &Goals) -> AppResult<i64> {
        validate_goals(item)?;

        conn.execute(
            "INSERT INTO goals (id, protein, fat, carbohydrates) VALUES (1, ?1, ?2, ?3)",
            params![item.protein, item.fat, item.carbohydrates],
        )
        .map_err(|e| AppError::database(format!("Failed to create goals: {}", e)))?;

        Ok(1)
    }

    fn update(&self, conn: &rusqlite::Connection, id: i64, item: &Goals) -> AppResult<()> {
        validate_goals(item)?;

        let updated_rows = conn
            .execute(
                "UPDATE goals SET protein = ?1, fat = ?2, carbohydrates = ?3 WHERE id = ?4",
                params![item.protein, item.fat, item.carbohydrates, id],
            )
            .map_err(|e| AppError::database(format!("Failed to update goals: {}", e)))?;

        if updated_rows == 0 {
            return Err(AppError::not_found("goals", id));
        }

        Ok(())
    }

    fn delete(&self, conn: &rusqlite::Connection, id: i64) -> AppResult<()> {
        let deleted_rows = conn
            .execute("DELETE FROM goals WHERE id = ?1", params![id])
            .map_err(|e| AppError::database(format!("Failed to delete goals: {}", e)))?;

        if deleted_rows == 0 {
            return Err(AppError::not_found("goals", id));
        }

        Ok(())
    }
}

impl GoalsRepository {
    /// Получить текущие цели (всегда id=1)
    pub fn get_current(&self, conn: &rusqlite::Connection) -> AppResult<Option<Goals>> {
        self.get_by_id(conn, 1)
    }

    /// Сохранить цели (создать или обновить запись с id=1)
    pub fn save(&self, conn: &rusqlite::Connection, goals: &Goals) -> AppResult<()> {
        validate_goals(goals)?;

        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM goals WHERE id = 1", [], |row| {
                row.get(0)
            })
            .map_err(|e| AppError::database(format!("Failed to check goals: {}", e)))?;

        if count > 0 {
            self.update(conn, 1, goals)
        } else {
            self.create(conn, goals)?;
            Ok(())
        }
    }
}

fn validate_goals(goals: &Goals) -> AppResult<()> {
    if let Err(errors) = goals.validate() {
        let error_messages: Vec<String> = errors
            .field_errors()
            .iter()
            .flat_map(|(_, errors)| errors.iter().map(validation_error_message))
            .collect();
        return Err(AppError::validation(error_messages.join("; ")));
    }

    Ok(())
}

fn validation_error_message(error: &ValidationError) -> String {
    error
        .message
        .as_ref()
        .map(|message| message.to_string())
        .unwrap_or_else(|| error.code.to_string())
}
