# Menu Planner - Требования к проекту

**Версия документа:** 1.0
**Дата создания:** 2026-02-28
**Статус:** Инициализация

---

## 1. Цель проекта

Создать кроссплатформенное приложение для планирования питания, которое позволяет:
- Выбирать блюда и их количество на неделю или другой срок
- Видеть что когда есть (планирование по дням)
- Рассчитывать КБЖУ (калории, белки, жиры, углеводы)
- Просматривать итоговые показатели потребления

**Целевые платформы:** iOS, Android, Windows, macOS

---

## 2. Выбранный технологический стек

### 2.1 Основной фреймворк
**Tauri 2.0** — фреймворк для создания кроссплатформенных приложений

**Причины выбора:**
- ✅ Нативный UI на всех платформах
- ✅ Rust backend (производительность, безопасность)
- ✅ Единая кодовая база для всех платформ
- ✅ Мобильная поддержка в Tauri 2.0
- ✅ Малый размер приложения

### 2.2 Frontend стек
- **React 19** + TypeScript
- **Vite** (сборка и dev сервер)
- **Tailwind CSS** (стилизация)
- **Radix UI** (компонентная библиотека)
- **TanStack Query** (state management и data fetching)

### 2.3 Backend стек (Rust)
- **Rust** (язык backend'а)
- **SQLite** (локальная база данных)
- `rusqlite` или `sqlx` (работа с SQLite)
- `serde` (сериализация/десериализация)
- `tauri` commands (API для frontend)

---

## 3. Функциональные требования

### 3.1 Управление блюдами
| Функция | Описание |
|---------|----------|
| Создание блюда | Добавление нового блюда с названием и ингредиентами |
| Редактирование блюда | Изменение ингредиентов и их количества |
| Удаление блюда | Удаление блюда из базы |
| Просмотр списка блюд | Отображение всех блюд с базовой информацией |

### 3.2 Управление ингредиентами
| Функция | Описание |
|---------|----------|
| Создание ингредиента | Добавление с КБЖУ на 100г |
| Редактирование ингредиента | Изменение КБЖУ |
| Удаление ингредиента | Удаление из базы |
| Просмотр списка ингредиентов | Отображение всех ингредиентов |

### 3.3 Планирование меню
| Функция | Описание |
|---------|----------|
| Установка целей КБЖУ | Настройка целей по белкам, жирам, углеводам, калориям |
| Выбор блюд | Выбор блюд для плана с указанием количества порций |
| Расчет КБЖУ | Автоматический расчет КБЖУ выбранного плана |
| Список покупок | Агрегация ингредиентов с учетом порций |
| Прогресс визуализация | Визуальное отображение достижения целей |

---

## 4. Нефункциональные требования

### 4.1 Производительность
- Отображение списка блюд < 500ms при 100+ записях
- Расчет КБЖУ для меню < 100ms
- Локальная база данных (без сетевых запросов)

### 4.2 Безопасность
- Данные хранятся локально
- Нет сетевых запросов к внешним API
- Валидация всех входных данных

### 4.3 Кроссплатформенность
- Windows (10+)
- macOS (12+)
- iOS (14+)
- Android (9+)

### 4.4 UX требования
- 3-шаговый workflow для планирования меню
- Реалтайм расчет КБЖУ при выборе блюд
- Интуитивный интерфейс на русском языке

---

## 5. Архитектурные решения (взято из menu_app)

### 5.1 Repository Pattern
**Описание:** Разделение доступа к данным от бизнес-логики

**Реализация:**
```
trait Repository {
    fn get_by_id(&self, id: i64) -> Result<Option<T>>;
    fn get_all(&self) -> Result<Vec<T>>;
    fn create(&self, item: &T) -> Result<i64>;
    fn update(&self, id: i64, item: &T) -> Result<()>;
    fn delete(&self, id: i64) -> Result<()>;
}
```

### 5.2 Service Layer
**Описание:** Бизнес-логика в отдельных сервисах

**Сервисы:**
- `NutritionService` — расчет КБЖУ
- `DishService` — операции над блюдами
- `IngredientService` — операции над ингредиентами

### 5.3 Расчет КБЖУ (ключевая логика)

**Правило 4-9-4:**
- 1г белка = 4 ккал
- 1г жира = 9 ккал
- 1г углеводов = 4 ккал

**Структура `NutritionInfo`:**
```rust
pub struct NutritionInfo {
    pub calories: f64,
    pub proteins: f64,
    pub fats: f64,
    pub carbohydrates: f64,
}

impl NutritionInfo {
    // Методы для масштабирования и агрегации
    pub fn multiply(self, factor: f64) -> Self;
    pub fn add(self, other: Self) -> Self;
}
```

### 5.4 Структура базы данных

```sql
CREATE TABLE ingredients (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    protein_g REAL NOT NULL,
    fat_g REAL NOT NULL,
    carbohydrates_g REAL NOT NULL
);

CREATE TABLE dishes (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE dish_ingredients (
    dish_id INTEGER REFERENCES dishes(id),
    ingredient_id INTEGER REFERENCES ingredients(id),
    amount REAL NOT NULL,
    PRIMARY KEY (dish_id, ingredient_id)
);

CREATE TABLE goals (
    id INTEGER PRIMARY KEY DEFAULT 1,
    protein REAL NOT NULL,
    fat REAL NOT NULL,
    carbohydrates REAL NOT NULL,
    calories REAL NOT NULL
);
```

---

## 6. Frontend решения (взято из menu_app)

### 6.1 Компоненты для переноса
| Компонент | Назначение |
|-----------|-----------|
| `NutritionProgress` | Визуализация прогресса КБЖУ |
| `DishCard` / `DishTable` | Отображение блюд |
| `DishForm` | Создание/редактирование блюд |
| `LoadingSpinner` | Индикатор загрузки |
| `ActionMenu` | Контекстное меню действий |
| `Badge`, `Button`, `Input` | Базовые UI компоненты |

### 6.2 Type Safety

**TypeScript interfaces:**
```typescript
interface Nutrition {
  calories: number;
  proteins: number;
  fats: number;
  carbohydrates: number;
}

interface Ingredient {
  id: number;
  name: string;
  nutrition: Nutrition;
}

interface Dish {
  id: number;
  name: string;
  weight_g: number;
  energy_kcal: number;
  protein_g: number;
  fat_g: number;
  carbohydrates_g: number;
}

interface SelectedDish {
  id: number;
  portions: number;
}
```

### 6.3 State Management

**TanStack Query hooks:**
```typescript
// useDishes.ts
export function useDishes() {
  return useQuery<Dish[]>({
    queryKey: ['dishes'],
    queryFn: () => invoke('get_dishes'),
  });
}

export function useCreateDish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dish) => invoke('create_dish', { dish }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dishes'] }),
  });
}
```

### 6.4 3-шаговый workflow

```
Step 1: Goals Input
  └─> Ввод целей КБЖУ

Step 2: Dish Selection
  └─> Выбор блюд + указание порций
  └─> Реалтайм расчет текущих КБЖУ

Step 3: Results Display
  └─> Итоговый список блюд
  └─> Список покупок (агрегация ингредиентов)
  └─> Итоговые КБЖУ
```

---

## 7. API дизайн (Tauri Commands)

| Python/FastAPI | Tauri Command (Rust) | Описание |
|----------------|---------------------|----------|
| `GET /api/dishes` | `get_dishes()` | Список всех блюд |
| `GET /api/dishes/{id}` | `get_dish(id: i64)` | Детали блюда |
| `POST /api/dishes/new` | `create_dish(dish: CreateDish)` | Создание блюда |
| `POST /api/dishes/{id}` | `update_dish(id: i64, dish: UpdateDish)` | Обновление блюда |
| `DELETE /api/dishes/{id}` | `delete_dish(id: i64)` | Удаление блюда |
| `GET /api/ingredients` | `get_ingredients()` | Список ингредиентов |
| `POST /api/ingredients` | `create_ingredient(ingredient: CreateIngredient)` | Создание ингредиента |
| `GET/POST /api/goals` | `get_goals()`, `set_goals(goals: Goals)` | Цели КБЖУ |
| `POST /api/menu` | `calculate_menu(dishes: Vec<SelectedDish>)` | Расчет меню |

---

## 8. Структура проекта

```
menu_planner/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── models/
│   │   │   ├── mod.rs
│   │   │   ├── nutrition.rs
│   │   │   ├── dish.rs
│   │   │   └── ingredient.rs
│   │   ├── repositories/
│   │   │   ├── mod.rs
│   │   │   ├── trait.rs
│   │   │   ├── dish_repository.rs
│   │   │   └── ingredient_repository.rs
│   │   ├── services/
│   │   │   ├── mod.rs
│   │   │   └── nutrition_service.rs
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── dishes.rs
│   │   │   ├── ingredients.rs
│   │   │   ├── goals.rs
│   │   │   └── menu.rs
│   │   ├── database/
│   │   │   ├── mod.rs
│   │   │   ├── connection.rs
│   │   │   └── schema.rs
│   │   └── lib.rs / main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                    # React frontend
│   ├── types/
│   │   └── index.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── card.tsx
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ...
│   │   ├── NutritionProgress.tsx
│   │   ├── DishCard.tsx
│   │   ├── DishTable.tsx
│   │   ├── DishForm.tsx
│   │   ├── IngredientTable.tsx
│   │   └── LoadingSpinner.tsx
│   ├── pages/
│   │   ├── DishesPage.tsx
│   │   ├── AddDishPage.tsx
│   │   ├── EditDishPage.tsx
│   │   ├── IngredientsPage.tsx
│   │   └── MenuPlannerPage.tsx
│   ├── hooks/
│   │   ├── useDishes.ts
│   │   ├── useIngredients.ts
│   │   └── useGoals.ts
│   ├── services/
│   │   └── tauri-api.ts
│   ├── App.tsx
│   └── main.tsx
│
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 9. Зависимости проекта

### 9.1 Frontend (package.json)
```json
{
  "dependencies": {
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@tanstack/react-query": "^5.90.21",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.564.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.13.0",
    "tailwind-merge": "^3.4.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@tailwindcss/postcss": "^4.1.18",
    "@tauri-apps/cli": "^2.0.0",
    "@vitejs/plugin-react": "^5.1.1",
    "eslint": "^9.39.1",
    "prettier": "^3.8.1",
    "tailwindcss": "^4.1.18",
    "typescript": "~5.9.3",
    "vite": "^7.3.1"
  }
}
```

### 9.2 Backend (Cargo.toml)
```toml
[dependencies]
tauri = { version = "2.0", features = ["shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
rusqlite = { version = "0.32", features = ["bundled"] }
tokio = { version = "1.0", features = ["full"] }

[build-dependencies]
tauri-build = { version = "2.0", features = [] }
```

---

## 10. Что НЕ переносить из menu_app

| Причина | Что |
|---------|-----|
| Серверная инфраструктура | Docker, nginx, uvicorn, CORS |
| Async/await в backend | Tauri commands синхронны по умолчанию |
| PostgreSQL поддержка | SQLite достаточно для десктопа/мобильного |
| Отдельный HTTP API | Все запросы через Tauri invoke() |

---

## 11. Приоритеты реализации

### Phase 1: Core Foundation
1. Настройка Tauri 2.0 проекта
2. Базовая структура Rust backend
3. Frontend с React + Tailwind + Radix UI

### Phase 2: Domain Layer
1. Модели: `NutritionInfo`, `Dish`, `Ingredient`
2. Repository trait и реализации
3. SQLite схема БД

### Phase 3: Business Logic
1. `NutritionService` с расчетом КБЖУ
2. Tauri commands для CRUD операций

### Phase 4: Frontend UI
1. Перенос компонентов из menu_app
2. Реализация 3-шагового workflow
3. Интеграция с Tauri commands

### Phase 5: Testing & Polish
1. Тесты расчета КБЖУ
2. Тесты CRUD операций
3. UX улучшения

---

## 12. Источники

- Анализ существующего приложения: `/Users/finnetrolle/dev/menu_app`
- Документация Tauri 2.0: https://v2.tauri.app/
- Radix UI: https://www.radix-ui.com/
- TanStack Query: https://tanstack.com/query/latest
