use crate::models::{Ingredient, Dish, Goals};
use crate::database::get_connection;
use crate::repositories::{IngredientRepository, DishRepository, GoalsRepository, Repository};
use crate::services::{MenuService, MenuPlanResult, SelectedDish};

// ==================== Ingredients ====================

#[tauri::command]
pub fn get_ingredients() -> Result<Vec<Ingredient>, String> {
    let conn = get_connection().map_err(|e| format!("Failed to open database: {}", e))?;
    let repo = IngredientRepository;
    repo.get_all(&conn)
}

#[tauri::command]
pub fn get_ingredient(id: i64) -> Result<Option<Ingredient>, String> {
    let conn = get_connection().map_err(|e| format!("Failed to open database: {}", e))?;
    let repo = IngredientRepository;
    repo.get_by_id(&conn, id)
}

#[tauri::command]
pub fn create_ingredient(ingredient: Ingredient) -> Result<i64, String> {
    let conn = get_connection().map_err(|e| format!("Failed to open database: {}", e))?;
    let repo = IngredientRepository;
    repo.create(&conn, &ingredient)
}

#[tauri::command]
pub fn update_ingredient(id: i64, ingredient: Ingredient) -> Result<(), String> {
    let conn = get_connection().map_err(|e| format!("Failed to open database: {}", e))?;
    let repo = IngredientRepository;
    repo.update(&conn, id, &ingredient)
}

#[tauri::command]
pub fn delete_ingredient(id: i64) -> Result<(), String> {
    let conn = get_connection().map_err(|e| format!("Failed to open database: {}", e))?;
    let repo = IngredientRepository;
    repo.delete(&conn, id)
}

// ==================== Dishes ====================

#[tauri::command]
pub fn get_dishes() -> Result<Vec<Dish>, String> {
    let conn = get_connection().map_err(|e| format!("Failed to open database: {}", e))?;
    let repo = DishRepository;
    repo.get_all(&conn)
}

#[tauri::command]
pub fn get_dish(id: i64) -> Result<Option<Dish>, String> {
    let conn = get_connection().map_err(|e| format!("Failed to open database: {}", e))?;
    let repo = DishRepository;
    repo.get_by_id(&conn, id)
}

#[tauri::command]
pub fn create_dish(dish: Dish) -> Result<i64, String> {
    let conn = get_connection().map_err(|e| format!("Failed to open database: {}", e))?;
    let repo = DishRepository;
    repo.create(&conn, &dish)
}

#[tauri::command]
pub fn update_dish(id: i64, dish: Dish) -> Result<(), String> {
    let conn = get_connection().map_err(|e| format!("Failed to open database: {}", e))?;
    let repo = DishRepository;
    repo.update(&conn, id, &dish)
}

#[tauri::command]
pub fn delete_dish(id: i64) -> Result<(), String> {
    let conn = get_connection().map_err(|e| format!("Failed to open database: {}", e))?;
    let repo = DishRepository;
    repo.delete(&conn, id)
}

// ==================== Goals ====================

#[tauri::command]
pub fn get_goals() -> Result<Option<Goals>, String> {
    let conn = get_connection().map_err(|e| format!("Failed to open database: {}", e))?;
    let repo = GoalsRepository;
    repo.get_current(&conn)
}

#[tauri::command]
pub fn save_goals(goals: Goals) -> Result<(), String> {
    let conn = get_connection().map_err(|e| format!("Failed to open database: {}", e))?;
    let repo = GoalsRepository;
    repo.save(&conn, &goals)
}

// ==================== Services ====================

#[tauri::command]
pub fn calculate_menu_nutrition(
    selected_dishes: Vec<SelectedDish>,
) -> Result<MenuPlanResult, String> {
    let conn = get_connection().map_err(|e| format!("Failed to open database: {}", e))?;

    // Получаем все блюда и цели
    let repo = DishRepository;
    let dishes = repo.get_all(&conn)?;

    let goals_repo = GoalsRepository;
    let goals = goals_repo.get_current(&conn)?;

    // Рассчитываем план питания
    let result = MenuService::create_menu_plan(&conn, &selected_dishes, &dishes, goals.as_ref());

    Ok(result)
}
