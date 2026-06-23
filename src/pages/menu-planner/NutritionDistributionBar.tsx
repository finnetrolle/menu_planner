interface NutritionDistributionBarProps {
  protein: number
  fat: number
  carbohydrates: number
}

export default function NutritionDistributionBar({
  protein,
  fat,
  carbohydrates,
}: NutritionDistributionBarProps) {
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
        {proteinPercent > 0 ? (
          <div
            className="absolute left-0 top-0 h-full bg-blue-500"
            style={{ width: `${proteinPercent}%` }}
          />
        ) : null}
        {fatPercent > 0 ? (
          <div
            className="absolute top-0 h-full bg-yellow-500"
            style={{ left: `${proteinPercent}%`, width: `${fatPercent}%` }}
          />
        ) : null}
        {carbsPercent > 0 ? (
          <div
            className="absolute top-0 h-full bg-purple-500"
            style={{ left: `${proteinPercent + fatPercent}%`, width: `${carbsPercent}%` }}
          />
        ) : null}
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
