-- dishes.sql
-- Импорт блюд из menu_app
-- Источник: /Users/finnetrolle/dev/menu_app/menu.db

-- Вставка блюд
INSERT INTO dishes (id, name) VALUES
(4, 'Чашушули'),
(6, 'Окрошка'),
(8, 'Кофе с молоком'),
(9, 'Овсяная каша'),
(13, 'Минтай'),
(14, 'Оливье'),
(15, 'Куриное филе'),
(16, 'Картофель фри'),
(17, 'Щи'),
(18, 'Винегрет'),
(21, 'Шин Рамен'),
(22, 'Греча с молоком'),
(23, 'Банан'),
(24, 'Паста Барилла 100'),
(26, 'Лапша с курицей'),
(27, 'Мармеладка'),
(28, 'Яблоко'),
(29, 'Вареное яйцо'),
(30, 'Мимоза тунцовая'),
(31, 'Протеин'),
(32, 'Тестовое блюдо');

-- Вставка ингредиентов в блюда (dish_ingredients)
-- Чашушули (id=4)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(4, 1, 140.0),
(4, 22, 2.0),
(4, 25, 5.0),
(4, 30, 50.0),
(4, 31, 50.0),
(4, 37, 100.0),
(4, 46, 5.0),
(4, 52, 5.0);

-- Окрошка (id=6)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(6, 15, 30.0),
(6, 24, 60.0),
(6, 29, 50.0),
(6, 32, 50.0),
(6, 36, 50.0),
(6, 50, 5.0),
(6, 54, 200.0),
(6, 2, 100.0);

-- Кофе с молоком (id=8)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(8, 23, 150.0),
(8, 74, 150.0);

-- Овсяная каша (id=9)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(9, 23, 150.0),
(9, 60, 50.0),
(9, 74, 150.0);

-- Минтай (id=13)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(13, 57, 400.0);

-- Оливье (id=14)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(14, 2, 100.0),
(14, 15, 50.0),
(14, 24, 48.0),
(14, 26, 40.0),
(14, 28, 40.0),
(14, 29, 80.0),
(14, 45, 80.0);

-- Куриное филе (id=15)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(15, 2, 250.0);

-- Картофель фри (id=16)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(16, 29, 200.0);

-- Щи (id=17)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(17, 1, 70.0),
(17, 15, 30.0),
(17, 22, 2.0),
(17, 23, 300.0),
(17, 28, 15.0),
(17, 29, 20.0),
(17, 30, 15.0),
(17, 31, 15.0),
(17, 52, 7.0),
(17, 53, 0.25),
(17, 58, 30.0);

-- Винегрет (id=18)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(18, 22, 5.0),
(18, 26, 40.0),
(18, 27, 80.0),
(18, 28, 80.0),
(18, 29, 80.0),
(18, 31, 40.0),
(18, 45, 80.0),
(18, 58, 80.0);

-- Шин Рамен (id=21)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(21, 23, 300.0),
(21, 6, 60.0),
(21, 51, 15.0),
(21, 53, 20.0),
(21, 43, 50.0);

-- Греча с молоком (id=22)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(22, 4, 100.0),
(22, 23, 200.0),
(22, 74, 200.0);

-- Банан (id=23)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(23, 64, 140.0);

-- Паста Барилла 100 (id=24)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(24, 19, 3.0),
(24, 8, 100.0);

-- Лапша с курицей (id=26)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(26, 22, 10.0),
(26, 28, 50.0),
(26, 30, 50.0),
(26, 47, 25.0),
(26, 68, 100.0),
(26, 69, 70.0),
(26, 70, 10.0),
(26, 71, 3.0),
(26, 2, 75.0),
(26, 43, 25.0);

-- Мармеладка (id=27)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(27, 72, 12.5);

-- Яблоко (id=28)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(28, 65, 140.0);

-- Вареное яйцо (id=29)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(29, 24, 60.0);

-- Мимоза тунцовая (id=30)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(30, 15, 40.0),
(30, 24, 30.0),
(30, 28, 75.0),
(30, 29, 75.0),
(30, 31, 25.0),
(30, 73, 90.0);

-- Протеин (id=31)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(31, 75, 31.0);

-- Тестовое блюдо (id=32)
INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES
(32, 78, 150.0);
