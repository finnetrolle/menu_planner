# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Snapshot

Menu Planner is currently a Tauri 2 desktop application for meal planning and nutrition tracking.

- Frontend: React 19 + TypeScript + Vite + Tailwind CSS + Radix UI + TanStack Query
- Backend: Rust + rusqlite (SQLite)
- UI language: Russian
- Main flows:
  - ingredients CRUD
  - dishes CRUD and composition from ingredients
  - 3-step meal plan builder with goals, selected dishes, and shopping list

Current navigation is state-based, not route-based:

- `menu-planner` -> main 3-step planner
- `dishes` -> dishes management
- `ingredients` -> ingredients management
- `dashboard` -> currently mock/demo data

## Verified Commands

Frontend and Tauri:

```bash
npm install
npm run dev          # Vite only, port 1420
npm run build        # TypeScript + Vite production build
npm run preview      # Preview dist/
npm run tauri        # cargo tauri dev
npm run tauri-build  # cargo tauri build --bundles app
npm run tauri-build-dmg  # cargo tauri build --bundles app dmg
```

Rust:

```bash
cd src-tauri
cargo check
cargo build
cargo test
cargo clippy
```

Notes:

- The actual package scripts are `npm run tauri`, `npm run tauri-build`, and `npm run tauri-build-dmg`.
- Older docs that say `npm run tauri dev` or `npm run tauri build` are outdated for this repo.
- `vite.config.ts` defines `@` as an alias to `./src` and forces port `1420`.

## How The App Works

### Frontend

- `src/main.tsx` creates the TanStack Query client and disables retry/refetch-on-focus.
- `src/App.tsx` switches pages via local `currentPage` state. There is no React Router.
- `src/lib/tauri.ts` contains thin typed wrappers around Tauri `invoke`.
- `src/hooks/useIngredients.ts` and `src/hooks/useDishes.ts` wrap those calls in queries/mutations and invalidate caches after writes.

Main pages:

- `src/pages/MenuPlannerPage.tsx`
  - the primary product flow
  - Step 1: goals input
  - Step 2: dish selection and portion editing
  - Step 3: summary and shopping list
  - nutrition totals and shopping list are computed client-side
- `src/pages/IngredientsPage.tsx`
  - searchable and sortable ingredients table
  - inline dialog-driven create/edit
- `src/pages/DishesPage.tsx`
  - dish cards with client-side nutrition preview
  - dialog-driven create/edit
- `src/pages/DashboardPage.tsx`
  - static placeholder/demo content, not backed by the database

Dialogs:

- `src/components/DishDialog.tsx`
  - edit dish name, optional portion weight, and ingredient rows
  - uses `@dnd-kit` for row reordering
  - uses `Autocomplete` for ingredient selection
  - previews nutrition with `recharts`
- `src/components/IngredientDialog.tsx`
  - edit ingredient macros
  - previews calories using the 4-9-4 formula

### Backend

- `src-tauri/src/main.rs`
  - registers Tauri commands with `tauri::generate_handler!`
  - initializes `tauri_plugin_shell`, although the current frontend does not use it
- `src-tauri/src/commands.rs`
  - synchronous Tauri command layer
  - exposes ingredients, dishes, goals, and `calculate_menu_nutrition`
- `src-tauri/src/repositories/*`
  - repository-style CRUD around `rusqlite::Connection`
  - validates models with `validator`
- `src-tauri/src/services/*`
  - nutrition and menu-planning helpers
- `src-tauri/src/database.rs`
  - opens SQLite
  - creates schema imperatively
  - seeds initial data if the DB file does not exist

### Data Flow

The main data path is:

`React page -> React Query hook -> src/lib/tauri.ts -> Tauri command -> repository -> SQLite`

There is no HTTP server. All persistence is local.

## Database And Seed Data

The runtime schema is defined in `src-tauri/src/database.rs` and mirrored in `src-tauri/migrations/V1__initial_schema.up.sql`.

```sql
CREATE TABLE ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    protein REAL NOT NULL,
    fat REAL NOT NULL,
    carbohydrates REAL NOT NULL
);

CREATE TABLE dishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    weight REAL
);

CREATE TABLE dish_ingredients (
    dish_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    PRIMARY KEY (dish_id, ingredient_id),
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

CREATE TABLE goals (
    id INTEGER PRIMARY KEY DEFAULT 1,
    protein REAL NOT NULL,
    fat REAL NOT NULL,
    carbohydrates REAL NOT NULL
);
```

Important details:

- `goals` does not store calories. Calories are derived from macros.
- Seed data currently comes from hardcoded Rust vectors inside `src-tauri/src/database.rs`.
- The `data/` directory is reference material only at the moment. It is not loaded by the app.
- `src-tauri/menu_planner.db` is a checked-in DB snapshot, not the runtime DB path used by `get_connection()`.

## Runtime Persistence Location

`src-tauri/src/database.rs` uses `std::env::current_exe()` and stores `menu_planner.db` next to the executable.

That means:

- in development, the DB is created near the compiled binary under `target/`
- in a packaged macOS app, the DB path resolves inside `Menu Planner.app/Contents/MacOS/`

This is a poor location for installed apps because app bundles are not meant to be user-writable. If you work on packaging or persistence, prefer moving the DB to a Tauri app-data directory instead of keeping it beside the executable.

## Build And Installable App Flow

Tauri build configuration lives in `src-tauri/tauri.conf.json`:

- `beforeBuildCommand`: `npm run build`
- `frontendDist`: `../dist`
- `bundle.active`: `true`
- `bundle.targets`: `["app"]`

What happens during release build:

1. `npm run tauri-build`
2. Tauri runs `npm run build`
3. Vite outputs frontend assets to `dist/`
4. Rust builds the release binary
5. Tauri packages the `.app` bundle for the current OS

Verified locally on this macOS machine:

- `npm run build` passes
- `cargo check` passes
- `cargo test` passes
- `npm run tauri-build` successfully produced:
  - release binary: `src-tauri/target/release/menu-planner`
  - app bundle: `src-tauri/target/release/bundle/macos/Menu Planner.app`

Packaging caveat:

- `npm run tauri-build` is intentionally limited to the `.app` bundle because the generated DMG flow is not stable in automation.
- `npm run tauri-build-dmg` still enters Tauri's generated `bundle_dmg.sh` and may stall in the Finder `osascript` customization step.
- If that happens, the compiled `.app` is still a valid artifact for inspection and distribution outside DMG packaging.

## Important Caveats

- `DashboardPage` is mock UI and should not be treated as a real data-backed screen.
- `refinery` is listed in `Cargo.toml` and SQL migrations exist, but runtime DB setup is manual in `database.rs`; migrations are not executed by the app.
- The frontend does not call the backend `calculate_menu_nutrition` command.
- `MenuPlannerPage.tsx` calculates totals and shopping lists on the client after loading dishes and ingredients.
- The backend `MenuService::calculate_menu_nutrition` path is currently not trustworthy because it passes an empty ingredient map into `NutritionService::calculate_dish_nutrition`.
- `dish_ingredients` uses `(dish_id, ingredient_id)` as a primary key. The UI can duplicate ingredient rows in `DishDialog`, but saving duplicate ingredient IDs in one dish will violate the DB constraint.
- The current production frontend bundle is large. `vite build` warns about a roughly 741 kB JS chunk before gzip optimization.
- Tauri warns that the bundle identifier `com.menuplanner.app` ends with `.app`; a reverse-DNS identifier without that suffix would be better.

## Editing Guidance

- Keep all user-facing text in Russian unless the task explicitly asks otherwise.
- Preserve the current layering:
  - thin Tauri wrapper functions
  - React Query hooks
  - page/dialog UI
  - Rust repositories/services/commands
- If you change the DB schema, update both:
  - `src-tauri/src/database.rs`
  - `src-tauri/migrations/V1__initial_schema.up.sql` and `.down.sql`
- If you add a Tauri command, wire all layers:
  1. Rust repository/service/command
  2. `tauri::generate_handler!` in `src-tauri/src/main.rs`
  3. `src/lib/tauri.ts`
  4. React Query hook or page usage
- Reuse the 4-9-4 calorie rule consistently. The shared frontend helper lives in `src/types/index.ts` as `calculateCalories`.
