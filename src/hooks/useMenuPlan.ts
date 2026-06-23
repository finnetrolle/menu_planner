import { useQuery, UseQueryResult } from '@tanstack/react-query'
import * as tauri from '@/lib/tauri'
import type { Goals, MenuPlanResult, SelectedDishInput } from '@/types'

export function useMenuPlan(
  selectedDishes: SelectedDishInput[],
  goals: Omit<Goals, 'id'>,
  enabled = true
): UseQueryResult<MenuPlanResult, Error> {
  return useQuery({
    queryKey: ['menu-plan', selectedDishes, goals],
    queryFn: () =>
      tauri.calculateMenuPlan({
        selected_dishes: selectedDishes,
        goals,
      }),
    enabled,
  })
}
