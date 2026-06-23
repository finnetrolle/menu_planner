import { invoke } from '@tauri-apps/api/core'
import type {
  Dish,
  DishWithId,
  Goals,
  Ingredient,
  IngredientWithId,
  MenuPlanRequest,
  MenuPlanResult,
} from '@/types'

export type CommandErrorKind = 'validation' | 'not_found' | 'duplicate' | 'database'

export interface CommandErrorPayload {
  kind: CommandErrorKind
  message: string
  entity?: string | null
  id?: number | null
  field?: string | null
  value?: string | null
}

export class TauriCommandError extends Error {
  kind: CommandErrorKind
  entity?: string
  id?: number
  field?: string
  value?: string

  constructor(payload: CommandErrorPayload) {
    super(payload.message)
    this.name = 'TauriCommandError'
    this.kind = payload.kind
    this.entity = payload.entity ?? undefined
    this.id = payload.id ?? undefined
    this.field = payload.field ?? undefined
    this.value = payload.value ?? undefined
  }
}

function isCommandErrorPayload(value: unknown): value is CommandErrorPayload {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<CommandErrorPayload>

  return (
    typeof candidate.kind === 'string' &&
    typeof candidate.message === 'string'
  )
}

function normalizeCommandError(error: unknown): Error {
  if (isCommandErrorPayload(error)) {
    return new TauriCommandError(error)
  }

  if (error instanceof Error) {
    return error
  }

  return new Error(typeof error === 'string' ? error : 'Неизвестная ошибка')
}

async function invokeCommand<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(command, args)
  } catch (error) {
    throw normalizeCommandError(error)
  }
}

// ==================== Ingredients ====================

export async function getIngredients(): Promise<IngredientWithId[]> {
  return invokeCommand('get_ingredients')
}

export async function getIngredient(id: number): Promise<IngredientWithId | null> {
  return invokeCommand('get_ingredient', { id })
}

export async function createIngredient(ingredient: Omit<Ingredient, 'id'>): Promise<number> {
  return invokeCommand('create_ingredient', { ingredient })
}

export async function updateIngredient(id: number, ingredient: Omit<Ingredient, 'id'>): Promise<void> {
  return invokeCommand('update_ingredient', { id, ingredient })
}

export async function deleteIngredient(id: number): Promise<void> {
  return invokeCommand('delete_ingredient', { id })
}

// ==================== Dishes ====================

export async function getDishes(): Promise<DishWithId[]> {
  return invokeCommand('get_dishes')
}

export async function getDish(id: number): Promise<DishWithId | null> {
  return invokeCommand('get_dish', { id })
}

export async function createDish(dish: Omit<Dish, 'id'>): Promise<number> {
  return invokeCommand('create_dish', { dish })
}

export async function updateDish(id: number, dish: Omit<Dish, 'id'>): Promise<void> {
  return invokeCommand('update_dish', { id, dish })
}

export async function deleteDish(id: number): Promise<void> {
  return invokeCommand('delete_dish', { id })
}

// ==================== Goals ====================

export async function getGoals(): Promise<Goals | null> {
  return invokeCommand('get_goals')
}

export async function saveGoals(goals: Omit<Goals, 'id'>): Promise<void> {
  return invokeCommand('save_goals', { goals })
}

// ==================== Menu Plan ====================

export async function calculateMenuPlan(request: MenuPlanRequest): Promise<MenuPlanResult> {
  return invokeCommand('calculate_menu_plan', { request })
}
