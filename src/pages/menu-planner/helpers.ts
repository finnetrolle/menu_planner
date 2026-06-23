import type {
  DishWithId,
  Goals,
  IngredientWithId,
  MenuPlanResult,
  NutritionSummary,
} from "@/types"

export const EMPTY_MENU_PLAN: MenuPlanResult = {
  total_nutrition: {
    calories: 0,
    protein: 0,
    fat: 0,
    carbohydrates: 0,
  },
  goals: null,
  goal_comparison: null,
  items: [],
  shopping_list: [],
}

export const GOAL_PRESETS: Array<Omit<Goals, "id"> & { name: string }> = [
  {
    name: "Похудение",
    protein: 150,
    fat: 60,
    carbohydrates: 180,
  },
  {
    name: "Поддержание",
    protein: 160,
    fat: 70,
    carbohydrates: 210,
  },
  {
    name: "Набор массы",
    protein: 200,
    fat: 90,
    carbohydrates: 260,
  },
]

export function calculateDishPreview(
  dish: DishWithId,
  portions: number,
  ingredientsById: Map<number, IngredientWithId>
): NutritionSummary {
  let protein = 0
  let fat = 0
  let carbohydrates = 0

  for (const dishIngredient of dish.ingredients) {
    const ingredient = ingredientsById.get(dishIngredient.ingredient_id)

    if (!ingredient) {
      continue
    }

    const ratio = (dishIngredient.amount / 100) * portions
    protein += ingredient.protein * ratio
    fat += ingredient.fat * ratio
    carbohydrates += ingredient.carbohydrates * ratio
  }

  return {
    calories: protein * 4 + fat * 9 + carbohydrates * 4,
    protein,
    fat,
    carbohydrates,
  }
}

export function getProgressVariant(current: number, target: number) {
  if (target === 0) {
    return "default"
  }

  const percentage = (current / target) * 100

  if (percentage >= 90 && percentage <= 110) {
    return "default"
  }

  if ((percentage >= 80 && percentage < 90) || (percentage > 110 && percentage < 130)) {
    return "warning"
  }

  return "danger"
}
