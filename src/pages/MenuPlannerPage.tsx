import { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, CheckCircle2, ShoppingBag, Edit, Plus } from "lucide-react"
import DishDialog from "@/components/DishDialog"
import IngredientDialog from "@/components/IngredientDialog"
import { useDishes, useCreateDish, useUpdateDish } from "@/hooks/useDishes"
import { useIngredients, useCreateIngredient, useUpdateIngredient } from "@/hooks/useIngredients"
import * as tauri from "@/lib/tauri"
import type { Goals, DishWithId, IngredientWithId } from "@/types"
import { calculateCalories } from "@/types"

interface SelectedDish {
  dish: DishWithId
  portions: number
  nutrition: {
    calories: number
    protein: number
    fat: number
    carbohydrates: number
  }
}

interface ShoppingListItem {
  ingredientId: number
  ingredientName: string
  amount: number
}

// Компонент для отображения распределения калорий по БЖУ
function NutritionDistributionBar({ protein, fat, carbohydrates }: { protein: number; fat: number; carbohydrates: number }) {
  const proteinCalories = protein * 4
  const fatCalories = fat * 9
  const carbsCalories = carbohydrates * 4
  const totalCalories = proteinCalories + fatCalories + carbsCalories

  const proteinPercent = totalCalories > 0 ? (proteinCalories / totalCalories) * 100 : 0
  const fatPercent = totalCalories > 0 ? (fatCalories / totalCalories) * 100 : 0
  const carbsPercent = totalCalories > 0 ? (carbsCalories / totalCalories) * 100 : 0

  return (
    <div className="w-full">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        {proteinPercent > 0 && (
          <div
            className="absolute top-0 left-0 h-full bg-blue-500"
            style={{ width: `${proteinPercent}%` }}
          />
        )}
        {fatPercent > 0 && (
          <div
            className="absolute top-0 h-full bg-yellow-500"
            style={{ left: `${proteinPercent}%`, width: `${fatPercent}%` }}
          />
        )}
        {carbsPercent > 0 && (
          <div
            className="absolute top-0 h-full bg-purple-500"
            style={{ left: `${proteinPercent + fatPercent}%`, width: `${carbsPercent}%` }}
          />
        )}
      </div>
      <div className="mt-1 flex gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Б {proteinPercent.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-yellow-500" />
          <span className="text-muted-foreground">Ж {fatPercent.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-purple-500" />
          <span className="text-muted-foreground">У {carbsPercent.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  )
}

export default function MenuPlannerPage() {
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)

  // Загрузка и сохранение целей
  const { data: savedGoals } = useQuery({
    queryKey: ["goals"],
    queryFn: tauri.getGoals,
  })

  const saveGoalsMutation = useMutation({
    mutationFn: (goals: Omit<Goals, "id">) => tauri.saveGoals(goals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] })
    },
  })

  // Цели (по умолчанию или загруженные)
  const [goals, setGoals] = useState<Omit<Goals, "id">>({
    protein: 160,
    fat: 70,
    carbohydrates: 210,
  })

  useEffect(() => {
    if (savedGoals) {
      setGoals({
        protein: savedGoals.protein,
        fat: savedGoals.fat,
        carbohydrates: savedGoals.carbohydrates,
      })
    }
  }, [savedGoals])

  // Загрузка данных
  const { data: dishes = [] } = useDishes()
  const { data: ingredients = [] } = useIngredients()

  const createDishMutation = useCreateDish()
  const updateDishMutation = useUpdateDish()
  const createIngredientMutation = useCreateIngredient()
  const updateIngredientMutation = useUpdateIngredient()

  // Выбранные блюда
  const [selectedDishes, setSelectedDishes] = useState<SelectedDish[]>([])

  // Диалоги
  const [dishDialogOpen, setDishDialogOpen] = useState(false)
  const [editingDish, setEditingDish] = useState<DishWithId | null>(null)
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<IngredientWithId | null>(null)

  // Пресеты целей
  const presets = [
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

  // Автоматический расчет калорий
  const calories = useMemo(() => calculateCalories(goals.protein, goals.fat, goals.carbohydrates), [goals])

  // Расчет нутриции блюда
  const calculateDishNutrition = (dish: DishWithId, portions: number) => {
    let protein = 0
    let fat = 0
    let carbs = 0

    dish.ingredients.forEach((ing) => {
      const ingredient = ingredients.find((i) => i.id === ing.ingredient_id)
      if (ingredient) {
        const ratio = (ing.amount / 100) * portions
        protein += ingredient.protein * ratio
        fat += ingredient.fat * ratio
        carbs += ingredient.carbohydrates * ratio
      }
    })

    return {
      calories: calculateCalories(protein, fat, carbs),
      protein,
      fat,
      carbohydrates: carbs,
    }
  }

  // Текущие итоги
  const currentTotals = useMemo(() => {
    return selectedDishes.reduce(
      (acc, dish) => ({
        calories: acc.calories + dish.nutrition.calories,
        protein: acc.protein + dish.nutrition.protein,
        fat: acc.fat + dish.nutrition.fat,
        carbohydrates: acc.carbohydrates + dish.nutrition.carbohydrates,
      }),
      { calories: 0, protein: 0, fat: 0, carbohydrates: 0 }
    )
  }, [selectedDishes])

  // Список покупок
  const shoppingList = useMemo(() => {
    const items = new Map<number, ShoppingListItem>()

    selectedDishes.forEach((selectedDish) => {
      selectedDish.dish.ingredients.forEach((dishIng) => {
        const ingredient = ingredients.find((i) => i.id === dishIng.ingredient_id)
        if (ingredient) {
          const key = dishIng.ingredient_id
          const existing = items.get(key)
          const amount = dishIng.amount * selectedDish.portions

          if (existing) {
            existing.amount += amount
          } else {
            items.set(key, {
              ingredientId: ingredient.id,
              ingredientName: ingredient.name,
              amount,
            })
          }
        }
      })
    })

    return Array.from(items.values()).sort((a, b) => a.ingredientName.localeCompare(b.ingredientName))
  }, [selectedDishes, ingredients])

  const getProgressVariant = (current: number, target: number) => {
    if (target === 0) return "default"
    const percentage = (current / target) * 100
    if (percentage >= 90 && percentage <= 110) return "default"
    if (percentage >= 80 && percentage < 90) return "warning"
    if (percentage > 110 && percentage < 130) return "warning"
    return "danger"
  }

  const toggleDish = (dish: DishWithId) => {
    setSelectedDishes((prev) => {
      const existing = prev.find((d) => d.dish.id === dish.id)
      if (existing) {
        return prev.filter((d) => d.dish.id !== dish.id)
      } else {
        const nutrition = calculateDishNutrition(dish, 1)
        return [...prev, { dish, portions: 1, nutrition }]
      }
    })
  }

  const updatePortions = (dishId: number, portions: number) => {
    setSelectedDishes((prev) =>
      prev.map((item) => {
        if (item.dish.id !== dishId) return item
        const nutrition = calculateDishNutrition(item.dish, portions)
        return { ...item, portions, nutrition }
      })
    )
  }

  const handleSaveGoals = () => {
    saveGoalsMutation.mutate(goals)
  }

  const handleEditDish = (dish: DishWithId) => {
    setEditingDish(dish)
    setDishDialogOpen(true)
  }

  const handleSaveDish = (dishData: Omit<DishWithId, "id">) => {
    if (editingDish) {
      updateDishMutation.mutate(
        { id: editingDish.id, dish: dishData },
        {
          onSuccess: () => {
            setDishDialogOpen(false)
            setEditingDish(null)
          },
        }
      )
    }
  }

  const handleCreateDish = (dishData: Omit<DishWithId, "id">) => {
    createDishMutation.mutate(dishData, {
      onSuccess: () => {
        setDishDialogOpen(false)
        setEditingDish(null)
      },
    })
  }

  const handleEditIngredient = (ingredient: IngredientWithId) => {
    setEditingIngredient(ingredient)
    setIngredientDialogOpen(true)
  }

  const handleSaveIngredient = (ingredientData: Omit<IngredientWithId, "id">) => {
    if (editingIngredient) {
      updateIngredientMutation.mutate(
        { id: editingIngredient.id, ingredient: ingredientData },
        {
          onSuccess: () => {
            setIngredientDialogOpen(false)
            setEditingIngredient(null)
          },
        }
      )
    } else {
      createIngredientMutation.mutate(ingredientData, {
        onSuccess: () => {
          setIngredientDialogOpen(false)
          setEditingIngredient(null)
        },
      })
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Быстрый выбор цели</CardTitle>
          <CardDescription>Или задайте свои значения вручную</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setGoals({ protein: preset.protein, fat: preset.fat, carbohydrates: preset.carbohydrates })}
                className="rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary hover:bg-muted/50"
              >
                <div className="font-medium text-foreground">{preset.name}</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {calculateCalories(preset.protein, preset.fat, preset.carbohydrates).toFixed(0)} ккал • {preset.protein}г Б • {preset.fat}г Ж •{" "}
                  {preset.carbohydrates}г У
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ваши цели КБЖУ</CardTitle>
          <CardDescription>На период планирования</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Калории (ккал)</label>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-foreground">{calories.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground">Рассчитано автоматически</div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Белки (г)</label>
            <Input
              type="number"
              value={goals.protein}
              onChange={(e) => setGoals({ ...goals, protein: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Жиры (г)</label>
            <Input
              type="number"
              value={goals.fat}
              onChange={(e) => setGoals({ ...goals, fat: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Углеводы (г)</label>
            <Input
              type="number"
              value={goals.carbohydrates}
              onChange={(e) => setGoals({ ...goals, carbohydrates: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveGoals} disabled={saveGoalsMutation.isPending}>
          {saveGoalsMutation.isPending ? "Сохранение..." : "Сохранить цели"}
        </Button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Выберите блюда</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingDish(null)
              setDishDialogOpen(true)
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Добавить блюдо
          </Button>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {dishes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Блюда не найдены. Создайте первое блюдо.
                </div>
              ) : (
                dishes.map((dish) => {
                  const isSelected = selectedDishes.some((d) => d.dish.id === dish.id)
                  const selectedDish = selectedDishes.find((d) => d.dish.id === dish.id)

                  const dishNutrition = calculateDishNutrition(dish, selectedDish?.portions || 1)

                  return (
                    <div
                      key={dish.id}
                      className="rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-1 items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleDish(dish)}
                            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/50"
                          />
                          <div>
                            <div className="font-medium text-foreground">{dish.name}</div>
                            {dish.weight && (
                              <div className="text-sm text-muted-foreground">{dish.weight}г</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-muted-foreground">Порции:</label>
                              <Input
                                type="number"
                                min="1"
                                value={selectedDish!.portions}
                                onChange={(e) => updatePortions(dish.id, parseInt(e.target.value) || 1)}
                                className="w-20"
                              />
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditDish(dish)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <NutritionDistributionBar
                        protein={dishNutrition.protein}
                        fat={dishNutrition.fat}
                        carbohydrates={dishNutrition.carbohydrates}
                      />
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Прогресс КБЖУ</h3>
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>Текущие значения</CardTitle>
            <CardDescription>Обновляется в реальном времени</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Калории</span>
                <span className="text-muted-foreground">
                  {currentTotals.calories.toFixed(0)} / {calories.toFixed(0)}
                </span>
              </div>
              <Progress
                value={currentTotals.calories}
                max={calories}
                variant={getProgressVariant(currentTotals.calories, calories)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Белки</span>
                <span className="text-muted-foreground">
                  {currentTotals.protein.toFixed(1)} / {goals.protein}г
                </span>
              </div>
              <Progress
                value={currentTotals.protein}
                max={goals.protein}
                variant={getProgressVariant(currentTotals.protein, goals.protein)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Жиры</span>
                <span className="text-muted-foreground">
                  {currentTotals.fat.toFixed(1)} / {goals.fat}г
                </span>
              </div>
              <Progress
                value={currentTotals.fat}
                max={goals.fat}
                variant={getProgressVariant(currentTotals.fat, goals.fat)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Углеводы</span>
                <span className="text-muted-foreground">
                  {currentTotals.carbohydrates.toFixed(1)} / {goals.carbohydrates}г
                </span>
              </div>
              <Progress
                value={currentTotals.carbohydrates}
                max={goals.carbohydrates}
                variant={getProgressVariant(currentTotals.carbohydrates, goals.carbohydrates)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <CardTitle>План составлен!</CardTitle>
          </div>
          <CardDescription>
            Ваше меню готово. Вы можете просмотреть список блюд или список покупок.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Итоговая статистика</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                <div className="text-sm text-muted-foreground">Калории</div>
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {currentTotals.calories.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {calories > 0 ? Math.round((currentTotals.calories / calories) * 100) : 0}%
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                <div className="text-sm text-muted-foreground">Белки</div>
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {currentTotals.protein.toFixed(1)}г
                </div>
                <div className="text-sm text-muted-foreground">
                  {goals.protein > 0 ? Math.round((currentTotals.protein / goals.protein) * 100) : 0}%
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                <div className="text-sm text-muted-foreground">Жиры</div>
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {currentTotals.fat.toFixed(1)}г
                </div>
                <div className="text-sm text-muted-foreground">
                  {goals.fat > 0 ? Math.round((currentTotals.fat / goals.fat) * 100) : 0}%
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                <div className="text-sm text-muted-foreground">Углеводы</div>
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {currentTotals.carbohydrates.toFixed(1)}г
                </div>
                <div className="text-sm text-muted-foreground">
                  {goals.carbohydrates > 0 ? Math.round((currentTotals.carbohydrates / goals.carbohydrates) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Список блюд</h3>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {selectedDishes.map((item) => (
                    <div
                      key={item.dish.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{item.dish.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.portions} {item.portions === 1 ? "порция" : "порции"} •{" "}
                          {item.nutrition.calories.toFixed(0)} ккал
                        </div>
                      </div>
                      <div className="ml-4 text-right text-sm text-muted-foreground">
                        Б: {item.nutrition.protein.toFixed(1)} • Ж: {item.nutrition.fat.toFixed(1)} • У:{" "}
                        {item.nutrition.carbohydrates.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Список покупок
            </h3>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Агрегированные ингредиенты</CardTitle>
                <CardDescription className="text-sm">
                  Рассчитано на основе выбранных блюд
                </CardDescription>
              </CardHeader>
              <CardContent>
                {shoppingList.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Добавьте блюда для формирования списка покупок
                  </div>
                ) : (
                  <div className="space-y-2">
                    {shoppingList.map((item) => (
                      <div
                        key={item.ingredientId}
                        className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                      >
                        <div className="flex items-center gap-3">
                          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium text-foreground">{item.ingredientName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{item.amount.toFixed(0)} г</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const ingredient = ingredients.find((i) => i.id === item.ingredientId)
                              if (ingredient) {
                                handleEditIngredient(ingredient)
                              }
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Создание плана питания
        </h1>
        <p className="mt-1 text-muted-foreground">
          Шаг {step} из 3
          {step === 1 && ": Установите цели КБЖУ"}
          {step === 2 && ": Выберите блюда"}
          {step === 3 && ": Результаты"}
        </p>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mb-8">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className="gap-2"
        >
          <ChevronLeft className="h-5 w-5" />
          Назад
        </Button>
        <Button
          onClick={() => setStep(step + 1)}
          disabled={step === 3}
          className="gap-2"
        >
          {step === 3 ? "Готово" : "Далее"}
          {step !== 3 && <ChevronRight className="h-5 w-5" />}
        </Button>
      </div>

      {/* Диалог для редактирования блюда */}
      <DishDialog
        open={dishDialogOpen}
        onOpenChange={(open) => {
          setDishDialogOpen(open)
          if (!open) setEditingDish(null)
        }}
        dish={editingDish}
        ingredients={ingredients}
        onSave={editingDish ? handleSaveDish : handleCreateDish}
      />

      {/* Диалог для редактирования ингредиента */}
      <IngredientDialog
        open={ingredientDialogOpen}
        onOpenChange={(open) => {
          setIngredientDialogOpen(open)
          if (!open) setEditingIngredient(null)
        }}
        ingredient={editingIngredient}
        onSave={handleSaveIngredient}
      />
    </div>
  )
}
