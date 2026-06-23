use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct DishIngredient {
    #[validate(range(
        min = 0.0,
        message = "Количество ингредиента должно быть положительным числом"
    ))]
    pub amount: f64,

    pub ingredient_id: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct Dish {
    pub id: Option<i64>,

    #[validate(length(min = 1, message = "Название блюда не может быть пустым"))]
    pub name: String,

    #[validate(range(min = 0.0, message = "Вес блюда должен быть положительным числом"))]
    pub weight: Option<f64>,

    #[validate(length(min = 1, message = "Блюдо должно содержать минимум один ингредиент"))]
    pub ingredients: Vec<DishIngredient>,
}
