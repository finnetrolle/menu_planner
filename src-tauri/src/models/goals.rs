use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct Goals {
    pub id: Option<i64>,

    #[validate(range(
        min = 0.0,
        max = 1000.0,
        message = "Количество белков должно быть от 0 до 1000"
    ))]
    pub protein: f64,

    #[validate(range(
        min = 0.0,
        max = 1000.0,
        message = "Количество жиров должно быть от 0 до 1000"
    ))]
    pub fat: f64,

    #[validate(range(
        min = 0.0,
        max = 1000.0,
        message = "Количество углеводов должно быть от 0 до 1000"
    ))]
    pub carbohydrates: f64,
}

impl Goals {
    #[allow(dead_code)]
    pub fn calories(&self) -> f64 {
        self.protein * 4.0 + self.fat * 9.0 + self.carbohydrates * 4.0
    }
}
