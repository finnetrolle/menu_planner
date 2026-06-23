import { TauriCommandError } from '@/lib/tauri'

export function getUserFacingErrorMessage(error: unknown): string {
  if (error instanceof TauriCommandError) {
    switch (error.kind) {
      case 'validation':
        return error.message.replace(/^Ошибка валидации:\s*/, '')
      case 'duplicate':
        if (error.entity === 'ingredient' && error.field === 'name') {
          return 'Ингредиент с таким названием уже существует.'
        }
        if (error.entity === 'dish' && error.field === 'name') {
          return 'Блюдо с таким названием уже существует.'
        }
        if (error.entity === 'dish_ingredient' && error.field === 'ingredient_id') {
          return 'Один и тот же ингредиент нельзя добавить в блюдо дважды.'
        }
        return error.message
      case 'not_found':
        if (error.entity === 'ingredient') {
          return 'Ингредиент не найден. Обновите список и попробуйте снова.'
        }
        if (error.entity === 'dish') {
          return 'Блюдо не найдено. Обновите список и попробуйте снова.'
        }
        return 'Запись не найдена. Обновите данные и попробуйте снова.'
      case 'database':
        return 'Операцию не удалось завершить из-за ошибки базы данных. Попробуйте ещё раз.'
      default:
        return error.message
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Произошла неизвестная ошибка. Попробуйте ещё раз.'
}
