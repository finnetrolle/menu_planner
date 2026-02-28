use rusqlite::params;
use crate::models::Goals;
use crate::repositories::Repository;
use validator::Validate;

/// Репозиторий для работы с целями (Goals)
pub struct GoalsRepository;

impl Repository<Goals> for GoalsRepository {
    fn get_by_id(&self, conn: &rusqlite::Connection, id: i64) -> Result<Option<Goals>, String> {
        let result = conn.query_row(
            "SELECT id, protein, fat, carbohydrates FROM goals WHERE id = ?1",
            params![id],
            |row: &rusqlite::Row| {
                Ok(Goals {
                    id: Some(row.get(0)?),
                    protein: row.get(1)?,
                    fat: row.get(2)?,
                    carbohydrates: row.get(3)?,
                })
            }
        ).ok();

        Ok(result)
    }

    fn get_all(&self, conn: &rusqlite::Connection) -> Result<Vec<Goals>, String> {
        let mut stmt = conn.prepare("SELECT id, protein, fat, carbohydrates FROM goals")
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let goals_rows = stmt.query_map([], |row: &rusqlite::Row| {
            Ok(Goals {
                id: Some(row.get(0)?),
                protein: row.get(1)?,
                fat: row.get(2)?,
                carbohydrates: row.get(3)?,
            })
        }).map_err(|e| format!("Failed to query goals: {}", e))?;

        let goals = goals_rows.collect::<Result<Vec<_>, rusqlite::Error>>()
            .map_err(|e| format!("Failed to collect goals: {}", e))?;

        Ok(goals)
    }

    fn create(&self, conn: &rusqlite::Connection, item: &Goals) -> Result<i64, String> {
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

        conn.execute(
            "INSERT INTO goals (id, protein, fat, carbohydrates) VALUES (1, ?1, ?2, ?3)",
            params![item.protein, item.fat, item.carbohydrates],
        ).map_err(|e| format!("Failed to create goals: {}", e))?;

        Ok(1)
    }

    fn update(&self, conn: &rusqlite::Connection, id: i64, item: &Goals) -> Result<(), String> {
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

        conn.execute(
            "UPDATE goals SET protein = ?1, fat = ?2, carbohydrates = ?3 WHERE id = ?4",
            params![item.protein, item.fat, item.carbohydrates, id],
        ).map_err(|e| format!("Failed to update goals: {}", e))?;

        Ok(())
    }

    fn delete(&self, conn: &rusqlite::Connection, id: i64) -> Result<(), String> {
        conn.execute("DELETE FROM goals WHERE id = ?1", params![id])
            .map_err(|e| format!("Failed to delete goals: {}", e))?;

        Ok(())
    }
}

impl GoalsRepository {
    /// Получить текущие цели (всегда id=1)
    pub fn get_current(&self, conn: &rusqlite::Connection) -> Result<Option<Goals>, String> {
        self.get_by_id(conn, 1)
    }

    /// Сохранить цели (создать или обновить запись с id=1)
    pub fn save(&self, conn: &rusqlite::Connection, goals: &Goals) -> Result<(), String> {
        // Валидация данных перед сохранением
        if let Err(errors) = goals.validate() {
            let error_messages: Vec<String> = errors
                .field_errors()
                .iter()
                .flat_map(|(field, errors)| {
                    errors.iter().map(move |e| format!("{}: {}", field, e.code))
                })
                .collect();
            return Err(error_messages.join("; "));
        }

        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM goals WHERE id = 1",
            [],
            |row| row.get(0)
        ).map_err(|e| format!("Failed to check goals: {}", e))?;

        if count > 0 {
            self.update(conn, 1, goals)
        } else {
            self.create(conn, goals)?;
            Ok(())
        }
    }
}
