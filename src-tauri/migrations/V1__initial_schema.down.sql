-- Rollback initial schema for Menu Planner

-- Drop tables in reverse order of creation (due to foreign keys)
DROP INDEX IF EXISTS idx_dish_ingredients_dish_id;
DROP INDEX IF EXISTS idx_dishes_name;
DROP INDEX IF EXISTS idx_ingredients_name;
DROP TABLE IF EXISTS dish_ingredients;
DROP TABLE IF EXISTS dishes;
DROP TABLE IF EXISTS ingredients;
DROP TABLE IF EXISTS goals;
