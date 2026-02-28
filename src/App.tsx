import { useState } from "react"
import Sidebar from "@/components/layout/Sidebar"
import TopNav from "@/components/layout/TopNav"
import DashboardPage from "@/pages/DashboardPage"
import DishesPage from "@/pages/DishesPage"
import IngredientsPage from "@/pages/IngredientsPage"
import MenuPlannerPage from "@/pages/MenuPlannerPage"

function App() {
  const [currentPage, setCurrentPage] = useState("menu-planner")

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />
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
    <div className="flex h-screen flex-col md:flex-row">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="flex-1 overflow-auto bg-muted/30">{renderPage()}</main>
      </div>
    </div>
  )
}

export default App
