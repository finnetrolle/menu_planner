import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function DashboardPage() {
  // Данные для демонстрации
  const weeklyStats = {
    calories: { current: 1850, target: 2000, label: "Калории" },
    protein: { current: 145, target: 160, label: "Белки (г)" },
    fat: { current: 68, target: 70, label: "Жиры (г)" },
    carbs: { current: 198, target: 210, label: "Углеводы (г)" },
  }

  const getProgressVariant = (current: number, target: number) => {
    const percentage = (current / target) * 100
    if (percentage >= 90 && percentage <= 110) return "default"
    if (percentage >= 80 && percentage < 90) return "warning"
    if (percentage > 110 && percentage < 130) return "warning"
    return "danger"
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Главная</h1>
        <p className="mt-1 text-muted-foreground">Добро пожаловать в Menu Planner</p>
      </div>

      {/* Статистика за неделю */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Статистика за неделю</h2>
        <Card>
          <CardHeader>
            <CardTitle>Средние показатели</CardTitle>
            <CardDescription>На основе последних 7 дней</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(weeklyStats).map(([key, stat]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{stat.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {stat.current} / {stat.target}
                  </span>
                </div>
                <Progress
                  value={stat.current}
                  max={stat.target}
                  variant={getProgressVariant(stat.current, stat.target)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Таблица последних блюд */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Последние блюда</h2>
        <Card>
          <CardHeader>
            <CardTitle>Добавленные блюда</CardTitle>
            <CardDescription>Недавно созданные или отредактированные</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Название</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Калории</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Белки</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Жиры</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Углеводы</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Вес</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-foreground font-medium">Гречка с куриной грудкой</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">320</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">28</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">8</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">32</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">250</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-foreground font-medium">Овсяная каша с орехами</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">380</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">12</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">16</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">52</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">200</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-foreground font-medium">Салат Цезарь</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">420</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">24</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">32</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">12</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">300</td>
                  </tr>
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-foreground font-medium">Запеченная рыба с овощами</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">280</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">32</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">12</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">18</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">220</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
