import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Search, ArrowUp, ArrowUpDown, ArrowDown } from "lucide-react"
import { useIngredients, useDeleteIngredient, useCreateIngredient, useUpdateIngredient } from "@/hooks/useIngredients"
import type { IngredientWithId } from "@/types"
import { calculateCalories } from "@/types"
import { useState, useMemo } from "react"

type SortColumn = 'name' | 'protein' | 'fat' | 'carbohydrates' | 'calories'
type SortDirection = 'asc' | 'desc'

export default function IngredientsPage() {
  const { data: ingredients, isLoading, error } = useIngredients()
  const deleteIngredient = useDeleteIngredient()
  const createIngredient = useCreateIngredient()
  const updateIngredient = useUpdateIngredient()

  const [sortColumn, setSortColumn] = useState<SortColumn>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [searchQuery, setSearchQuery] = useState('')

  // Состояние диалога
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<IngredientWithId | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    protein: 0,
    fat: 0,
    carbohydrates: 0,
  })

  // Логирование для отладки
  console.log('IngredientsPage state:', { ingredients, isLoading, error })

  // Открыть диалог для добавления ингредиента
  const handleAddClick = () => {
    setEditingIngredient(null)
    setFormData({ name: '', protein: 0, fat: 0, carbohydrates: 0 })
    setDialogOpen(true)
  }

  // Открыть диалог для редактирования ингредиента
  const handleEditClick = (ingredient: IngredientWithId) => {
    setEditingIngredient(ingredient)
    setFormData({
      name: ingredient.name,
      protein: ingredient.protein,
      fat: ingredient.fat,
      carbohydrates: ingredient.carbohydrates,
    })
    setDialogOpen(true)
  }

  // Обработчик изменения полей формы
  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: typeof value === 'string' && field !== 'name' ? parseFloat(value) || 0 : value,
    }))
  }

  // Сохранение ингредиента
  const handleSave = () => {
    const { name, protein, fat, carbohydrates } = formData

    if (!name.trim()) {
      return
    }

    if (editingIngredient) {
      // Редактирование существующего ингредиента
      updateIngredient.mutate({
        id: editingIngredient.id,
        ingredient: { name: name.trim(), protein, fat, carbohydrates },
      })
    } else {
      // Создание нового ингредиента
      createIngredient.mutate({ name: name.trim(), protein, fat, carbohydrates })
    }

    setDialogOpen(false)
  }

  // Закрытие диалога
  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingIngredient(null)
    setFormData({ name: '', protein: 0, fat: 0, carbohydrates: 0 })
  }

  // Функция для расчёта калорий ингредиента
  const calculateIngredientCalories = (ingredient: IngredientWithId): number => {
    return calculateCalories(ingredient.protein, ingredient.fat, ingredient.carbohydrates)
  }

  // Функция для обработки клика по заголовку столбца
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Если кликнули на тот же столбец, меняем направление
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Если новый столбец, устанавливаем его и направление по умолчанию
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Отфильтрованные и отсортированные ингредиенты
  const filteredAndSortedIngredients = useMemo(() => {
    if (!ingredients) return []

    // Сначала фильтрация по поиску
    let result = [...ingredients]
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(ing =>
        ing.name.toLowerCase().includes(query)
      )
    }

    // Затем сортировка
    result.sort((a, b) => {
      let comparison = 0

      switch (sortColumn) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'ru')
          break
        case 'protein':
          comparison = a.protein - b.protein
          break
        case 'fat':
          comparison = a.fat - b.fat
          break
        case 'carbohydrates':
          comparison = a.carbohydrates - b.carbohydrates
          break
        case 'calories':
          const calA = calculateIngredientCalories(a)
          const calB = calculateIngredientCalories(b)
          comparison = calA - calB
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [ingredients, searchQuery, sortColumn, sortDirection])

  // Компонент для заголовка столбца с иконкой сортировки
  const SortableHeader = ({ children, column }: { children: React.ReactNode; column: SortColumn }) => {
    const isSorted = sortColumn === column
    const Icon = isSorted
      ? sortDirection === 'asc'
        ? ArrowUp
        : ArrowDown
      : ArrowUpDown

    return (
      <button
        onClick={() => handleSort(column)}
        className="flex items-center gap-1 hover:text-primary transition-colors"
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
    console.error('IngredientsPage error:', error)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="text-destructive text-lg">Ошибка загрузки данных</div>
        <div className="text-muted-foreground text-sm">{String(error)}</div>
      </div>
    )
  }

  if (!ingredients || ingredients.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Мои ингредиенты
          </h1>
          <p className="mt-1 text-muted-foreground">База ингредиентов с КБЖУ</p>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <div className="mb-4 text-6xl text-muted-foreground">🥗</div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Нет ингредиентов
            </h3>
            <p className="text-muted-foreground mb-4">
              Добавьте первый ингредиент, чтобы начать работу
            </p>
            <Button className="gap-2" onClick={handleAddClick}>
              <Plus className="h-5 w-5" />
              Добавить ингредиент
            </Button>
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
            Мои ингредиенты
          </h1>
          <p className="mt-1 text-muted-foreground">База ингредиентов с КБЖУ</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск ингредиента..."
              className="pl-9 w-full md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="gap-2" onClick={handleAddClick}>
            <Plus className="h-5 w-5" />
            Добавить
          </Button>
        </div>
      </div>

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
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-foreground font-medium">
                    {ingredient.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground text-right">
                    {ingredient.protein.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground text-right">
                    {ingredient.fat.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground text-right">
                    {ingredient.carbohydrates.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground text-right">
                    {calculateIngredientCalories(ingredient).toFixed(0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
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

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingIngredient ? 'Редактировать ингредиент' : 'Добавить ингредиент'}
            </DialogTitle>
            <DialogDescription>
              {editingIngredient
                ? 'Измените данные ингредиента и нажмите "Сохранить"'
                : 'Заполните данные ингредиента и нажмите "Сохранить"'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Название
              </label>
              <Input
                id="name"
                placeholder="Название ингредиента"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="protein" className="text-sm font-medium">
                  Белки (г)
                </label>
                <Input
                  id="protein"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formData.protein || ''}
                  onChange={(e) => handleInputChange('protein', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="fat" className="text-sm font-medium">
                  Жиры (г)
                </label>
                <Input
                  id="fat"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formData.fat || ''}
                  onChange={(e) => handleInputChange('fat', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="carbohydrates" className="text-sm font-medium">
                  Углеводы (г)
                </label>
                <Input
                  id="carbohydrates"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formData.carbohydrates || ''}
                  onChange={(e) => handleInputChange('carbohydrates', e.target.value)}
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Калории: {calculateCalories(formData.protein, formData.fat, formData.carbohydrates).toFixed(0)} ккал
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
