use thiserror::Error;

/// Ошибки приложения
#[derive(Debug, Error)]
pub enum AppError {
    #[error("Ошибка базы данных: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("Ошибка валидации: {0}")]
    Validation(String),

    #[error("Не найдено: {entity} с id {id}")]
    NotFound { entity: String, id: i64 },

    #[error("Дубликат: {entity} с именем '{name}' уже существует")]
    Duplicate { entity: String, name: String },
}

// Преобразование AppError в String для Tauri commands
impl From<AppError> for String {
    fn from(error: AppError) -> Self {
        error.to_string()
    }
}
