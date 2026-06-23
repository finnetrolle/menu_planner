use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct Ingredient {
    pub id: Option<i64>,

    #[validate(length(min = 1, message = "Название не может быть пустым"))]
    pub name: String,

    #[validate(range(
        min = 0.0,
        max = 100.0,
        message = "Количество белков должно быть от 0 до 100"
    ))]
    pub protein: f64,

    #[validate(range(
        min = 0.0,
        max = 100.0,
        message = "Количество жиров должно быть от 0 до 100"
    ))]
    pub fat: f64,

    #[validate(range(
        min = 0.0,
        max = 100.0,
        message = "Количество углеводов должно быть от 0 до 100"
    ))]
    pub carbohydrates: f64,
}
