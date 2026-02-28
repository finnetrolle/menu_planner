-- Initial schema for Menu Planner

-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    protein REAL NOT NULL,
    fat REAL NOT NULL,
    carbohydrates REAL NOT NULL
);

-- Create index on ingredients.name for faster lookups
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);

-- Create dishes table
CREATE TABLE IF NOT EXISTS dishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    weight REAL
);

-- Create index on dishes.name for faster lookups
CREATE INDEX IF NOT EXISTS idx_dishes_name ON dishes(name);

-- Create dish_ingredients table
CREATE TABLE IF NOT EXISTS dish_ingredients (
    dish_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    PRIMARY KEY (dish_id, ingredient_id),
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

-- Create index on dish_ingredients.dish_id for faster JOIN queries
CREATE INDEX IF NOT EXISTS idx_dish_ingredients_dish_id ON dish_ingredients(dish_id);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY DEFAULT 1,
    protein REAL NOT NULL,
    fat REAL NOT NULL,
    carbohydrates REAL NOT NULL
);
