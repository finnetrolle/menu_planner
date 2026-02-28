import { invoke } from '@tauri-apps/api/core'
import type { Ingredient, Dish, IngredientWithId, DishWithId, Goals } from '@/types'

// ==================== Ingredients ====================

export async function getIngredients(): Promise<IngredientWithId[]> {
  return invoke('get_ingredients')
}

export async function getIngredient(id: number): Promise<IngredientWithId | null> {
  return invoke('get_ingredient', { id })
}

export async function createIngredient(ingredient: Omit<Ingredient, 'id'>): Promise<number> {
  return invoke('create_ingredient', { ingredient })
}

export async function updateIngredient(id: number, ingredient: Omit<Ingredient, 'id'>): Promise<void> {
  return invoke('update_ingredient', { id, ingredient })
}

export async function deleteIngredient(id: number): Promise<void> {
  return invoke('delete_ingredient', { id })
}

// ==================== Dishes ====================

export async function getDishes(): Promise<DishWithId[]> {
  return invoke('get_dishes')
}

export async function getDish(id: number): Promise<DishWithId | null> {
  return invoke('get_dish', { id })
}

export async function createDish(dish: Omit<Dish, 'id'>): Promise<number> {
  return invoke('create_dish', { dish })
}

export async function updateDish(id: number, dish: Omit<Dish, 'id'>): Promise<void> {
  return invoke('update_dish', { id, dish })
}

export async function deleteDish(id: number): Promise<void> {
  return invoke('delete_dish', { id })
}

// ==================== Goals ====================

export async function getGoals(): Promise<Goals | null> {
  return invoke('get_goals')
}

export async function saveGoals(goals: Omit<Goals, 'id'>): Promise<void> {
  return invoke('save_goals', { goals })
}
