import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import * as tauri from '@/lib/tauri'
import type { Ingredient, IngredientWithId } from '@/types'

export function useIngredients(): UseQueryResult<IngredientWithId[], Error> {
  return useQuery({
    queryKey: ['ingredients'],
    queryFn: tauri.getIngredients,
  })
}

export function useIngredient(id: number): UseQueryResult<IngredientWithId | null, Error> {
  return useQuery({
    queryKey: ['ingredient', id],
    queryFn: () => tauri.getIngredient(id),
    enabled: !!id,
  })
}

export function useCreateIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ingredient: Omit<Ingredient, 'id'>) => tauri.createIngredient(ingredient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
    },
  })
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ingredient }: { id: number; ingredient: Omit<Ingredient, 'id'> }) =>
      tauri.updateIngredient(id, ingredient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
    },
  })
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => tauri.deleteIngredient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
    },
  })
}
