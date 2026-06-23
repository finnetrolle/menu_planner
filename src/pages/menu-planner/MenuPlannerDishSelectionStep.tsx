import { Plus, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import NutritionDistributionBar from "@/pages/menu-planner/NutritionDistributionBar"
import { getProgressVariant } from "@/pages/menu-planner/helpers"
import type {
  DishWithId,
  Goals,
  MenuPlanItem,
  MenuPlanResult,
  NutritionSummary,
  SelectedDishInput,
} from "@/types"

interface MenuPlannerDishSelectionStepProps {
  dishes: DishWithId[]
  selectedDishById: Map<number, SelectedDishInput>
  plannedItemsByDishId: Map<number, MenuPlanItem>
  menuPlan: MenuPlanResult
  menuPlanIsFetching: boolean
  menuPlanErrorMessage?: string | null
  calories: number
  goals: Omit<Goals, "id">
  onCreateDish: () => void
  onToggleDish: (dish: DishWithId) => void
  onUpdatePortions: (dishId: number, portions: number) => void
  onEditDish: (dish: DishWithId) => void
  getDishPreview: (dish: DishWithId, portions: number) => NutritionSummary
}

export default function MenuPlannerDishSelectionStep({
  dishes,
  selectedDishById,
  plannedItemsByDishId,
  menuPlan,
  menuPlanIsFetching,
  menuPlanErrorMessage = null,
  calories,
  goals,
  onCreateDish,
  onToggleDish,
  onUpdatePortions,
  onEditDish,
  getDishPreview,
}: MenuPlannerDishSelectionStepProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Выберите блюда</h3>
          <Button variant="outline" size="sm" onClick={onCreateDish} className="gap-2">
            <Plus className="h-4 w-4" />
            Добавить блюдо
          </Button>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {dishes.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Блюда не найдены. Создайте первое блюдо.
                </div>
              ) : (
                dishes.map((dish) => {
                  const selectedDish = selectedDishById.get(dish.id)
                  const isSelected = Boolean(selectedDish)
                  const portions = selectedDish?.portions ?? 1
                  const dishPreview =
                    plannedItemsByDishId.get(dish.id) ?? getDishPreview(dish, portions)

                  return (
                    <div
                      key={dish.id}
                      className="rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex flex-1 items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleDish(dish)}
                            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/50"
                          />
                          <div>
                            <div className="font-medium text-foreground">{dish.name}</div>
                            {dish.weight ? (
                              <div className="text-sm text-muted-foreground">{dish.weight}г</div>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-muted-foreground">Порции:</label>
                              <Input
                                type="number"
                                min="1"
                                value={portions}
                                onChange={(event) =>
                                  onUpdatePortions(
                                    dish.id,
                                    parseInt(event.target.value, 10) || 1
                                  )
                                }
                                className="w-20"
                              />
                            </div>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditDish(dish)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <NutritionDistributionBar
                        protein={dishPreview.protein}
                        fat={dishPreview.fat}
                        carbohydrates={dishPreview.carbohydrates}
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
            <CardDescription>
              {menuPlanIsFetching ? "Пересчитываем план..." : "Обновляется в реальном времени"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {menuPlanErrorMessage ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {menuPlanErrorMessage}
              </div>
            ) : null}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Калории</span>
                <span className="text-muted-foreground">
                  {menuPlan.total_nutrition.calories.toFixed(0)} / {calories.toFixed(0)}
                </span>
              </div>
              <Progress
                value={menuPlan.total_nutrition.calories}
                max={calories}
                variant={getProgressVariant(menuPlan.total_nutrition.calories, calories)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Белки</span>
                <span className="text-muted-foreground">
                  {menuPlan.total_nutrition.protein.toFixed(1)} / {goals.protein}г
                </span>
              </div>
              <Progress
                value={menuPlan.total_nutrition.protein}
                max={goals.protein}
                variant={getProgressVariant(menuPlan.total_nutrition.protein, goals.protein)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Жиры</span>
                <span className="text-muted-foreground">
                  {menuPlan.total_nutrition.fat.toFixed(1)} / {goals.fat}г
                </span>
              </div>
              <Progress
                value={menuPlan.total_nutrition.fat}
                max={goals.fat}
                variant={getProgressVariant(menuPlan.total_nutrition.fat, goals.fat)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Углеводы</span>
                <span className="text-muted-foreground">
                  {menuPlan.total_nutrition.carbohydrates.toFixed(1)} / {goals.carbohydrates}г
                </span>
              </div>
              <Progress
                value={menuPlan.total_nutrition.carbohydrates}
                max={goals.carbohydrates}
                variant={getProgressVariant(
                  menuPlan.total_nutrition.carbohydrates,
                  goals.carbohydrates
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
