use crate::models::{Dish, Goals};
use crate::services::nutrition_service::{NutritionInfo, NutritionService, DishNutrition, SelectedDish};
use rusqlite::Connection;

/// Структура для списка покупок
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ShoppingListItem {
    pub ingredient_id: i64,
    pub ingredient_name: String,
    pub amount: f64,
}

/// Структура для результата планирования меню
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct MenuPlanResult {
    pub total_nutrition: NutritionInfo,
    pub goals: Option<Goals>,
    pub items: Vec<DishNutrition>,
    pub shopping_list: Vec<ShoppingListItem>,
}

/// Сервис для расчета планов питания
pub struct MenuService;

impl MenuService {
    /// Рассчитать нутрицию для списка выбранных блюд
    pub fn calculate_menu_nutrition(
        conn: &Connection,
        selected_dishes: &[SelectedDish],
        dishes: &[Dish],
    ) -> NutritionInfo {
        let mut total = NutritionInfo::from_macros(0.0, 0.0, 0.0);

        for selection in selected_dishes {
            if let Some(dish) = dishes.iter().find(|d| d.id == Some(selection.dish_id)) {
                let portions = selection.portions.max(1.0);
                let dish_nutrition = NutritionService::calculate_dish_nutrition(
                    conn,
                    dish,
                    &std::collections::HashMap::new(),
                );

                if let Some(dn) = dish_nutrition {
                    let dn_info = NutritionInfo::from_macros(
                        dn.protein,
                        dn.fat,
                        dn.carbohydrates,
                    );
                    total = total.add(&dn_info.multiply(portions));
                }
            }
        }

        total
    }

    /// Создать полный план питания с нутрицией и списком покупок
    pub fn create_menu_plan(
        conn: &Connection,
        selected_dishes: &[SelectedDish],
        dishes: &[Dish],
        goals: Option<&Goals>,
    ) -> MenuPlanResult {
        let total_nutrition =
            Self::calculate_menu_nutrition(conn, selected_dishes, dishes);

        let items: Vec<DishNutrition> = selected_dishes
            .iter()
            .filter_map(|selection| {
                if let Some(dish) = dishes.iter().find(|d| d.id == Some(selection.dish_id)) {
                    let portions = selection.portions.max(1.0);
                    let dish_nutrition = NutritionService::calculate_dish_nutrition(
                        conn,
                        dish,
                        &std::collections::HashMap::new(),
                    );
                    dish_nutrition.map(|mut dn| {
                        dn.calories *= portions;
                        dn.protein *= portions;
                        dn.fat *= portions;
                        dn.carbohydrates *= portions;
                        dn.weight *= portions;
                        dn
                    })
                } else {
                    None
                }
            })
            .collect();

        let shopping_list = Self::calculate_shopping_list(conn, selected_dishes, dishes);

        MenuPlanResult {
            total_nutrition,
            goals: goals.cloned(),
            items,
            shopping_list,
        }
    }

    /// Рассчитать список покупок на основе выбранных блюд
    pub fn calculate_shopping_list(
        conn: &Connection,
        selected_dishes: &[SelectedDish],
        dishes: &[Dish],
    ) -> Vec<ShoppingListItem> {
        use std::collections::HashMap;

        let mut ingredients_map: HashMap<i64, String> = HashMap::new();

        // Загружаем все ингредиенты в память
        if let Ok(mut stmt) = conn.prepare("SELECT id, name FROM ingredients") {
            if let Ok(rows) = stmt.query_map([], |row: &rusqlite::Row| {
                Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))
            }) {
                for row in rows.flatten() {
                    ingredients_map.insert(row.0, row.1);
                }
            }
        }

        let mut ingredient_amounts: HashMap<(i64, String), f64> = HashMap::new();

        for selection in selected_dishes {
            if let Some(dish) = dishes.iter().find(|d| d.id == Some(selection.dish_id)) {
                let portions = selection.portions.max(1.0);

                for di in &dish.ingredients {
                    if let Some(name) = ingredients_map.get(&di.ingredient_id) {
                        let key = (di.ingredient_id, name.clone());
                        *ingredient_amounts.entry(key).or_insert(0.0) +=
                            di.amount * portions;
                    }
                }
            }
        }

        ingredient_amounts
            .into_iter()
            .map(|((ingredient_id, ingredient_name), amount)| ShoppingListItem {
                ingredient_id,
                ingredient_name,
                amount,
            })
            .collect()
    }
}
