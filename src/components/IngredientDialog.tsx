import { useState, useEffect } from 'react'
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
import type { IngredientWithId } from '@/types'
import { calculateCalories } from '@/types'

interface IngredientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredient: IngredientWithId | null
  onSave: (ingredient: Omit<IngredientWithId, 'id'>) => void
  isSaving?: boolean
  errorMessage?: string | null
}

export default function IngredientDialog({
  open,
  onOpenChange,
  ingredient,
  onSave,
  isSaving = false,
  errorMessage = null,
}: IngredientDialogProps) {
  const [name, setName] = useState('')
  const [protein, setProtein] = useState<string>('')
  const [fat, setFat] = useState<string>('')
  const [carbohydrates, setCarbohydrates] = useState<string>('')

  const calories = calculateCalories(
    parseFloat(protein) || 0,
    parseFloat(fat) || 0,
    parseFloat(carbohydrates) || 0
  )

  // Сброс формы при открытии
  useEffect(() => {
    if (open) {
      if (ingredient) {
        // Режим редактирования
        setName(ingredient.name)
        setProtein(ingredient.protein.toString())
        setFat(ingredient.fat.toString())
        setCarbohydrates(ingredient.carbohydrates.toString())
      } else {
        // Режим создания
        setName('')
        setProtein('')
        setFat('')
        setCarbohydrates('')
      }
    }
  }, [open, ingredient])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      return
    }

    const proteinValue = parseFloat(protein) || 0
    const fatValue = parseFloat(fat) || 0
    const carbohydratesValue = parseFloat(carbohydrates) || 0

    onSave({
      name,
      protein: proteinValue,
      fat: fatValue,
      carbohydrates: carbohydratesValue,
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSaving && !nextOpen) {
          return
        }

        onOpenChange(nextOpen)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ingredient ? 'Редактировать ингредиент' : 'Добавить ингредиент'}</DialogTitle>
          <DialogDescription>
            {ingredient ? 'Измените название и нутриенты ингредиента' : 'Создайте новый ингредиент'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="ingredient-name" className="text-sm font-medium">
                Название <span className="text-destructive">*</span>
              </label>
              <Input
                id="ingredient-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Куриная грудка"
                disabled={isSaving}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="protein" className="text-sm font-medium">
                  Белки (г) <span className="text-destructive">*</span>
                </label>
                <Input
                  id="protein"
                  type="number"
                  step="0.1"
                  min="0"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0.0"
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="fat" className="text-sm font-medium">
                  Жиры (г) <span className="text-destructive">*</span>
                </label>
                <Input
                  id="fat"
                  type="number"
                  step="0.1"
                  min="0"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="0.0"
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="carbs" className="text-sm font-medium">
                  Углеводы (г) <span className="text-destructive">*</span>
                </label>
                <Input
                  id="carbs"
                  type="number"
                  step="0.1"
                  min="0"
                  value={carbohydrates}
                  onChange={(e) => setCarbohydrates(e.target.value)}
                  placeholder="0.0"
                  disabled={isSaving}
                  required
                />
              </div>
            </div>

            {/* Предпросмотр калорий */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Калории</div>
                  <div className="font-medium text-lg">{calories.toFixed(0)} ккал</div>
                </div>
                <div>
                  <div className="text-muted-foreground">На 100г</div>
                  <div className="font-medium">
                    {protein || '0'}г Б • {fat || '0'}г Ж • {carbohydrates || '0'}г У
                  </div>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="text-sm text-destructive">
                {errorMessage}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Сохранение...' : ingredient ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
