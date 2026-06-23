pub struct SeedIngredient {
    pub legacy_id: i64,
    pub name: &'static str,
    pub protein: f64,
    pub fat: f64,
    pub carbohydrates: f64,
}

pub struct SeedDishIngredient {
    pub legacy_ingredient_id: i64,
    pub amount: f64,
}

pub struct SeedDish {
    pub name: &'static str,
    pub weight: Option<f64>,
    pub ingredients: &'static [SeedDishIngredient],
}

pub const SEED_INGREDIENTS: &[SeedIngredient] = &[
    SeedIngredient {
        legacy_id: 1,
        name: "говядина лопатка лента",
        protein: 19.4,
        fat: 6.6,
        carbohydrates: 0.0,
    },
    SeedIngredient {
        legacy_id: 2,
        name: "курица грудка лента",
        protein: 24.5,
        fat: 1.1,
        carbohydrates: 0.0,
    },
    SeedIngredient {
        legacy_id: 3,
        name: "свинина шея лента",
        protein: 19.0,
        fat: 28.0,
        carbohydrates: 0.0,
    },
    SeedIngredient {
        legacy_id: 4,
        name: "гречневая крупа мистраль",
        protein: 12.0,
        fat: 3.4,
        carbohydrates: 72.0,
    },
    SeedIngredient {
        legacy_id: 5,
        name: "рис лазер",
        protein: 7.5,
        fat: 1.5,
        carbohydrates: 77.0,
    },
    SeedIngredient {
        legacy_id: 6,
        name: "шин рамен",
        protein: 8.0,
        fat: 13.0,
        carbohydrates: 67.0,
    },
    SeedIngredient {
        legacy_id: 7,
        name: "лапша рисовая",
        protein: 6.4,
        fat: 0.8,
        carbohydrates: 79.0,
    },
    SeedIngredient {
        legacy_id: 8,
        name: "спагетти барилла",
        protein: 14.0,
        fat: 2.0,
        carbohydrates: 69.7,
    },
    SeedIngredient {
        legacy_id: 9,
        name: "сливки 20%",
        protein: 2.5,
        fat: 20.0,
        carbohydrates: 4.0,
    },
    SeedIngredient {
        legacy_id: 10,
        name: "сливки 10%",
        protein: 2.8,
        fat: 10.0,
        carbohydrates: 4.3,
    },
    SeedIngredient {
        legacy_id: 11,
        name: "молоко 2,5% пискаревское",
        protein: 3.0,
        fat: 2.5,
        carbohydrates: 4.7,
    },
    SeedIngredient {
        legacy_id: 12,
        name: "молоко 0,5% пармалат",
        protein: 3.0,
        fat: 0.5,
        carbohydrates: 4.7,
    },
    SeedIngredient {
        legacy_id: 13,
        name: "сметана 10 простоквашино",
        protein: 2.8,
        fat: 10.0,
        carbohydrates: 3.9,
    },
    SeedIngredient {
        legacy_id: 14,
        name: "сметана 15 пискаревская",
        protein: 2.6,
        fat: 15.0,
        carbohydrates: 3.6,
    },
    SeedIngredient {
        legacy_id: 15,
        name: "йогурт теос 2%",
        protein: 8.0,
        fat: 2.0,
        carbohydrates: 4.2,
    },
    SeedIngredient {
        legacy_id: 16,
        name: "кефир 1% пискаревский",
        protein: 3.0,
        fat: 1.0,
        carbohydrates: 4.0,
    },
    SeedIngredient {
        legacy_id: 17,
        name: "творог 5% пискаревский",
        protein: 16.0,
        fat: 5.0,
        carbohydrates: 3.0,
    },
    SeedIngredient {
        legacy_id: 18,
        name: "творог 0,5% экомилк",
        protein: 18.0,
        fat: 0.5,
        carbohydrates: 1.2,
    },
    SeedIngredient {
        legacy_id: 19,
        name: "масло сливочное 82,5",
        protein: 0.6,
        fat: 82.5,
        carbohydrates: 0.8,
    },
    SeedIngredient {
        legacy_id: 20,
        name: "масло кунжутное",
        protein: 0.0,
        fat: 99.8,
        carbohydrates: 0.0,
    },
    SeedIngredient {
        legacy_id: 21,
        name: "масло оливковое",
        protein: 0.0,
        fat: 100.0,
        carbohydrates: 0.0,
    },
    SeedIngredient {
        legacy_id: 22,
        name: "масло подсолнечное",
        protein: 0.0,
        fat: 99.9,
        carbohydrates: 0.0,
    },
    SeedIngredient {
        legacy_id: 23,
        name: "вода",
        protein: 0.0,
        fat: 0.0,
        carbohydrates: 0.0,
    },
    SeedIngredient {
        legacy_id: 24,
        name: "яйцо с1",
        protein: 12.7,
        fat: 11.5,
        carbohydrates: 0.7,
    },
    SeedIngredient {
        legacy_id: 25,
        name: "кинза",
        protein: 2.1,
        fat: 0.5,
        carbohydrates: 0.9,
    },
    SeedIngredient {
        legacy_id: 26,
        name: "соленый огурец",
        protein: 0.0,
        fat: 0.0,
        carbohydrates: 2.0,
    },
    SeedIngredient {
        legacy_id: 27,
        name: "свекла",
        protein: 1.6,
        fat: 0.2,
        carbohydrates: 10.0,
    },
    SeedIngredient {
        legacy_id: 28,
        name: "морковь",
        protein: 1.3,
        fat: 0.1,
        carbohydrates: 7.2,
    },
    SeedIngredient {
        legacy_id: 29,
        name: "картофель",
        protein: 2.0,
        fat: 0.4,
        carbohydrates: 16.3,
    },
    SeedIngredient {
        legacy_id: 30,
        name: "перец болгарский",
        protein: 1.3,
        fat: 0.1,
        carbohydrates: 5.3,
    },
    SeedIngredient {
        legacy_id: 31,
        name: "лук",
        protein: 1.1,
        fat: 0.1,
        carbohydrates: 5.7,
    },
    SeedIngredient {
        legacy_id: 32,
        name: "редис",
        protein: 1.2,
        fat: 0.1,
        carbohydrates: 3.4,
    },
    SeedIngredient {
        legacy_id: 33,
        name: "капуста белокочанная",
        protein: 1.8,
        fat: 0.1,
        carbohydrates: 4.7,
    },
    SeedIngredient {
        legacy_id: 34,
        name: "капуста цветная",
        protein: 2.5,
        fat: 0.3,
        carbohydrates: 4.2,
    },
    SeedIngredient {
        legacy_id: 35,
        name: "капуста пакчой",
        protein: 1.2,
        fat: 0.2,
        carbohydrates: 2.0,
    },
    SeedIngredient {
        legacy_id: 36,
        name: "огурцы",
        protein: 0.8,
        fat: 0.1,
        carbohydrates: 2.8,
    },
    SeedIngredient {
        legacy_id: 37,
        name: "помидоры",
        protein: 1.1,
        fat: 0.2,
        carbohydrates: 3.7,
    },
    SeedIngredient {
        legacy_id: 38,
        name: "укроп",
        protein: 3.5,
        fat: 1.1,
        carbohydrates: 4.9,
    },
    SeedIngredient {
        legacy_id: 39,
        name: "айсберг",
        protein: 0.9,
        fat: 0.14,
        carbohydrates: 1.7,
    },
    SeedIngredient {
        legacy_id: 40,
        name: "баклажан",
        protein: 1.2,
        fat: 0.1,
        carbohydrates: 4.5,
    },
    SeedIngredient {
        legacy_id: 41,
        name: "брокколи",
        protein: 2.57,
        fat: 0.34,
        carbohydrates: 3.87,
    },
    SeedIngredient {
        legacy_id: 42,
        name: "кабачок",
        protein: 0.6,
        fat: 0.3,
        carbohydrates: 4.6,
    },
    SeedIngredient {
        legacy_id: 43,
        name: "лук зеленый",
        protein: 1.3,
        fat: 0.1,
        carbohydrates: 3.2,
    },
    SeedIngredient {
        legacy_id: 44,
        name: "сельдерей",
        protein: 0.69,
        fat: 0.17,
        carbohydrates: 1.37,
    },
    SeedIngredient {
        legacy_id: 45,
        name: "зеленый горошек",
        protein: 3.0,
        fat: 0.0,
        carbohydrates: 6.0,
    },
    SeedIngredient {
        legacy_id: 46,
        name: "петрушка",
        protein: 3.7,
        fat: 0.4,
        carbohydrates: 7.6,
    },
    SeedIngredient {
        legacy_id: 47,
        name: "соевый соус",
        protein: 2.5,
        fat: 0.0,
        carbohydrates: 13.0,
    },
    SeedIngredient {
        legacy_id: 48,
        name: "рыбный соус",
        protein: 12.0,
        fat: 0.0,
        carbohydrates: 6.0,
    },
    SeedIngredient {
        legacy_id: 49,
        name: "устричный соус",
        protein: 5.1,
        fat: 0.0,
        carbohydrates: 28.0,
    },
    SeedIngredient {
        legacy_id: 50,
        name: "горчица",
        protein: 7.5,
        fat: 9.5,
        carbohydrates: 20.0,
    },
    SeedIngredient {
        legacy_id: 51,
        name: "майонез рикко провансаль",
        protein: 0.5,
        fat: 67.0,
        carbohydrates: 2.1,
    },
    SeedIngredient {
        legacy_id: 52,
        name: "томатная паста",
        protein: 5.5,
        fat: 0.0,
        carbohydrates: 14.0,
    },
    SeedIngredient {
        legacy_id: 53,
        name: "чеснок",
        protein: 6.4,
        fat: 0.5,
        carbohydrates: 31.0,
    },
    SeedIngredient {
        legacy_id: 54,
        name: "квас очаково",
        protein: 0.0,
        fat: 0.0,
        carbohydrates: 6.5,
    },
    SeedIngredient {
        legacy_id: 57,
        name: "минтай замороженный лента",
        protein: 16.0,
        fat: 1.0,
        carbohydrates: 0.0,
    },
    SeedIngredient {
        legacy_id: 58,
        name: "капуста квашеная",
        protein: 1.6,
        fat: 0.07,
        carbohydrates: 4.62,
    },
    SeedIngredient {
        legacy_id: 60,
        name: "овсянка 2",
        protein: 13.0,
        fat: 6.5,
        carbohydrates: 55.0,
    },
    SeedIngredient {
        legacy_id: 64,
        name: "банан",
        protein: 1.1,
        fat: 0.3,
        carbohydrates: 20.2,
    },
    SeedIngredient {
        legacy_id: 65,
        name: "яблоко айдаред",
        protein: 0.4,
        fat: 0.4,
        carbohydrates: 9.8,
    },
    SeedIngredient {
        legacy_id: 68,
        name: "Лапша пшеничная Midori удон",
        protein: 12.3,
        fat: 1.4,
        carbohydrates: 59.2,
    },
    SeedIngredient {
        legacy_id: 69,
        name: "Апельсин",
        protein: 0.9,
        fat: 0.2,
        carbohydrates: 8.4,
    },
    SeedIngredient {
        legacy_id: 70,
        name: "Имбирь",
        protein: 1.8,
        fat: 0.8,
        carbohydrates: 17.8,
    },
    SeedIngredient {
        legacy_id: 71,
        name: "Крахмал картофельный",
        protein: 0.0,
        fat: 0.0,
        carbohydrates: 79.0,
    },
    SeedIngredient {
        legacy_id: 72,
        name: "Мармелад",
        protein: 0.0,
        fat: 0.0,
        carbohydrates: 84.0,
    },
    SeedIngredient {
        legacy_id: 73,
        name: "Тунец FORTUNA кусочки в собственном соку",
        protein: 24.1,
        fat: 0.75,
        carbohydrates: 0.29,
    },
    SeedIngredient {
        legacy_id: 74,
        name: "Молоко стерилизованное ДОМИК В ДЕРЕВНЕ 1,5%",
        protein: 3.0,
        fat: 1.5,
        carbohydrates: 4.7,
    },
    SeedIngredient {
        legacy_id: 75,
        name: "Optimium nutrition Gold Whey",
        protein: 75.0,
        fat: 4.5,
        carbohydrates: 12.0,
    },
];

const CHASHUSHULI_INGREDIENTS: &[SeedDishIngredient] = &[
    SeedDishIngredient {
        legacy_ingredient_id: 1,
        amount: 140.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 22,
        amount: 2.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 25,
        amount: 5.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 30,
        amount: 50.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 31,
        amount: 50.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 37,
        amount: 100.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 46,
        amount: 5.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 52,
        amount: 5.0,
    },
];

const OKROSHKA_INGREDIENTS: &[SeedDishIngredient] = &[
    SeedDishIngredient {
        legacy_ingredient_id: 15,
        amount: 30.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 24,
        amount: 60.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 29,
        amount: 50.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 32,
        amount: 50.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 36,
        amount: 50.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 50,
        amount: 5.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 54,
        amount: 200.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 2,
        amount: 100.0,
    },
];

const COFFEE_WITH_MILK_INGREDIENTS: &[SeedDishIngredient] = &[
    SeedDishIngredient {
        legacy_ingredient_id: 23,
        amount: 150.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 74,
        amount: 150.0,
    },
];

const OATMEAL_INGREDIENTS: &[SeedDishIngredient] = &[
    SeedDishIngredient {
        legacy_ingredient_id: 23,
        amount: 150.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 60,
        amount: 50.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 74,
        amount: 150.0,
    },
];

const POLLOCK_INGREDIENTS: &[SeedDishIngredient] = &[SeedDishIngredient {
    legacy_ingredient_id: 57,
    amount: 400.0,
}];

const OLIVIER_INGREDIENTS: &[SeedDishIngredient] = &[
    SeedDishIngredient {
        legacy_ingredient_id: 2,
        amount: 100.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 15,
        amount: 50.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 24,
        amount: 48.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 26,
        amount: 40.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 28,
        amount: 40.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 29,
        amount: 80.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 45,
        amount: 80.0,
    },
];

const CHICKEN_FILLET_INGREDIENTS: &[SeedDishIngredient] = &[SeedDishIngredient {
    legacy_ingredient_id: 2,
    amount: 250.0,
}];

const FRENCH_FRIES_INGREDIENTS: &[SeedDishIngredient] = &[SeedDishIngredient {
    legacy_ingredient_id: 29,
    amount: 200.0,
}];

const SHCHI_INGREDIENTS: &[SeedDishIngredient] = &[
    SeedDishIngredient {
        legacy_ingredient_id: 1,
        amount: 70.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 15,
        amount: 30.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 22,
        amount: 2.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 23,
        amount: 300.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 28,
        amount: 15.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 29,
        amount: 20.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 30,
        amount: 15.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 31,
        amount: 15.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 52,
        amount: 7.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 53,
        amount: 0.25,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 58,
        amount: 30.0,
    },
];

const VINAIGRETTE_INGREDIENTS: &[SeedDishIngredient] = &[
    SeedDishIngredient {
        legacy_ingredient_id: 22,
        amount: 5.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 26,
        amount: 40.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 27,
        amount: 80.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 28,
        amount: 80.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 29,
        amount: 80.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 31,
        amount: 40.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 45,
        amount: 80.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 58,
        amount: 80.0,
    },
];

const SHIN_RAMEN_INGREDIENTS: &[SeedDishIngredient] = &[
    SeedDishIngredient {
        legacy_ingredient_id: 23,
        amount: 300.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 6,
        amount: 60.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 51,
        amount: 15.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 53,
        amount: 20.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 43,
        amount: 50.0,
    },
];

const BUCKWHEAT_WITH_MILK_INGREDIENTS: &[SeedDishIngredient] = &[
    SeedDishIngredient {
        legacy_ingredient_id: 4,
        amount: 100.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 23,
        amount: 200.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 74,
        amount: 200.0,
    },
];

const BANANA_INGREDIENTS: &[SeedDishIngredient] = &[SeedDishIngredient {
    legacy_ingredient_id: 64,
    amount: 140.0,
}];

const BARILLA_PASTA_INGREDIENTS: &[SeedDishIngredient] = &[
    SeedDishIngredient {
        legacy_ingredient_id: 19,
        amount: 3.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 8,
        amount: 100.0,
    },
];

const NOODLES_WITH_CHICKEN_INGREDIENTS: &[SeedDishIngredient] = &[
    SeedDishIngredient {
        legacy_ingredient_id: 22,
        amount: 10.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 28,
        amount: 50.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 30,
        amount: 50.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 47,
        amount: 25.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 68,
        amount: 100.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 69,
        amount: 70.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 70,
        amount: 10.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 71,
        amount: 3.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 2,
        amount: 75.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 43,
        amount: 25.0,
    },
];

const MARMALADE_INGREDIENTS: &[SeedDishIngredient] = &[SeedDishIngredient {
    legacy_ingredient_id: 72,
    amount: 12.5,
}];

const APPLE_INGREDIENTS: &[SeedDishIngredient] = &[SeedDishIngredient {
    legacy_ingredient_id: 65,
    amount: 140.0,
}];

const BOILED_EGG_INGREDIENTS: &[SeedDishIngredient] = &[SeedDishIngredient {
    legacy_ingredient_id: 24,
    amount: 60.0,
}];

const TUNA_MIMOSA_INGREDIENTS: &[SeedDishIngredient] = &[
    SeedDishIngredient {
        legacy_ingredient_id: 15,
        amount: 40.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 24,
        amount: 30.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 28,
        amount: 75.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 29,
        amount: 75.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 31,
        amount: 25.0,
    },
    SeedDishIngredient {
        legacy_ingredient_id: 73,
        amount: 90.0,
    },
];

const PROTEIN_SHAKE_INGREDIENTS: &[SeedDishIngredient] = &[SeedDishIngredient {
    legacy_ingredient_id: 75,
    amount: 31.0,
}];

pub const SEED_DISHES: &[SeedDish] = &[
    SeedDish {
        name: "Чашушули",
        weight: Some(0.0),
        ingredients: CHASHUSHULI_INGREDIENTS,
    },
    SeedDish {
        name: "Окрошка",
        weight: Some(0.0),
        ingredients: OKROSHKA_INGREDIENTS,
    },
    SeedDish {
        name: "Кофе с молоком",
        weight: Some(0.0),
        ingredients: COFFEE_WITH_MILK_INGREDIENTS,
    },
    SeedDish {
        name: "Овсяная каша",
        weight: Some(0.0),
        ingredients: OATMEAL_INGREDIENTS,
    },
    SeedDish {
        name: "Минтай",
        weight: Some(0.0),
        ingredients: POLLOCK_INGREDIENTS,
    },
    SeedDish {
        name: "Оливье",
        weight: Some(0.0),
        ingredients: OLIVIER_INGREDIENTS,
    },
    SeedDish {
        name: "Куриное филе",
        weight: Some(0.0),
        ingredients: CHICKEN_FILLET_INGREDIENTS,
    },
    SeedDish {
        name: "Картофель фри",
        weight: Some(0.0),
        ingredients: FRENCH_FRIES_INGREDIENTS,
    },
    SeedDish {
        name: "Щи",
        weight: Some(0.0),
        ingredients: SHCHI_INGREDIENTS,
    },
    SeedDish {
        name: "Винегрет",
        weight: Some(0.0),
        ingredients: VINAIGRETTE_INGREDIENTS,
    },
    SeedDish {
        name: "Шин Рамен",
        weight: Some(0.0),
        ingredients: SHIN_RAMEN_INGREDIENTS,
    },
    SeedDish {
        name: "Греча с молоком",
        weight: Some(0.0),
        ingredients: BUCKWHEAT_WITH_MILK_INGREDIENTS,
    },
    SeedDish {
        name: "Банан",
        weight: Some(0.0),
        ingredients: BANANA_INGREDIENTS,
    },
    SeedDish {
        name: "Паста Барилла 100",
        weight: Some(0.0),
        ingredients: BARILLA_PASTA_INGREDIENTS,
    },
    SeedDish {
        name: "Лапша с курицей",
        weight: Some(0.0),
        ingredients: NOODLES_WITH_CHICKEN_INGREDIENTS,
    },
    SeedDish {
        name: "Мармеладка",
        weight: Some(0.0),
        ingredients: MARMALADE_INGREDIENTS,
    },
    SeedDish {
        name: "Яблоко",
        weight: Some(0.0),
        ingredients: APPLE_INGREDIENTS,
    },
    SeedDish {
        name: "Вареное яйцо",
        weight: Some(0.0),
        ingredients: BOILED_EGG_INGREDIENTS,
    },
    SeedDish {
        name: "Мимоза тунцовая",
        weight: Some(0.0),
        ingredients: TUNA_MIMOSA_INGREDIENTS,
    },
    SeedDish {
        name: "Протеин",
        weight: Some(0.0),
        ingredients: PROTEIN_SHAKE_INGREDIENTS,
    },
];
