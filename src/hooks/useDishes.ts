import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import * as tauri from '@/lib/tauri'
import type { Dish, DishWithId } from '@/types'

export function useDishes(): UseQueryResult<DishWithId[], Error> {
  return useQuery({
    queryKey: ['dishes'],
    queryFn: tauri.getDishes,
  })
}

export function useDish(id: number): UseQueryResult<DishWithId | null, Error> {
  return useQuery({
    queryKey: ['dish', id],
    queryFn: () => tauri.getDish(id),
    enabled: !!id,
  })
}

export function useCreateDish() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dish: Omit<Dish, 'id'>) => tauri.createDish(dish),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] })
    },
  })
}

export function useUpdateDish() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dish }: { id: number; dish: Omit<Dish, 'id'> }) =>
      tauri.updateDish(id, dish),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] })
    },
  })
}

export function useDeleteDish() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => tauri.deleteDish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] })
    },
  })
}
