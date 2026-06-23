import { lazy, Suspense, startTransition, useDeferredValue, useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight } from "lucide-react"
import DialogLoadingFallback from "@/components/ui/dialog-loading"
import { Button } from "@/components/ui/button"
import { useDishes, useCreateDish, useUpdateDish } from "@/hooks/useDishes"
import { useIngredients, useCreateIngredient, useUpdateIngredient } from "@/hooks/useIngredients"
import { useMenuPlan } from "@/hooks/useMenuPlan"
import { getUserFacingErrorMessage } from "@/lib/error-message"
import MenuPlannerDishSelectionStep from "@/pages/menu-planner/MenuPlannerDishSelectionStep"
import { useMenuPlannerDraft } from "@/pages/menu-planner/MenuPlannerDraftContext"
import MenuPlannerGoalsStep from "@/pages/menu-planner/MenuPlannerGoalsStep"
import MenuPlannerResultsStep from "@/pages/menu-planner/MenuPlannerResultsStep"
import {
  calculateDishPreview,
  EMPTY_MENU_PLAN,
  GOAL_PRESETS,
} from "@/pages/menu-planner/helpers"
import * as tauri from "@/lib/tauri"
import type { DishWithId, Goals, IngredientWithId } from "@/types"
import { calculateCalories } from "@/types"

const DishDialog = lazy(() => import("@/components/DishDialog"))
const IngredientDialog = lazy(() => import("@/components/IngredientDialog"))

export default function MenuPlannerPage() {
  const queryClient = useQueryClient()
  const { step, setStep, goals, setGoals, selectedDishes, setSelectedDishes } =
    useMenuPlannerDraft()

  const saveGoalsMutation = useMutation({
    mutationFn: (goals: Omit<Goals, "id">) => tauri.saveGoals(goals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] })
    },
  })

  // Загрузка данных
  const { data: dishes = [] } = useDishes()
  const { data: ingredients = [] } = useIngredients()

  const createDishMutation = useCreateDish()
  const updateDishMutation = useUpdateDish()
  const createIngredientMutation = useCreateIngredient()
  const updateIngredientMutation = useUpdateIngredient()

  const deferredSelectedDishes = useDeferredValue(selectedDishes)
  const deferredGoals = useDeferredValue(goals)

  const menuPlanQuery = useMenuPlan(deferredSelectedDishes, deferredGoals, step >= 2)
  const menuPlan = menuPlanQuery.data ?? EMPTY_MENU_PLAN
  const menuPlanErrorMessage = menuPlanQuery.error
    ? getUserFacingErrorMessage(menuPlanQuery.error)
    : null

  // Диалоги
  const [dishDialogOpen, setDishDialogOpen] = useState(false)
  const [editingDish, setEditingDish] = useState<DishWithId | null>(null)
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<IngredientWithId | null>(null)

  // Автоматический расчет калорий
  const calories = useMemo(
    () => calculateCalories(goals.protein, goals.fat, goals.carbohydrates),
    [goals]
  )

  const ingredientsById = useMemo(
    () => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])),
    [ingredients]
  )

  const selectedDishById = useMemo(
    () => new Map(selectedDishes.map((selectedDish) => [selectedDish.dish_id, selectedDish])),
    [selectedDishes]
  )

  const plannedItemsByDishId = useMemo(
    () => new Map(menuPlan.items.map((item) => [item.dish_id, item])),
    [menuPlan.items]
  )

  useEffect(() => {
    const availableDishIds = new Set(dishes.map((dish) => dish.id))

    setSelectedDishes((previousSelectedDishes) => {
      const nextSelectedDishes = previousSelectedDishes.filter((selectedDish) =>
        availableDishIds.has(selectedDish.dish_id)
      )

      return nextSelectedDishes.length === previousSelectedDishes.length
        ? previousSelectedDishes
        : nextSelectedDishes
    })
  }, [dishes])

  const toggleDish = (dish: DishWithId) => {
    startTransition(() => {
      setSelectedDishes((previousSelectedDishes) => {
        const existingDish = previousSelectedDishes.find(
          (selectedDish) => selectedDish.dish_id === dish.id
        )

        if (existingDish) {
          return previousSelectedDishes.filter(
            (selectedDish) => selectedDish.dish_id !== dish.id
          )
        }

        return [...previousSelectedDishes, { dish_id: dish.id, portions: 1 }]
      })
    })
  }

  const updatePortions = (dishId: number, portions: number) => {
    const normalizedPortions = portions > 0 ? portions : 1

    startTransition(() => {
      setSelectedDishes((previousSelectedDishes) =>
        previousSelectedDishes.map((selectedDish) =>
          selectedDish.dish_id === dishId
            ? { ...selectedDish, portions: normalizedPortions }
            : selectedDish
        )
      )
    })
  }

  const handleSaveGoals = () => {
    saveGoalsMutation.mutate(goals)
  }

  const handleEditDish = (dish: DishWithId) => {
    createDishMutation.reset()
    updateDishMutation.reset()
    setEditingDish(dish)
    setDishDialogOpen(true)
  }

  const handleSaveDish = (dishData: Omit<DishWithId, "id">) => {
    if (editingDish) {
      updateDishMutation.mutate(
        { id: editingDish.id, dish: dishData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menu-plan"] })
            setDishDialogOpen(false)
            setEditingDish(null)
          },
        }
      )
    }
  }

  const handleCreateDish = (dishData: Omit<DishWithId, "id">) => {
    createDishMutation.mutate(dishData, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["menu-plan"] })
        setDishDialogOpen(false)
        setEditingDish(null)
      },
    })
  }

  const handleEditIngredient = (ingredient: IngredientWithId) => {
    createIngredientMutation.reset()
    updateIngredientMutation.reset()
    setEditingIngredient(ingredient)
    setIngredientDialogOpen(true)
  }

  const openCreateDishDialog = () => {
    createDishMutation.reset()
    updateDishMutation.reset()
    setEditingDish(null)
    setDishDialogOpen(true)
  }

  const handleEditIngredientById = (ingredientId: number) => {
    const ingredient = ingredientsById.get(ingredientId)

    if (ingredient) {
      handleEditIngredient(ingredient)
    }
  }

  const dishDialogErrorMessage = editingDish
    ? updateDishMutation.error
      ? getUserFacingErrorMessage(updateDishMutation.error)
      : null
    : createDishMutation.error
      ? getUserFacingErrorMessage(createDishMutation.error)
      : null

  const ingredientDialogErrorMessage = editingIngredient
    ? updateIngredientMutation.error
      ? getUserFacingErrorMessage(updateIngredientMutation.error)
      : null
    : createIngredientMutation.error
      ? getUserFacingErrorMessage(createIngredientMutation.error)
      : null

  const handleSaveIngredient = (ingredientData: Omit<IngredientWithId, "id">) => {
    if (editingIngredient) {
      updateIngredientMutation.mutate(
        { id: editingIngredient.id, ingredient: ingredientData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menu-plan"] })
            setIngredientDialogOpen(false)
            setEditingIngredient(null)
          },
        }
      )
    } else {
      createIngredientMutation.mutate(ingredientData, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["menu-plan"] })
          setIngredientDialogOpen(false)
          setEditingIngredient(null)
        },
      })
    }
  }

  const handleDishDialogOpenChange = (open: boolean) => {
    setDishDialogOpen(open)

    if (!open) {
      setEditingDish(null)
    }
  }

  const handleIngredientDialogOpenChange = (open: boolean) => {
    setIngredientDialogOpen(open)

    if (!open) {
      setEditingIngredient(null)
    }
  }

  const dishDialog = dishDialogOpen ? (
    <Suspense
      fallback={
        <DialogLoadingFallback
          open={dishDialogOpen}
          onOpenChange={handleDishDialogOpenChange}
          title={editingDish ? "Загрузка блюда" : "Создание блюда"}
          description="Подготавливаем форму блюда."
        />
      }
    >
      <DishDialog
        open={dishDialogOpen}
        onOpenChange={handleDishDialogOpenChange}
        dish={editingDish}
        ingredients={ingredients}
        onSave={editingDish ? handleSaveDish : handleCreateDish}
        isSaving={editingDish ? updateDishMutation.isPending : createDishMutation.isPending}
        errorMessage={dishDialogErrorMessage}
      />
    </Suspense>
  ) : null

  const ingredientDialog = ingredientDialogOpen ? (
    <Suspense
      fallback={
        <DialogLoadingFallback
          open={ingredientDialogOpen}
          onOpenChange={handleIngredientDialogOpenChange}
          title={editingIngredient ? "Загрузка ингредиента" : "Создание ингредиента"}
          description="Подготавливаем форму ингредиента."
        />
      }
    >
      <IngredientDialog
        open={ingredientDialogOpen}
        onOpenChange={handleIngredientDialogOpenChange}
        ingredient={editingIngredient}
        onSave={handleSaveIngredient}
        isSaving={
          editingIngredient ? updateIngredientMutation.isPending : createIngredientMutation.isPending
        }
        errorMessage={ingredientDialogErrorMessage}
      />
    </Suspense>
  ) : null

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Создание плана питания
        </h1>
        <p className="mt-1 text-muted-foreground">
          Шаг {step} из 3
          {step === 1 ? ": Установите цели КБЖУ" : null}
          {step === 2 ? ": Выберите блюда" : null}
          {step === 3 ? ": Результаты" : null}
        </p>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div className="flex gap-2">
          {[1, 2, 3].map((currentStep) => (
            <div
              key={currentStep}
              className={`h-1 flex-1 rounded-full transition-colors ${
                currentStep <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mb-8">
        {step === 1 ? (
          <MenuPlannerGoalsStep
            goals={goals}
            presets={GOAL_PRESETS}
            calories={calories}
            isSavingGoals={saveGoalsMutation.isPending}
            errorMessage={
              saveGoalsMutation.error ? getUserFacingErrorMessage(saveGoalsMutation.error) : null
            }
            onGoalsChange={setGoals}
            onSaveGoals={handleSaveGoals}
          />
        ) : null}
        {step === 2 ? (
          <MenuPlannerDishSelectionStep
            dishes={dishes}
            selectedDishById={selectedDishById}
            plannedItemsByDishId={plannedItemsByDishId}
            menuPlan={menuPlan}
            menuPlanIsFetching={menuPlanQuery.isFetching}
            menuPlanErrorMessage={menuPlanErrorMessage}
            calories={calories}
            goals={goals}
            onCreateDish={openCreateDishDialog}
            onToggleDish={toggleDish}
            onUpdatePortions={updatePortions}
            onEditDish={handleEditDish}
            getDishPreview={(dish, portions) =>
              calculateDishPreview(dish, portions, ingredientsById)
            }
          />
        ) : null}
        {step === 3 ? (
          <MenuPlannerResultsStep
            menuPlan={menuPlan}
            menuPlanErrorMessage={menuPlanErrorMessage}
            onEditIngredient={handleEditIngredientById}
          />
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className="gap-2"
        >
          <ChevronLeft className="h-5 w-5" />
          Назад
        </Button>
        <Button
          onClick={() => setStep(step + 1)}
          disabled={step === 3}
          className="gap-2"
        >
          {step === 3 ? "Готово" : "Далее"}
          {step !== 3 ? <ChevronRight className="h-5 w-5" /> : null}
        </Button>
      </div>

      {dishDialog}
      {ingredientDialog}
    </div>
  )
}
