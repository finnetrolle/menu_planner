use serde::{Deserialize, Serialize};
use crate::models::{Ingredient, Dish};
use rusqlite::Connection;

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
        NutritionInfo {
            calories,
            protein,
            fat,
            carbohydrates,
        }
    }

    /// Умножить все значения на коэффициент
    pub fn multiply(&self, factor: f64) -> Self {
        NutritionInfo {
            calories: self.calories * factor,
            protein: self.protein * factor,
            fat: self.fat * factor,
            carbohydrates: self.carbohydrates * factor,
        }
    }

    /// Сложить с другой NutritionInfo
    pub fn add(&self, other: &NutritionInfo) -> Self {
        NutritionInfo {
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

/// Структура для выбранного блюда
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectedDish {
    pub dish_id: i64,
    pub portions: f64,
}

/// Структура для итоговой нутриции меню
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MenuNutrition {
    pub total: NutritionInfo,
    pub items: Vec<DishNutrition>,
}

/// Сервис для расчета нутриции
pub struct NutritionService;

impl NutritionService {
    /// Рассчитать нутрицию ингредиента по количеству
    pub fn calculate_ingredient_nutrition(
        ingredient: &Ingredient,
        amount: f64,
    ) -> NutritionInfo {
        let base = NutritionInfo::from_macros(
            ingredient.protein,
            ingredient.fat,
            ingredient.carbohydrates,
        );
        // Нутриция ингредиента на 100г, умножаем на коэффициент
        let factor = amount / 100.0;
        base.multiply(factor)
    }

    /// Рассчитать нутрицию блюда
    pub fn calculate_dish_nutrition(
        _conn: &Connection,
        dish: &Dish,
        ingredients_map: &std::collections::HashMap<i64, Ingredient>,
    ) -> Option<DishNutrition> {
        let dish_id = dish.id?;
        let mut total = NutritionInfo::from_macros(0.0, 0.0, 0.0);
        let mut total_weight = 0.0;

        for di in &dish.ingredients {
            if let Some(ingredient) = ingredients_map.get(&di.ingredient_id) {
                let ing_nutrition =
                    Self::calculate_ingredient_nutrition(ingredient, di.amount);
                total = total.add(&ing_nutrition);
                total_weight += di.amount;
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

    /// Рассчитать нутрицию для списка блюд
    pub fn calculate_dishes_nutrition(
        conn: &Connection,
        dishes: &[Dish],
    ) -> Result<Vec<DishNutrition>, String> {
        // Загружаем все ингредиенты одним запросом
        let mut stmt = conn
            .prepare("SELECT id, name, protein, fat, carbohydrates FROM ingredients")
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

        let ingredients: std::collections::HashMap<i64, Ingredient> = ingredient_rows
            .filter_map(|r| r.ok())
            .filter_map(|ing| {
                let id = ing.id?;
                Some((id, ing))
            })
            .collect();

        Ok(dishes
            .iter()
            .filter_map(|dish| Self::calculate_dish_nutrition(conn, dish, &ingredients))
            .collect())
    }
}
