import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"
import { useQuery } from "@tanstack/react-query"
import * as tauri from "@/lib/tauri"
import type { Goals, SelectedDishInput } from "@/types"

const DEFAULT_GOALS: Omit<Goals, "id"> = {
  protein: 160,
  fat: 70,
  carbohydrates: 210,
}

interface MenuPlannerDraftContextValue {
  step: number
  setStep: Dispatch<SetStateAction<number>>
  goals: Omit<Goals, "id">
  setGoals: (goals: Omit<Goals, "id">) => void
  selectedDishes: SelectedDishInput[]
  setSelectedDishes: Dispatch<SetStateAction<SelectedDishInput[]>>
}

const MenuPlannerDraftContext = createContext<MenuPlannerDraftContextValue | null>(null)

export function MenuPlannerDraftProvider({ children }: { children: ReactNode }) {
  const { data: savedGoals } = useQuery({
    queryKey: ["goals"],
    queryFn: tauri.getGoals,
  })

  const [step, setStep] = useState(1)
  const [goalsState, setGoalsState] = useState<Omit<Goals, "id">>(DEFAULT_GOALS)
  const [selectedDishes, setSelectedDishes] = useState<SelectedDishInput[]>([])
  const [hasHydratedGoals, setHasHydratedGoals] = useState(false)
  const [hasEditedGoals, setHasEditedGoals] = useState(false)

  useEffect(() => {
    if (!savedGoals || hasHydratedGoals || hasEditedGoals) {
      return
    }

    setGoalsState({
      protein: savedGoals.protein,
      fat: savedGoals.fat,
      carbohydrates: savedGoals.carbohydrates,
    })
    setHasHydratedGoals(true)
  }, [hasEditedGoals, hasHydratedGoals, savedGoals])

  const setGoals = (goals: Omit<Goals, "id">) => {
    setHasEditedGoals(true)
    setGoalsState(goals)
  }

  return (
    <MenuPlannerDraftContext.Provider
      value={{
        step,
        setStep,
        goals: goalsState,
        setGoals,
        selectedDishes,
        setSelectedDishes,
      }}
    >
      {children}
    </MenuPlannerDraftContext.Provider>
  )
}

export function useMenuPlannerDraft() {
  const context = useContext(MenuPlannerDraftContext)

  if (!context) {
    throw new Error("useMenuPlannerDraft must be used within MenuPlannerDraftProvider")
  }

  return context
}
