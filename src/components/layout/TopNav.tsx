import { Utensils, Apple, Home, PlusCircle } from "lucide-react"

interface TopNavProps {
  currentPage: string
  onNavigate: (page: string) => void
}

export default function TopNav({ currentPage, onNavigate }: TopNavProps) {
  const menuItems = [
    { id: "menu-planner", label: "Главная", icon: Home },
    { id: "dishes", label: "Блюда", icon: Utensils },
    { id: "ingredients", label: "Ингредиенты", icon: Apple },
  ]

  return (
    <nav className="md:hidden border-b border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-primary">Menu Planner</h1>
        <button
          onClick={() => onNavigate("menu-planner")}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">План</span>
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
