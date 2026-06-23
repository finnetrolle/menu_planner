export interface NutritionInfo {
  protein: number
  fat: number
  carbohydrates: number
}

export interface NutritionSummary {
  calories: number
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

export interface SelectedDishInput {
  dish_id: number
  portions: number
}

export interface MenuPlanRequest {
  selected_dishes: SelectedDishInput[]
  goals?: Omit<Goals, 'id'> | null
}

export interface GoalComparisonValue {
  current: number
  target: number
  difference: number
  percentage: number
}

export interface MenuGoalComparison {
  calories: GoalComparisonValue
  protein: GoalComparisonValue
  fat: GoalComparisonValue
  carbohydrates: GoalComparisonValue
}

export interface MenuPlanItem {
  dish_id: number
  name: string
  portions: number
  weight: number
  calories: number
  protein: number
  fat: number
  carbohydrates: number
}

export interface ShoppingListItem {
  ingredient_id: number
  ingredient_name: string
  amount: number
}

export interface MenuPlanResult {
  total_nutrition: NutritionSummary
  goals: Goals | null
  goal_comparison: MenuGoalComparison | null
  items: MenuPlanItem[]
  shopping_list: ShoppingListItem[]
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
