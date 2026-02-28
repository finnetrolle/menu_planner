export interface NutritionInfo {
  protein: number
  fat: number
  carbohydrates: number
}

// Сериализуемая структура для Tauri (соответствует Rust backend)
export interface Ingredient {
  id: number | null
  name: string
  protein: number
  fat: number
  carbohydrates: number
}

export interface DishIngredient {
  ingredient_id: number
  amount: number
}

export interface Dish {
  id: number | null
  name: string
  weight: number | null
  ingredients: DishIngredient[]
}

export interface IngredientWithId extends Ingredient {
  id: number
}

export interface DishWithId extends Dish {
  id: number
}

export interface Goals {
  id: number | null
  protein: number
  fat: number
  carbohydrates: number
}

// Вспомогательная функция для создания NutritionInfo из Ingredient
export function ingredientToNutritionInfo(ingredient: Ingredient): NutritionInfo {
  return {
    protein: ingredient.protein,
    fat: ingredient.fat,
    carbohydrates: ingredient.carbohydrates,
  }
}

// Функция для расчёта калорий по формуле 4-9-4
export function calculateCalories(protein: number, fat: number, carbohydrates: number): number {
  return protein * 4 + fat * 9 + carbohydrates * 4
}
