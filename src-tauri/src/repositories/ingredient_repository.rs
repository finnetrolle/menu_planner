use rusqlite::params;
use crate::models::Ingredient;
use crate::repositories::Repository;
use validator::Validate;

/// Репозиторий для работы с ингредиентами
pub struct IngredientRepository;

impl Repository<Ingredient> for IngredientRepository {
    fn get_by_id(&self, conn: &rusqlite::Connection, id: i64) -> Result<Option<Ingredient>, String> {
        let mut stmt = conn.prepare("SELECT id, name, protein, fat, carbohydrates FROM ingredients WHERE id = ?1")
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let result = stmt.query_row(params![id], |row: &rusqlite::Row| {
            Ok(Ingredient {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                protein: row.get(2)?,
                fat: row.get(3)?,
                carbohydrates: row.get(4)?,
            })
        }).ok();

        Ok(result)
    }

    fn get_all(&self, conn: &rusqlite::Connection) -> Result<Vec<Ingredient>, String> {
        let mut stmt = conn.prepare("SELECT id, name, protein, fat, carbohydrates FROM ingredients ORDER BY name")
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let ingredient_rows = stmt.query_map([], |row: &rusqlite::Row| {
            Ok(Ingredient {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                protein: row.get(2)?,
                fat: row.get(3)?,
                carbohydrates: row.get(4)?,
            })
        }).map_err(|e| format!("Failed to query ingredients: {}", e))?;

        let ingredients = ingredient_rows.collect::<Result<Vec<_>, rusqlite::Error>>()
            .map_err(|e| format!("Failed to collect ingredients: {}", e))?;

        Ok(ingredients)
    }

    fn create(&self, conn: &rusqlite::Connection, item: &Ingredient) -> Result<i64, String> {
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
            "INSERT INTO ingredients (name, protein, fat, carbohydrates) VALUES (?1, ?2, ?3, ?4)",
            params![item.name, item.protein, item.fat, item.carbohydrates],
        ).map_err(|e| format!("Failed to create ingredient: {}", e))?;

        Ok(conn.last_insert_rowid())
    }

    fn update(&self, conn: &rusqlite::Connection, id: i64, item: &Ingredient) -> Result<(), String> {
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
            "UPDATE ingredients SET name = ?1, protein = ?2, fat = ?3, carbohydrates = ?4 WHERE id = ?5",
            params![item.name, item.protein, item.fat, item.carbohydrates, id],
        ).map_err(|e| format!("Failed to update ingredient: {}", e))?;

        Ok(())
    }

    fn delete(&self, conn: &rusqlite::Connection, id: i64) -> Result<(), String> {
        conn.execute("DELETE FROM ingredients WHERE id = ?1", params![id])
            .map_err(|e| format!("Failed to delete ingredient: {}", e))?;

        Ok(())
    }
}
