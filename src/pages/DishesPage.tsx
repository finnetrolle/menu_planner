import { lazy, Suspense, useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react"
import DialogLoadingFallback from "@/components/ui/dialog-loading"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useDishes, useDeleteDish, useCreateDish, useUpdateDish } from "@/hooks/useDishes"
import { useIngredients } from "@/hooks/useIngredients"
import { getUserFacingErrorMessage } from "@/lib/error-message"
import { cn } from "@/lib/utils"
import type { DishWithId, NutritionSummary } from "@/types"
import { calculateCalories } from "@/types"

const DishDialog = lazy(() => import("@/components/DishDialog"))

type DishSortField = "name" | "weight" | "calories" | "protein" | "fat" | "carbohydrates"
type SortDirection = "asc" | "desc"
type NutritionMetric = "calories" | "protein" | "fat" | "carbohydrates"

interface NutritionRangeInput {
  min: string
  max: string
}

type NutritionFilters = Record<NutritionMetric, NutritionRangeInput>
type FilterErrors = Partial<Record<NutritionMetric, string>>

interface DishListItem {
  dish: DishWithId
  nutrition: NutritionSummary
  searchName: string
  weight: number | null
}

const DEFAULT_SORT_FIELD: DishSortField = "name"
const DEFAULT_SORT_DIRECTION: SortDirection = "asc"

const SORT_OPTIONS: Array<{ value: DishSortField; label: string }> = [
  { value: "name", label: "По названию" },
  { value: "weight", label: "По весу" },
  { value: "calories", label: "По калориям" },
  { value: "protein", label: "По белкам" },
  { value: "fat", label: "По жирам" },
  { value: "carbohydrates", label: "По углеводам" },
]

const NUTRITION_METRICS: NutritionMetric[] = ["calories", "protein", "fat", "carbohydrates"]

const FILTER_LABELS: Record<NutritionMetric, string> = {
  calories: "Калории",
  protein: "Белки",
  fat: "Жиры",
  carbohydrates: "Углеводы",
}

function createEmptyNutritionFilters(): NutritionFilters {
  return {
    calories: { min: "", max: "" },
    protein: { min: "", max: "" },
    fat: { min: "", max: "" },
    carbohydrates: { min: "", max: "" },
  }
}

function parseNumericInput(value: string): number | null {
  if (!value.trim()) {
    return null
  }

  const parsedValue = Number(value)

  return Number.isFinite(parsedValue) ? parsedValue : null
}

function isRangeInputActive(range: NutritionRangeInput): boolean {
  return range.min.trim().length > 0 || range.max.trim().length > 0
}

function getRangeError(range: NutritionRangeInput): string | null {
  const minValue = parseNumericInput(range.min)
  const maxValue = parseNumericInput(range.max)

  if (minValue !== null && maxValue !== null && minValue > maxValue) {
    return "Минимум не должен превышать максимум."
  }

  return null
}

function getNutritionMetricValue(nutrition: NutritionSummary, metric: NutritionMetric): number {
  switch (metric) {
    case "calories":
      return nutrition.calories
    case "protein":
      return nutrition.protein
    case "fat":
      return nutrition.fat
    case "carbohydrates":
      return nutrition.carbohydrates
  }
}

function calculateDishNutrition(
  dish: DishWithId,
  ingredientsById: Map<number, { protein: number; fat: number; carbohydrates: number }>
): NutritionSummary {
  let totalProtein = 0
  let totalFat = 0
  let totalCarbohydrates = 0

  for (const dishIngredient of dish.ingredients) {
    const ingredient = ingredientsById.get(dishIngredient.ingredient_id)

    if (!ingredient) {
      continue
    }

    const ratio = dishIngredient.amount / 100
    totalProtein += ingredient.protein * ratio
    totalFat += ingredient.fat * ratio
    totalCarbohydrates += ingredient.carbohydrates * ratio
  }

  return {
    calories: calculateCalories(totalProtein, totalFat, totalCarbohydrates),
    protein: totalProtein,
    fat: totalFat,
    carbohydrates: totalCarbohydrates,
  }
}

function createDishListItem(
  dish: DishWithId,
  ingredientsById: Map<number, { protein: number; fat: number; carbohydrates: number }>
): DishListItem {
  return {
    dish,
    nutrition: calculateDishNutrition(dish, ingredientsById),
    searchName: dish.name.toLocaleLowerCase(),
    weight: dish.weight ?? null,
  }
}

function compareNullableNumbers(
  left: number | null,
  right: number | null,
  sortDirection: SortDirection
): number {
  if (left === null && right === null) {
    return 0
  }

  if (left === null) {
    return 1
  }

  if (right === null) {
    return -1
  }

  return sortDirection === "asc" ? left - right : right - left
}

function compareDishListItems(
  left: DishListItem,
  right: DishListItem,
  sortField: DishSortField,
  sortDirection: SortDirection
): number {
  let comparison = 0

  switch (sortField) {
    case "name":
      comparison = left.dish.name.localeCompare(right.dish.name, "ru")
      return sortDirection === "asc" ? comparison : -comparison
    case "weight":
      comparison = compareNullableNumbers(left.weight, right.weight, sortDirection)
      break
    case "calories":
      comparison =
        sortDirection === "asc"
          ? left.nutrition.calories - right.nutrition.calories
          : right.nutrition.calories - left.nutrition.calories
      break
    case "protein":
      comparison =
        sortDirection === "asc"
          ? left.nutrition.protein - right.nutrition.protein
          : right.nutrition.protein - left.nutrition.protein
      break
    case "fat":
      comparison =
        sortDirection === "asc"
          ? left.nutrition.fat - right.nutrition.fat
          : right.nutrition.fat - left.nutrition.fat
      break
    case "carbohydrates":
      comparison =
        sortDirection === "asc"
          ? left.nutrition.carbohydrates - right.nutrition.carbohydrates
          : right.nutrition.carbohydrates - left.nutrition.carbohydrates
      break
  }

  if (comparison !== 0) {
    return comparison
  }

  return left.dish.name.localeCompare(right.dish.name, "ru")
}

function formatActiveRangeSummary(
  metric: NutritionMetric,
  range: NutritionRangeInput,
  errorMessage?: string
): string | null {
  if (!isRangeInputActive(range)) {
    return null
  }

  if (errorMessage) {
    return `${FILTER_LABELS[metric]}: проверьте диапазон`
  }

  const rangeParts: string[] = []

  if (range.min.trim()) {
    rangeParts.push(`от ${range.min}`)
  }

  if (range.max.trim()) {
    rangeParts.push(`до ${range.max}`)
  }

  return `${FILTER_LABELS[metric]}: ${rangeParts.join(" ")}`
}

export default function DishesPage() {
  const { data: dishes, isLoading, error } = useDishes()
  const { data: ingredients = [] } = useIngredients()
  const deleteDish = useDeleteDish()
  const createDish = useCreateDish()
  const updateDish = useUpdateDish()

  const [sortField, setSortField] = useState<DishSortField>(DEFAULT_SORT_FIELD)
  const [sortDirection, setSortDirection] = useState<SortDirection>(DEFAULT_SORT_DIRECTION)
  const [searchQuery, setSearchQuery] = useState("")
  const [nutritionFilters, setNutritionFilters] = useState<NutritionFilters>(() =>
    createEmptyNutritionFilters()
  )
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDish, setEditingDish] = useState<DishWithId | null>(null)

  const ingredientsById = useMemo(
    () => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])),
    [ingredients]
  )

  const dishList = useMemo(
    () => (dishes ?? []).map((dish) => createDishListItem(dish, ingredientsById)),
    [dishes, ingredientsById]
  )

  const filterErrors = useMemo(() => {
    const nextErrors: FilterErrors = {}

    for (const metric of NUTRITION_METRICS) {
      const errorMessage = getRangeError(nutritionFilters[metric])

      if (errorMessage) {
        nextErrors[metric] = errorMessage
      }
    }

    return nextErrors
  }, [nutritionFilters])

  const hasActiveSearch = searchQuery.trim().length > 0
  const activeNutritionFilterCount = useMemo(
    () => NUTRITION_METRICS.filter((metric) => isRangeInputActive(nutritionFilters[metric])).length,
    [nutritionFilters]
  )
  const hasActiveNutritionFilters = activeNutritionFilterCount > 0
  const hasFilterErrors = Object.keys(filterErrors).length > 0

  const filteredDishes = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase()

    return dishList
      .filter((dishItem) => {
        if (normalizedQuery && !dishItem.searchName.includes(normalizedQuery)) {
          return false
        }

        for (const metric of NUTRITION_METRICS) {
          if (filterErrors[metric]) {
            continue
          }

          const range = nutritionFilters[metric]
          const minValue = parseNumericInput(range.min)
          const maxValue = parseNumericInput(range.max)
          const metricValue = getNutritionMetricValue(dishItem.nutrition, metric)

          if (minValue !== null && metricValue < minValue) {
            return false
          }

          if (maxValue !== null && metricValue > maxValue) {
            return false
          }
        }

        return true
      })
      .sort((left, right) => compareDishListItems(left, right, sortField, sortDirection))
  }, [dishList, searchQuery, nutritionFilters, filterErrors, sortField, sortDirection])

  const activeFilterSummaries = useMemo(() => {
    const summaries: string[] = []

    if (hasActiveSearch) {
      summaries.push(`Поиск: ${searchQuery.trim()}`)
    }

    for (const metric of NUTRITION_METRICS) {
      const summary = formatActiveRangeSummary(metric, nutritionFilters[metric], filterErrors[metric])

      if (summary) {
        summaries.push(summary)
      }
    }

    return summaries
  }, [filterErrors, hasActiveSearch, nutritionFilters, searchQuery])

  const handleAddDish = () => {
    createDish.reset()
    updateDish.reset()
    setEditingDish(null)
    setDialogOpen(true)
  }

  const handleEditDish = (dish: DishWithId) => {
    createDish.reset()
    updateDish.reset()
    setEditingDish(dish)
    setDialogOpen(true)
  }

  const handleSaveDish = (dish: Omit<DishWithId, "id">) => {
    if (editingDish) {
      updateDish.mutate(
        { id: editingDish.id, dish },
        {
          onSuccess: () => {
            setDialogOpen(false)
            setEditingDish(null)
          },
        }
      )
      return
    }

    createDish.mutate(dish, {
      onSuccess: () => {
        setDialogOpen(false)
        setEditingDish(null)
      },
    })
  }

  const dialogErrorMessage = editingDish
    ? updateDish.error
      ? getUserFacingErrorMessage(updateDish.error)
      : null
    : createDish.error
      ? getUserFacingErrorMessage(createDish.error)
      : null

  const deleteErrorMessage = deleteDish.error
    ? getUserFacingErrorMessage(deleteDish.error)
    : null

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)

    if (!open) {
      setEditingDish(null)
    }
  }

  const handleSortDirectionToggle = () => {
    setSortDirection((currentDirection) => (currentDirection === "asc" ? "desc" : "asc"))
  }

  const handleFilterChange = (
    metric: NutritionMetric,
    boundary: keyof NutritionRangeInput,
    value: string
  ) => {
    setNutritionFilters((currentFilters) => ({
      ...currentFilters,
      [metric]: {
        ...currentFilters[metric],
        [boundary]: value,
      },
    }))
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setNutritionFilters(createEmptyNutritionFilters())
    setIsFilterPanelOpen(false)
  }

  const dishDialog = dialogOpen ? (
    <Suspense
      fallback={
        <DialogLoadingFallback
          open={dialogOpen}
          onOpenChange={handleDialogOpenChange}
          title={editingDish ? "Загрузка блюда" : "Создание блюда"}
          description="Подготавливаем форму блюда."
        />
      }
    >
      <DishDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        dish={editingDish}
        ingredients={ingredients}
        onSave={handleSaveDish}
        isSaving={editingDish ? updateDish.isPending : createDish.isPending}
        errorMessage={dialogErrorMessage}
      />
    </Suspense>
  ) : null

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

  if (!dishes || dishes.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">Мои блюда</h1>
            <p className="mt-1 text-muted-foreground">Управляйте списком ваших блюд</p>
          </div>
          <Button className="gap-2" onClick={handleAddDish}>
            <Plus className="h-5 w-5" />
            Добавить блюдо
          </Button>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <div className="mb-4 text-6xl text-muted-foreground">🍽</div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Нет блюд</h3>
            <p className="text-muted-foreground">Добавьте первое блюдо, чтобы начать работу</p>
          </CardContent>
        </Card>

        {dishDialog}
      </div>
    )
  }

  const hasActiveFilters = hasActiveSearch || hasActiveNutritionFilters
  const hasNoFilteredResults = filteredDishes.length === 0 && hasActiveFilters

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Мои блюда</h1>
          <p className="mt-1 text-muted-foreground">Управляйте списком ваших блюд</p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <div className="flex w-full flex-col gap-2 md:flex-row">
            <div className="relative md:min-w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск блюда..."
                className="w-full pl-9"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex items-center rounded-lg border border-border bg-background px-3">
                <label
                  htmlFor="dish-sort-field"
                  className="mr-2 shrink-0 text-sm text-muted-foreground"
                >
                  Сортировка
                </label>
                <select
                  id="dish-sort-field"
                  className="h-10 min-w-36 bg-transparent text-sm text-foreground focus:outline-none"
                  value={sortField}
                  onChange={(event) => setSortField(event.target.value as DishSortField)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={handleSortDirectionToggle}
              >
                {sortDirection === "asc" ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
                {sortDirection === "asc" ? "По возрастанию" : "По убыванию"}
              </Button>
              <Button
                type="button"
                variant={
                  isFilterPanelOpen || hasActiveNutritionFilters || hasFilterErrors
                    ? "outline"
                    : "ghost"
                }
                className="gap-2"
                onClick={() => setIsFilterPanelOpen((currentOpen) => !currentOpen)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Фильтры{activeNutritionFilterCount > 0 ? ` (${activeNutritionFilterCount})` : ""}
              </Button>
              <Button className="gap-2" onClick={handleAddDish}>
                <Plus className="h-5 w-5" />
                Добавить блюдо
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isFilterPanelOpen ? (
        <Card className="mb-4 border-border/70">
          <CardContent className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
            {NUTRITION_METRICS.map((metric) => {
              const range = nutritionFilters[metric]
              const errorMessage = filterErrors[metric]

              return (
                <div key={metric} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-medium text-foreground">{FILTER_LABELS[metric]}</label>
                    <span className="text-xs text-muted-foreground">мин / макс</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="Мин"
                      value={range.min}
                      onChange={(event) => handleFilterChange(metric, "min", event.target.value)}
                      className={cn(
                        errorMessage ? "border-destructive focus-visible:ring-destructive/40" : null
                      )}
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="Макс"
                      value={range.max}
                      onChange={(event) => handleFilterChange(metric, "max", event.target.value)}
                      className={cn(
                        errorMessage ? "border-destructive focus-visible:ring-destructive/40" : null
                      )}
                    />
                  </div>
                  <p
                    className={cn(
                      "min-h-5 text-xs",
                      errorMessage ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {errorMessage ?? "Оставьте поля пустыми, чтобы не ограничивать список."}
                  </p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border/70 bg-muted/30 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {hasActiveFilters
              ? `Найдено ${filteredDishes.length} из ${dishList.length} блюд`
              : `Всего ${dishList.length} блюд`}
          </p>
          {activeFilterSummaries.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeFilterSummaries.map((summary) => (
                <span
                  key={summary}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
                >
                  {summary}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Используйте сортировку и фильтры, чтобы быстрее находить блюда по КБЖУ.
            </p>
          )}
        </div>
        {hasActiveFilters || hasFilterErrors ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleResetFilters}
          >
            <X className="h-4 w-4" />
            Сбросить поиск и фильтры
          </Button>
        ) : null}
      </div>

      {deleteErrorMessage ? (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {deleteErrorMessage}
        </div>
      ) : null}

      {hasNoFilteredResults ? (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="mb-2 text-lg font-semibold text-foreground">Ничего не найдено</h3>
            <p className="mx-auto max-w-md text-muted-foreground">
              Попробуйте изменить поиск, ослабить фильтры по КБЖУ или сбросить текущие ограничения.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 gap-2"
              onClick={handleResetFilters}
            >
              <X className="h-4 w-4" />
              Сбросить поиск и фильтры
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDishes.map((dishItem) => {
            const { dish, nutrition } = dishItem

            return (
              <Card
                key={dish.id}
                className="group transition-all hover:border-primary/50 hover:shadow-md"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{dish.name}</CardTitle>
                  <CardDescription>
                    {dish.weight !== null ? `${dish.weight} г` : "Без веса"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Калории</div>
                      <div className="font-medium text-foreground">
                        {nutrition.calories.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Б / Ж / У</div>
                      <div className="font-medium text-foreground">
                        {nutrition.protein.toFixed(1)} / {nutrition.fat.toFixed(1)} /{" "}
                        {nutrition.carbohydrates.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => handleEditDish(dish)}
                    >
                      <Pencil className="h-4 w-4" />
                      Редактировать
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1"
                      onClick={() => deleteDish.mutate(dish.id)}
                      disabled={deleteDish.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {dishDialog}
    </div>
  )
}
