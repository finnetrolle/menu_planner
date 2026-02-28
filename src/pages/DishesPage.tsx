import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { useDishes, useDeleteDish, useCreateDish, useUpdateDish } from "@/hooks/useDishes"
import type { DishWithId } from "@/types"
import { useIngredients } from "@/hooks/useIngredients"
import { calculateCalories } from "@/types"
import { useState, useMemo } from "react"
import DishDialog from "@/components/DishDialog"

export default function DishesPage() {
  const { data: dishes, isLoading, error } = useDishes()
  const { data: ingredients } = useIngredients()
  const deleteDish = useDeleteDish()
  const createDish = useCreateDish()
  const updateDish = useUpdateDish()
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDish, setEditingDish] = useState<DishWithId | null>(null)

  // Логирование для отладки
  console.log('DishesPage state:', { dishes, ingredients, isLoading, error })

  // Функция для расчёта КБЖУ блюда
  const calculateDishNutrition = (dish: DishWithId) => {
    let totalProtein = 0
    let totalFat = 0
    let totalCarbs = 0

    dish.ingredients.forEach((di) => {
      const ingredient = ingredients?.find((i) => i.id === di.ingredient_id)
      if (ingredient) {
        const ratio = di.amount / 100 // пересчёт на 100г
        totalProtein += ingredient.protein * ratio
        totalFat += ingredient.fat * ratio
        totalCarbs += ingredient.carbohydrates * ratio
      }
    })

    return {
      protein: totalProtein,
      fat: totalFat,
      carbs: totalCarbs,
      calories: calculateCalories(totalProtein, totalFat, totalCarbs),
    }
  }

  // Отфильтрованные блюда
  const filteredDishes = useMemo(() => {
    if (!dishes) return []

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return dishes.filter(dish =>
        dish.name.toLowerCase().includes(query)
      )
    }

    return dishes
  }, [dishes, searchQuery])

  const handleAddDish = () => {
    setEditingDish(null)
    setDialogOpen(true)
  }

  const handleEditDish = (dish: DishWithId) => {
    setEditingDish(dish)
    setDialogOpen(true)
  }

  const handleSaveDish = (dish: Omit<DishWithId, 'id'>) => {
    if (editingDish) {
      updateDish.mutate({ id: editingDish.id, dish })
    } else {
      createDish.mutate(dish)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  if (error) {
    console.error('DishesPage error:', error)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="text-destructive text-lg">Ошибка загрузки данных</div>
        <div className="text-muted-foreground text-sm">{String(error)}</div>
      </div>
    )
  }

  if (!filteredDishes || filteredDishes.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Мои блюда
            </h1>
            <p className="mt-1 text-muted-foreground">
              Управляйте списком ваших блюд
            </p>
          </div>
          <Button className="gap-2" onClick={handleAddDish}>
            <Plus className="h-5 w-5" />
            Добавить блюдо
          </Button>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <div className="mb-4 text-6xl text-muted-foreground">🍽</div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Нет блюд
            </h3>
            <p className="text-muted-foreground">
              Добавьте первое блюдо, чтобы начать работу
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Мои блюда
          </h1>
          <p className="mt-1 text-muted-foreground">
            Управляйте списком ваших блюд
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск блюда..."
              className="pl-9 w-full md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="gap-2" onClick={handleAddDish}>
            <Plus className="h-5 w-5" />
            Добавить блюдо
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDishes.map((dish) => {
          const nutrition = calculateDishNutrition(dish)

          return (
            <Card key={dish.id} className="group transition-all hover:shadow-md hover:border-primary/50">
              <CardHeader>
                <CardTitle className="text-lg">{dish.name}</CardTitle>
                <CardDescription>
                  {dish.weight ? `${dish.weight} г` : "Без веса"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Калории</div>
                    <div className="font-medium text-foreground">{nutrition.calories.toFixed(0)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Б / Ж / У</div>
                    <div className="font-medium text-foreground">
                      {nutrition.protein.toFixed(1)} / {nutrition.fat.toFixed(1)} /{" "}
                      {nutrition.carbs.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleEditDish(dish)}>
                    <Pencil className="h-4 w-4" />
                    Редактировать
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1"
                    onClick={() => deleteDish.mutate(dish.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <DishDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        dish={editingDish}
        ingredients={ingredients || []}
        onSave={handleSaveDish}
      />
    </div>
  )
}
