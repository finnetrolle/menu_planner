# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Menu Planner is a cross-platform desktop/mobile application for planning meals and tracking nutrition (calories, proteins, fats, carbohydrates). Built with Tauri 2.0, React 19, and Rust.

**Tech Stack:**
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Radix UI + TanStack Query
- **Backend:** Rust + SQLite (via rusqlite)
- **Framework:** Tauri 2.0

## Common Commands

### Development
```bash
npm run dev              # Start Vite dev server (auto-started by Tauri)
npm run build            # Build frontend (TypeScript compile + Vite build)
npm run preview          # Preview production build
```

### Tauri Commands
```bash
npm run tauri dev        # Start full development environment (frontend + Tauri)
npm run tauri build      # Build complete application
```

### Rust (Backend)
```bash
cd src-tauri
cargo check              # Check Rust code
cargo build              # Build Rust backend
cargo test               # Run Rust tests
cargo clippy             # Rust linter
```

## Architecture

### Backend (Rust)

**Layered Architecture:**
```
src-tauri/src/
├── models/           # Domain models (NutritionInfo, Dish, Ingredient)
├── repositories/     # Repository pattern + CRUD implementations
├── services/         # Business logic (NutritionService)
├── commands/         # Tauri commands (exposed to frontend)
└── database/         # SQLite connection and schema
```

**Key Concepts:**

1. **Tauri Commands:** Replace REST API. Use `#[tauri::command]` macro on functions, then invoke from frontend:
   ```rust
   #[tauri::command]
   fn get_dishes() -> Result<Vec<Dish>, String> { ... }
   ```

2. **Repository Pattern:** Generic trait for data access:
   ```rust
   trait Repository<T> {
       fn get_by_id(&self, id: i64) -> Result<Option<T>>;
       fn get_all(&self) -> Result<Vec<T>>;
       fn create(&self, item: &T) -> Result<i64>;
       fn update(&self, id: i64, item: &T) -> Result<()>;
       fn delete(&self, id: i64) -> Result<()>;
   }
   ```

3. **Nutrition Calculation (4-9-4 rule):**
   - 1g protein = 4 kcal
   - 1g fat = 9 kcal
   - 1g carbohydrates = 4 kcal

### Frontend (React)

```
src/
├── types/            # TypeScript interfaces matching Rust structs
├── components/
│   └── ui/          # Radix UI primitive components
├── pages/           # Page components (DishesPage, MenuPlannerPage, etc.)
├── hooks/           # TanStack Query wrappers for Tauri commands
└── services/        # Tauri API helpers
```

**State Management:** TanStack Query for server state (wraps `invoke()` calls)

## Database Schema

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

## Initial Data

The `data/` directory contains exported data from the existing `menu_app` project:
- `ingredients.sql` - 80 ingredients with nutrition values
- `dishes.sql` - 20 dishes with ingredients
- `ingredients.json` / `dishes.json` - JSON versions for Rust deserialization

Use these to seed the SQLite database on first app launch.

## Reference Implementation

Key patterns can be referenced from `/Users/finnetrolle/dev/menu_app`:
- `src/models/nutrition.py` → NutritionInfo class structure
- `src/services/nutrition_service.py` → NutritionService logic
- `frontend/src/pages/MenuPlannerPage.tsx` → 3-step workflow UI
- `frontend/src/components/NutritionProgress.tsx` → Progress bar component

## Important Notes

1. **Language:** UI text is in Russian. Maintain Russian language for all user-facing strings.

2. **Tauri Commands are Synchronous:** Unlike FastAPI async endpoints, Tauri commands run synchronously by default. Avoid `async fn` unless specifically needed.

3. **Data Persistence:** All data is local (SQLite). No network requests required.

4. **Mobile Support:** Tauri 2.0 supports iOS/Android via `tauri mobile` plugin (not yet implemented).

5. **3-Step Menu Planner Workflow:**
   - Step 1: Goals Input (КБЖУ targets)
   - Step 2: Dish Selection (real-time nutrition calculation)
   - Step 3: Results (meal plan + shopping list)
