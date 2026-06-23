use crate::error::{AppError, AppResult};
use crate::models::{Dish, Ingredient};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Структура для хранения нутриционной информации
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NutritionInfo {
    pub calories: f64,
    pub protein: f64,
    pub fat: f64,
    pub carbohydrates: f64,
}

impl NutritionInfo {
    /// Создать NutritionInfo из макросов (правило 4-9-4)
    pub fn from_macros(protein: f64, fat: f64, carbohydrates: f64) -> Self {
        let calories = protein * 4.0 + fat * 9.0 + carbohydrates * 4.0;

        Self {
            calories,
            protein,
            fat,
            carbohydrates,
        }
    }

    /// Умножить все значения на коэффициент
    pub fn multiply(&self, factor: f64) -> Self {
        Self {
            calories: self.calories * factor,
            protein: self.protein * factor,
            fat: self.fat * factor,
            carbohydrates: self.carbohydrates * factor,
        }
    }

    /// Сложить с другой NutritionInfo
    pub fn add(&self, other: &NutritionInfo) -> Self {
        Self {
            calories: self.calories + other.calories,
            protein: self.protein + other.protein,
            fat: self.fat + other.fat,
            carbohydrates: self.carbohydrates + other.carbohydrates,
        }
    }
}

/// Структура для хранения нутриции блюда
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DishNutrition {
    pub id: i64,
    pub name: String,
    pub weight: f64,
    pub calories: f64,
    pub protein: f64,
    pub fat: f64,
    pub carbohydrates: f64,
}

impl DishNutrition {
    pub fn multiply(&self, factor: f64) -> Self {
        Self {
            id: self.id,
            name: self.name.clone(),
            weight: self.weight * factor,
            calories: self.calories * factor,
            protein: self.protein * factor,
            fat: self.fat * factor,
            carbohydrates: self.carbohydrates * factor,
        }
    }

    pub fn as_nutrition_info(&self) -> NutritionInfo {
        NutritionInfo {
            calories: self.calories,
            protein: self.protein,
            fat: self.fat,
            carbohydrates: self.carbohydrates,
        }
    }
}

/// Сервис для расчета нутриции
pub struct NutritionService;

impl NutritionService {
    /// Загрузить ингредиенты в память одним запросом.
    pub fn load_ingredients_map(conn: &Connection) -> AppResult<HashMap<i64, Ingredient>> {
        let mut stmt = conn
            .prepare("SELECT id, name, protein, fat, carbohydrates FROM ingredients")
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

        let mut ingredients_map = HashMap::new();

        for ingredient_row in ingredient_rows {
            let ingredient = ingredient_row
                .map_err(|e| AppError::database(format!("Failed to read ingredient row: {}", e)))?;

            if let Some(id) = ingredient.id {
                ingredients_map.insert(id, ingredient);
            }
        }

        Ok(ingredients_map)
    }

    /// Рассчитать нутрицию ингредиента по количеству.
    pub fn calculate_ingredient_nutrition(ingredient: &Ingredient, amount: f64) -> NutritionInfo {
        let factor = amount / 100.0;

        NutritionInfo::from_macros(ingredient.protein, ingredient.fat, ingredient.carbohydrates)
            .multiply(factor)
    }

    /// Рассчитать нутрицию блюда по карте ингредиентов.
    pub fn calculate_dish_nutrition(
        dish: &Dish,
        ingredients_map: &HashMap<i64, Ingredient>,
    ) -> Option<DishNutrition> {
        let dish_id = dish.id?;
        let mut total = NutritionInfo::from_macros(0.0, 0.0, 0.0);
        let mut total_weight = 0.0;

        for dish_ingredient in &dish.ingredients {
            if let Some(ingredient) = ingredients_map.get(&dish_ingredient.ingredient_id) {
                let ingredient_nutrition =
                    Self::calculate_ingredient_nutrition(ingredient, dish_ingredient.amount);
                total = total.add(&ingredient_nutrition);
                total_weight += dish_ingredient.amount;
            }
        }

        Some(DishNutrition {
            id: dish_id,
            name: dish.name.clone(),
            weight: total_weight,
            calories: total.calories,
            protein: total.protein,
            fat: total.fat,
            carbohydrates: total.carbohydrates,
        })
    }
}
