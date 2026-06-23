use serde::Serialize;
use std::fmt::{Display, Formatter};

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AppError {
    Validation(String),
    NotFound {
        entity: &'static str,
        id: i64,
    },
    Duplicate {
        entity: &'static str,
        field: &'static str,
        value: String,
    },
    Database(String),
}

impl AppError {
    pub fn validation(message: impl Into<String>) -> Self {
        Self::Validation(message.into())
    }

    pub fn not_found(entity: &'static str, id: i64) -> Self {
        Self::NotFound { entity, id }
    }

    pub fn duplicate(entity: &'static str, field: &'static str, value: impl Into<String>) -> Self {
        Self::Duplicate {
            entity,
            field,
            value: value.into(),
        }
    }

    pub fn database(message: impl Into<String>) -> Self {
        Self::Database(message.into())
    }

    pub fn kind(&self) -> &'static str {
        match self {
            Self::Validation(_) => "validation",
            Self::NotFound { .. } => "not_found",
            Self::Duplicate { .. } => "duplicate",
            Self::Database(_) => "database",
        }
    }
}

impl Display for AppError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Validation(message) => write!(f, "Ошибка валидации: {}", message),
            Self::NotFound { entity, id } => write!(f, "Не найдено: {} с id {}", entity, id),
            Self::Duplicate {
                entity,
                field,
                value,
            } => write!(
                f,
                "Дубликат: {} с {} '{}' уже существует",
                entity, field, value
            ),
            Self::Database(message) => write!(f, "Ошибка базы данных: {}", message),
        }
    }
}

impl std::error::Error for AppError {}

impl From<rusqlite::Error> for AppError {
    fn from(error: rusqlite::Error) -> Self {
        Self::Database(error.to_string())
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
    pub kind: &'static str,
    pub message: String,
    pub entity: Option<String>,
    pub id: Option<i64>,
    pub field: Option<String>,
    pub value: Option<String>,
}

impl From<AppError> for CommandError {
    fn from(error: AppError) -> Self {
        let kind = error.kind();
        let message = error.to_string();

        match error {
            AppError::Validation(_) => Self {
                kind,
                message,
                entity: None,
                id: None,
                field: None,
                value: None,
            },
            AppError::NotFound { entity, id } => Self {
                kind,
                message,
                entity: Some(entity.to_string()),
                id: Some(id),
                field: None,
                value: None,
            },
            AppError::Duplicate {
                entity,
                field,
                value,
            } => Self {
                kind,
                message,
                entity: Some(entity.to_string()),
                id: None,
                field: Some(field.to_string()),
                value: Some(value),
            },
            AppError::Database(_) => Self {
                kind,
                message,
                entity: None,
                id: None,
                field: None,
                value: None,
            },
        }
    }
}
