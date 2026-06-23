import { CheckCircle2, Edit, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { MenuPlanResult } from "@/types"

interface MenuPlannerResultsStepProps {
  menuPlan: MenuPlanResult
  menuPlanErrorMessage?: string | null
  onEditIngredient: (ingredientId: number) => void
}

export default function MenuPlannerResultsStep({
  menuPlan,
  menuPlanErrorMessage = null,
  onEditIngredient,
}: MenuPlannerResultsStepProps) {
  return (
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
          {menuPlanErrorMessage ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {menuPlanErrorMessage}
            </div>
          ) : null}

          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Итоговая статистика</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                <div className="text-sm text-muted-foreground">Калории</div>
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {menuPlan.total_nutrition.calories.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(menuPlan.goal_comparison?.calories.percentage ?? 0)}%
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                <div className="text-sm text-muted-foreground">Белки</div>
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {menuPlan.total_nutrition.protein.toFixed(1)}г
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(menuPlan.goal_comparison?.protein.percentage ?? 0)}%
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                <div className="text-sm text-muted-foreground">Жиры</div>
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {menuPlan.total_nutrition.fat.toFixed(1)}г
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(menuPlan.goal_comparison?.fat.percentage ?? 0)}%
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                <div className="text-sm text-muted-foreground">Углеводы</div>
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {menuPlan.total_nutrition.carbohydrates.toFixed(1)}г
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(menuPlan.goal_comparison?.carbohydrates.percentage ?? 0)}%
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Список блюд</h3>
            <Card>
              <CardContent className="p-4">
                {menuPlan.items.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    Выберите блюда, чтобы увидеть итоговый план.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {menuPlan.items.map((item) => (
                      <div
                        key={item.dish_id}
                        className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.portions} {item.portions === 1 ? "порция" : "порции"} •{" "}
                            {item.calories.toFixed(0)} ккал
                          </div>
                        </div>
                        <div className="ml-4 text-right text-sm text-muted-foreground">
                          Б: {item.protein.toFixed(1)} • Ж: {item.fat.toFixed(1)} • У:{" "}
                          {item.carbohydrates.toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Список покупок</h3>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Агрегированные ингредиенты</CardTitle>
                <CardDescription className="text-sm">
                  Рассчитано на основе выбранных блюд
                </CardDescription>
              </CardHeader>
              <CardContent>
                {menuPlan.shopping_list.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    Добавьте блюда для формирования списка покупок
                  </div>
                ) : (
                  <div className="space-y-2">
                    {menuPlan.shopping_list.map((item) => (
                      <div
                        key={item.ingredient_id}
                        className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                      >
                        <div className="flex items-center gap-3">
                          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium text-foreground">{item.ingredient_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{item.amount.toFixed(0)} г</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditIngredient(item.ingredient_id)}
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
}
