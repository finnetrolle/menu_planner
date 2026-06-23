use crate::error::AppResult;
use crate::models::{Dish, Goals};
use crate::services::nutrition_service::{DishNutrition, NutritionInfo, NutritionService};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashMap};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectedDish {
    pub dish_id: i64,
    pub portions: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MenuPlanRequest {
    pub selected_dishes: Vec<SelectedDish>,
    pub goals: Option<Goals>,
}

/// Структура для списка покупок
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShoppingListItem {
    pub ingredient_id: i64,
    pub ingredient_name: String,
    pub amount: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoalComparisonValue {
    pub current: f64,
    pub target: f64,
    pub difference: f64,
    pub percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MenuGoalComparison {
    pub calories: GoalComparisonValue,
    pub protein: GoalComparisonValue,
    pub fat: GoalComparisonValue,
    pub carbohydrates: GoalComparisonValue,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MenuPlanItem {
    pub dish_id: i64,
    pub name: String,
    pub portions: f64,
    pub weight: f64,
    pub calories: f64,
    pub protein: f64,
    pub fat: f64,
    pub carbohydrates: f64,
}

/// Структура для результата планирования меню
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MenuPlanResult {
    pub total_nutrition: NutritionInfo,
    pub goals: Option<Goals>,
    pub goal_comparison: Option<MenuGoalComparison>,
    pub items: Vec<MenuPlanItem>,
    pub shopping_list: Vec<ShoppingListItem>,
}

/// Сервис для расчета планов питания
pub struct MenuService;

impl MenuService {
    /// Создать полный план питания с totals, items, shopping list и сравнением с целями.
    pub fn build_menu_plan(
        conn: &Connection,
        request: &MenuPlanRequest,
        dishes: &[Dish],
    ) -> AppResult<MenuPlanResult> {
        let ingredients_map = NutritionService::load_ingredients_map(conn)?;
        let dishes_by_id: HashMap<i64, &Dish> = dishes
            .iter()
            .filter_map(|dish| dish.id.map(|dish_id| (dish_id, dish)))
            .collect();

        let mut total_nutrition = NutritionInfo::from_macros(0.0, 0.0, 0.0);
        let mut items = Vec::with_capacity(request.selected_dishes.len());
        let mut shopping_list = BTreeMap::<(String, i64), f64>::new();

        for selected_dish in &request.selected_dishes {
            let Some(dish) = dishes_by_id.get(&selected_dish.dish_id) else {
                continue;
            };

            let portions = normalize_portions(selected_dish.portions);

            if let Some(dish_nutrition) =
                NutritionService::calculate_dish_nutrition(dish, &ingredients_map)
            {
                let scaled_nutrition = dish_nutrition.multiply(portions);
                total_nutrition = total_nutrition.add(&scaled_nutrition.as_nutrition_info());
                items.push(menu_plan_item_from_dish_nutrition(
                    &scaled_nutrition,
                    portions,
                ));
            }

            for dish_ingredient in &dish.ingredients {
                let Some(ingredient) = ingredients_map.get(&dish_ingredient.ingredient_id) else {
                    continue;
                };

                let key = (ingredient.name.clone(), dish_ingredient.ingredient_id);
                *shopping_list.entry(key).or_insert(0.0) += dish_ingredient.amount * portions;
            }
        }

        let goals = request.goals.clone();
        let goal_comparison = goals
            .as_ref()
            .map(|target_goals| compare_nutrition_against_goals(&total_nutrition, target_goals));

        Ok(MenuPlanResult {
            total_nutrition,
            goals,
            goal_comparison,
            items,
            shopping_list: shopping_list
                .into_iter()
                .map(
                    |((ingredient_name, ingredient_id), amount)| ShoppingListItem {
                        ingredient_id,
                        ingredient_name,
                        amount,
                    },
                )
                .collect(),
        })
    }
}

fn menu_plan_item_from_dish_nutrition(
    dish_nutrition: &DishNutrition,
    portions: f64,
) -> MenuPlanItem {
    MenuPlanItem {
        dish_id: dish_nutrition.id,
        name: dish_nutrition.name.clone(),
        portions,
        weight: dish_nutrition.weight,
        calories: dish_nutrition.calories,
        protein: dish_nutrition.protein,
        fat: dish_nutrition.fat,
        carbohydrates: dish_nutrition.carbohydrates,
    }
}

fn compare_nutrition_against_goals(current: &NutritionInfo, goals: &Goals) -> MenuGoalComparison {
    let target = NutritionInfo::from_macros(goals.protein, goals.fat, goals.carbohydrates);

    MenuGoalComparison {
        calories: compare_value(current.calories, target.calories),
        protein: compare_value(current.protein, target.protein),
        fat: compare_value(current.fat, target.fat),
        carbohydrates: compare_value(current.carbohydrates, target.carbohydrates),
    }
}

fn compare_value(current: f64, target: f64) -> GoalComparisonValue {
    GoalComparisonValue {
        current,
        target,
        difference: current - target,
        percentage: if target > 0.0 {
            (current / target) * 100.0
        } else {
            0.0
        },
    }
}

fn normalize_portions(portions: f64) -> f64 {
    if portions > 0.0 {
        portions
    } else {
        1.0
    }
}
