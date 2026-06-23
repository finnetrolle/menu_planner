import { lazy, Suspense, useState } from "react"
import Sidebar from "@/components/layout/Sidebar"
import TopNav from "@/components/layout/TopNav"
import { MenuPlannerDraftProvider } from "@/pages/menu-planner/MenuPlannerDraftContext"

const DishesPage = lazy(() => import("@/pages/DishesPage"))
const IngredientsPage = lazy(() => import("@/pages/IngredientsPage"))
const MenuPlannerPage = lazy(() => import("@/pages/MenuPlannerPage"))

function PageLoadingState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-muted-foreground">Загрузка страницы...</div>
    </div>
  )
}

function App() {
  const [currentPage, setCurrentPage] = useState("menu-planner")

  const renderPage = () => {
    switch (currentPage) {
      case "dishes":
        return <DishesPage />
      case "ingredients":
        return <IngredientsPage />
      case "menu-planner":
        return <MenuPlannerPage />
      default:
        return <MenuPlannerPage />
    }
  }

  return (
    <MenuPlannerDraftProvider>
      <div className="flex h-screen flex-col md:flex-row">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNav currentPage={currentPage} onNavigate={setCurrentPage} />
          <main className="flex-1 overflow-auto bg-muted/30">
            <Suspense fallback={<PageLoadingState />}>{renderPage()}</Suspense>
          </main>
        </div>
      </div>
    </MenuPlannerDraftProvider>
  )
}

export default App
