import { lazy, Suspense, useMemo, useState } from "react"
import { Plus, Pencil, Trash2, Search, ArrowUp, ArrowUpDown, ArrowDown } from "lucide-react"
import DialogLoadingFallback from "@/components/ui/dialog-loading"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  useIngredients,
  useDeleteIngredient,
  useCreateIngredient,
  useUpdateIngredient,
} from "@/hooks/useIngredients"
import { getUserFacingErrorMessage } from "@/lib/error-message"
import type { IngredientWithId } from "@/types"
import { calculateCalories } from "@/types"

type SortColumn = "name" | "protein" | "fat" | "carbohydrates" | "calories"
type SortDirection = "asc" | "desc"

const IngredientDialog = lazy(() => import("@/components/IngredientDialog"))

export default function IngredientsPage() {
  const { data: ingredients, isLoading, error } = useIngredients()
  const deleteIngredient = useDeleteIngredient()
  const createIngredient = useCreateIngredient()
  const updateIngredient = useUpdateIngredient()

  const [sortColumn, setSortColumn] = useState<SortColumn>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<IngredientWithId | null>(null)

  const handleAddClick = () => {
    createIngredient.reset()
    updateIngredient.reset()
    setEditingIngredient(null)
    setDialogOpen(true)
  }

  const handleEditClick = (ingredient: IngredientWithId) => {
    createIngredient.reset()
    updateIngredient.reset()
    setEditingIngredient(ingredient)
    setDialogOpen(true)
  }

  const handleSaveIngredient = (ingredient: Omit<IngredientWithId, "id">) => {
    if (editingIngredient) {
      updateIngredient.mutate(
        {
          id: editingIngredient.id,
          ingredient,
        },
        {
          onSuccess: () => {
            setDialogOpen(false)
            setEditingIngredient(null)
          },
        }
      )
      return
    }

    createIngredient.mutate(ingredient, {
      onSuccess: () => {
        setDialogOpen(false)
        setEditingIngredient(null)
      },
    })
  }

  const calculateIngredientCalories = (ingredient: IngredientWithId): number =>
    calculateCalories(ingredient.protein, ingredient.fat, ingredient.carbohydrates)

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
      return
    }

    setSortColumn(column)
    setSortDirection("asc")
  }

  const filteredAndSortedIngredients = useMemo(() => {
    if (!ingredients) return []

    const result = [...ingredients]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return result
        .filter((ingredient) => ingredient.name.toLowerCase().includes(query))
        .sort((left, right) => compareIngredients(left, right, sortColumn, sortDirection))
    }

    return result.sort((left, right) =>
      compareIngredients(left, right, sortColumn, sortDirection)
    )
  }, [ingredients, searchQuery, sortColumn, sortDirection])

  const dialogErrorMessage = editingIngredient
    ? updateIngredient.error
      ? getUserFacingErrorMessage(updateIngredient.error)
      : null
    : createIngredient.error
      ? getUserFacingErrorMessage(createIngredient.error)
      : null

  const deleteErrorMessage = deleteIngredient.error
    ? getUserFacingErrorMessage(deleteIngredient.error)
    : null

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)

    if (!open) {
      setEditingIngredient(null)
    }
  }

  const ingredientDialog = dialogOpen ? (
    <Suspense
      fallback={
        <DialogLoadingFallback
          open={dialogOpen}
          onOpenChange={handleDialogOpenChange}
          title={editingIngredient ? "Загрузка ингредиента" : "Создание ингредиента"}
          description="Подготавливаем форму ингредиента."
        />
      }
    >
      <IngredientDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        ingredient={editingIngredient}
        onSave={handleSaveIngredient}
        isSaving={editingIngredient ? updateIngredient.isPending : createIngredient.isPending}
        errorMessage={dialogErrorMessage}
      />
    </Suspense>
  ) : null

  const SortableHeader = ({
    children,
    column,
  }: {
    children: React.ReactNode
    column: SortColumn
  }) => {
    const isSorted = sortColumn === column
    const Icon = isSorted ? (sortDirection === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown

    return (
      <button
        onClick={() => handleSort(column)}
        className="flex items-center gap-1 transition-colors hover:text-primary"
      >
        {children}
        <Icon className="h-4 w-4" />
      </button>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="text-lg text-destructive">Ошибка загрузки данных</div>
        <div className="text-sm text-muted-foreground">
          {getUserFacingErrorMessage(error)}
        </div>
      </div>
    )
  }

  if (!ingredients || ingredients.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Мои ингредиенты</h1>
          <p className="mt-1 text-muted-foreground">База ингредиентов с КБЖУ</p>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <div className="mb-4 text-6xl text-muted-foreground">🥗</div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Нет ингредиентов</h3>
            <p className="mb-4 text-muted-foreground">
              Добавьте первый ингредиент, чтобы начать работу
            </p>
            <Button className="gap-2" onClick={handleAddClick}>
              <Plus className="h-5 w-5" />
              Добавить ингредиент
            </Button>
          </CardContent>
        </Card>

        {ingredientDialog}
      </div>
    )
  }

  const hasNoSearchResults = filteredAndSortedIngredients.length === 0 && searchQuery.trim().length > 0

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Мои ингредиенты</h1>
          <p className="mt-1 text-muted-foreground">База ингредиентов с КБЖУ</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск ингредиента..."
              className="w-full pl-9 md:w-64"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <Button className="gap-2" onClick={handleAddClick}>
            <Plus className="h-5 w-5" />
            Добавить
          </Button>
        </div>
      </div>

      {deleteErrorMessage ? (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {deleteErrorMessage}
        </div>
      ) : null}

      {hasNoSearchResults ? (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="mb-2 text-lg font-semibold text-foreground">Ничего не найдено</h3>
            <p className="text-muted-foreground">Попробуйте изменить поисковый запрос.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                    <SortableHeader column="name">Название</SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                    <SortableHeader column="protein">Белки (г)</SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                    <SortableHeader column="fat">Жиры (г)</SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                    <SortableHeader column="carbohydrates">Углеводы (г)</SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                    <SortableHeader column="calories">Калории (ккал)</SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedIngredients.map((ingredient) => (
                  <tr
                    key={ingredient.id}
                    className="border-b border-border transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {ingredient.name}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                      {ingredient.protein.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                      {ingredient.fat.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                      {ingredient.carbohydrates.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                      {calculateIngredientCalories(ingredient).toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleEditClick(ingredient)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                          onClick={() => deleteIngredient.mutate(ingredient.id)}
                          disabled={deleteIngredient.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {ingredientDialog}
    </div>
  )
}

function compareIngredients(
  left: IngredientWithId,
  right: IngredientWithId,
  sortColumn: SortColumn,
  sortDirection: SortDirection
): number {
  let comparison = 0

  switch (sortColumn) {
    case "name":
      comparison = left.name.localeCompare(right.name, "ru")
      break
    case "protein":
      comparison = left.protein - right.protein
      break
    case "fat":
      comparison = left.fat - right.fat
      break
    case "carbohydrates":
      comparison = left.carbohydrates - right.carbohydrates
      break
    case "calories":
      comparison =
        calculateCalories(left.protein, left.fat, left.carbohydrates) -
        calculateCalories(right.protein, right.fat, right.carbohydrates)
      break
  }

  return sortDirection === "asc" ? comparison : -comparison
}
