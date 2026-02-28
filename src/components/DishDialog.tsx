import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Autocomplete } from '@/components/ui/autocomplete'
import { Plus, Trash2, Copy, GripVertical } from 'lucide-react'
import type { DishWithId, DishIngredient, IngredientWithId } from '@/types'
import { calculateCalories } from '@/types'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface DishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dish: DishWithId | null
  ingredients: IngredientWithId[]
  onSave: (dish: Omit<DishWithId, 'id'>) => void
}

interface DishIngredientRow {
  ingredient_id: number
  amount: number
  id: string
}

// Цвета для pie chart
const COLORS = {
  protein: '#3b82f6', // blue-500
  fat: '#ef4444',     // red-500
  carbs: '#22c55e',   // green-500
}

// Компонент для сортируемой строки ингредиента
function SortableIngredientRow({
  row,
  ingredients,
  ingredientOptions,
  onUpdate,
  onRemove,
  onDuplicate,
}: {
  row: DishIngredientRow
  ingredients: IngredientWithId[]
  ingredientOptions: { value: number; label: string }[]
  onUpdate: (id: string, field: keyof DishIngredientRow, value: number | string) => void
  onRemove: (id: string) => void
  onDuplicate: (row: DishIngredientRow) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const ingredient = ingredients.find((i) => i.id === row.ingredient_id)
  const rowNutrition = ingredient
    ? {
        calories: calculateCalories(
          ingredient.protein * (row.amount / 100),
          ingredient.fat * (row.amount / 100),
          ingredient.carbohydrates * (row.amount / 100)
        ),
        protein: ingredient.protein * (row.amount / 100),
        fat: ingredient.fat * (row.amount / 100),
        carbs: ingredient.carbohydrates * (row.amount / 100),
      }
    : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors bg-background"
    >
      {/* Drag handle */}
      <div
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-2"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Ингредиент - автокомплит */}
      <div className="flex-1 min-w-0">
        <Autocomplete
          options={ingredientOptions}
          value={row.ingredient_id}
          onChange={(val) => onUpdate(row.id, 'ingredient_id', val)}
          placeholder="Выберите ингредиент"
          emptyMessage="Ингредиенты не найдены"
        />
        {ingredient && rowNutrition && row.amount > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            {rowNutrition.calories.toFixed(0)} ккал • Б:{rowNutrition.protein.toFixed(1)} Ж:{rowNutrition.fat.toFixed(1)} У:{rowNutrition.carbs.toFixed(1)}
          </div>
        )}
      </div>

      {/* Вес */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="0.1"
          min="0"
          placeholder="Вес"
          value={row.amount || ''}
          onChange={(e) =>
            onUpdate(row.id, 'amount', parseFloat(e.target.value) || 0)
          }
          className="w-24"
        />
        <span className="text-sm text-muted-foreground">г</span>
      </div>

      {/* Действия */}
      <div className="flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDuplicate(row)}
          className="h-9 w-9 p-0"
          title="Дублировать"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(row.id)}
          className="h-9 w-9 p-0"
          title="Удалить"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

export default function DishDialog({
  open,
  onOpenChange,
  dish,
  ingredients,
  onSave,
}: DishDialogProps) {
  const [name, setName] = useState('')
  const [weight, setWeight] = useState<string>('')
  const [ingredientRows, setIngredientRows] = useState<DishIngredientRow[]>([])

  // Настройка dnd-kit сенсоров
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Сброс формы при открытии
  useEffect(() => {
    if (open) {
      if (dish) {
        // Режим редактирования
        setName(dish.name)
        setWeight(dish.weight?.toString() || '')
        setIngredientRows(
          dish.ingredients.map((ing, idx) => ({
            ...ing,
            id: `existing-${idx}`,
          }))
        )
      } else {
        // Режим создания - пустой список
        setName('')
        setWeight('')
        setIngredientRows([])
      }
    }
  }, [open, dish])

  // Удалить строку ингредиента
  const removeIngredientRow = (id: string) => {
    setIngredientRows(ingredientRows.filter((row) => row.id !== id))
  }

  // Обновить ингредиент
  const updateIngredientRow = (id: string, field: keyof DishIngredientRow, value: number | string) => {
    setIngredientRows(
      ingredientRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    )
  }

  // Дублировать ингредиент
  const duplicateIngredientRow = (row: DishIngredientRow) => {
    setIngredientRows([
      ...ingredientRows,
      { ...row, id: `dup-${Date.now()}` },
    ])
  }

  // Добавить новый ингредиент
  const addNewIngredient = () => {
    setIngredientRows([
      ...ingredientRows,
      { ingredient_id: 0, amount: 0, id: `new-${Date.now()}` },
    ])
  }

  // Обработка drag & drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setIngredientRows((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Рассчитать суммарную нутрицию
  const calculateTotalNutrition = () => {
    let totalProtein = 0
    let totalFat = 0
    let totalCarbs = 0
    let totalWeight = 0

    ingredientRows.forEach((row) => {
      const ingredient = ingredients.find((i) => i.id === row.ingredient_id)
      if (ingredient) {
        const ratio = row.amount / 100
        totalProtein += ingredient.protein * ratio
        totalFat += ingredient.fat * ratio
        totalCarbs += ingredient.carbohydrates * ratio
        totalWeight += row.amount
      }
    })

    return {
      protein: totalProtein,
      fat: totalFat,
      carbs: totalCarbs,
      calories: calculateCalories(totalProtein, totalFat, totalCarbs),
      weight: totalWeight,
    }
  }

  const nutrition = calculateTotalNutrition()

  // Данные для pie chart (калории от каждого макронутриента)
  const pieData = useMemo(() => {
    if (nutrition.calories === 0) return []

    const proteinCalories = nutrition.protein * 4
    const fatCalories = nutrition.fat * 9
    const carbsCalories = nutrition.carbs * 4

    return [
      {
        name: 'Белки',
        value: proteinCalories,
        grams: nutrition.protein,
        color: COLORS.protein,
      },
      {
        name: 'Жиры',
        value: fatCalories,
        grams: nutrition.fat,
        color: COLORS.fat,
      },
      {
        name: 'Углеводы',
        value: carbsCalories,
        grams: nutrition.carbs,
        color: COLORS.carbs,
      },
    ].filter(item => item.value > 0)
  }, [nutrition])

  // Подготовка опций для автокомплита
  const ingredientOptions = useMemo(
    () => ingredients.map((ing) => ({ value: ing.id, label: ing.name })),
    [ingredients]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      return
    }

    const dishIngredients: DishIngredient[] = ingredientRows
      .filter((row) => row.ingredient_id > 0 && row.amount > 0)
      .map((row) => ({
        ingredient_id: row.ingredient_id,
        amount: row.amount,
      }))

    if (dishIngredients.length === 0) {
      return
    }

    onSave({
      name,
      weight: weight ? parseFloat(weight) : null,
      ingredients: dishIngredients,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dish ? 'Редактировать блюдо' : 'Добавить блюдо'}</DialogTitle>
          <DialogDescription>
            {dish ? 'Измените название и ингредиенты блюда' : 'Создайте новое блюдо из ингредиентов'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="dish-name" className="text-sm font-medium">
                  Название блюда <span className="text-destructive">*</span>
                </label>
                <Input
                  id="dish-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Оливье"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dish-weight" className="text-sm font-medium">
                  Вес порции (г)
                </label>
                <Input
                  id="dish-weight"
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="200"
                />
              </div>
            </div>

            {/* Ингредиенты */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Ингредиенты в блюде <span className="text-destructive">*</span>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNewIngredient}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Добавить ингредиент
                </Button>
              </div>

              {ingredientRows.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                  Нажмите «Добавить ингредиент» для начала
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={ingredientRows.map((row) => row.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1.5">
                      {ingredientRows.map((row) => (
                        <SortableIngredientRow
                          key={row.id}
                          row={row}
                          ingredients={ingredients}
                          ingredientOptions={ingredientOptions}
                          onUpdate={updateIngredientRow}
                          onRemove={removeIngredientRow}
                          onDuplicate={duplicateIngredientRow}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Предпросмотр нутриции */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="mb-3 text-sm font-medium">Пищевая ценность</h4>

              {pieData.length > 0 ? (
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  {/* Pie Chart */}
                  <div className="w-full sm:w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          innerRadius={35}
                          paddingAngle={2}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            `${(value as number).toFixed(0)} ккал`,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Текстовая информация */}
                  <div className="flex-1 w-full">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Калории</div>
                        <div className="font-medium">{nutrition.calories.toFixed(0)} ккал</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Общий вес</div>
                        <div className="font-medium">{nutrition.weight.toFixed(0)} г</div>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {pieData.map((item) => {
                        const percentage = nutrition.calories > 0
                          ? (item.value / nutrition.calories * 100).toFixed(0)
                          : '0'
                        return (
                          <div key={item.name} className="flex items-center gap-2 text-sm">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <div className="flex-1">
                              <span className="text-muted-foreground">{item.name}:</span>{' '}
                              <span className="font-medium">
                                {item.grams.toFixed(1)}г ({percentage}%)
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Добавьте ингредиенты для отображения нутриции
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit">
              {dish ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
