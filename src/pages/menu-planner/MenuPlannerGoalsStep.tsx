import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { calculateCalories, type Goals } from "@/types"

interface MenuPlannerGoalsStepProps {
  goals: Omit<Goals, "id">
  presets: Array<Omit<Goals, "id"> & { name: string }>
  calories: number
  isSavingGoals: boolean
  errorMessage?: string | null
  onGoalsChange: (goals: Omit<Goals, "id">) => void
  onSaveGoals: () => void
}

export default function MenuPlannerGoalsStep({
  goals,
  presets,
  calories,
  isSavingGoals,
  errorMessage = null,
  onGoalsChange,
  onSaveGoals,
}: MenuPlannerGoalsStepProps) {
  return (
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
                onClick={() =>
                  onGoalsChange({
                    protein: preset.protein,
                    fat: preset.fat,
                    carbohydrates: preset.carbohydrates,
                  })
                }
                className="rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary hover:bg-muted/50"
              >
                <div className="font-medium text-foreground">{preset.name}</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {calculateCalories(
                    preset.protein,
                    preset.fat,
                    preset.carbohydrates
                  ).toFixed(0)}{" "}
                  ккал • {preset.protein}г Б • {preset.fat}г Ж • {preset.carbohydrates}г У
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
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="text-2xl font-bold text-foreground">{calories.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground">Рассчитано автоматически</div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Белки (г)</label>
            <Input
              type="number"
              value={goals.protein}
              onChange={(event) =>
                onGoalsChange({
                  ...goals,
                  protein: parseFloat(event.target.value) || 0,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Жиры (г)</label>
            <Input
              type="number"
              value={goals.fat}
              onChange={(event) =>
                onGoalsChange({
                  ...goals,
                  fat: parseFloat(event.target.value) || 0,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Углеводы (г)</label>
            <Input
              type="number"
              value={goals.carbohydrates}
              onChange={(event) =>
                onGoalsChange({
                  ...goals,
                  carbohydrates: parseFloat(event.target.value) || 0,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSaveGoals} disabled={isSavingGoals}>
          {isSavingGoals ? "Сохранение..." : "Сохранить цели"}
        </Button>
      </div>

      {errorMessage ? <div className="text-sm text-destructive">{errorMessage}</div> : null}
    </div>
  )
}
