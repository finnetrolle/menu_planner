# Export Format

Канонический экспортный файл: `menu_planner_export.v1.json`

Формат:

```json
{
  "schema_version": 1,
  "exported_at": "2026-06-16T10:35:00Z",
  "source": {
    "app_identifier": "com.menuplanner.app",
    "db_path": "/Applications/Menu Planner.app/Contents/MacOS/menu_planner.db"
  },
  "ingredients": [
    {
      "id": 1,
      "name": "говядина лопатка лента",
      "protein": 19.4,
      "fat": 6.6,
      "carbohydrates": 0.0
    }
  ],
  "dishes": [
    {
      "id": 4,
      "name": "Чашушули",
      "weight": 0.0,
      "ingredients": [
        {
          "ingredient_id": 1,
          "amount": 140.0
        }
      ]
    }
  ]
}
```

Почему выбран именно этот формат:

- Один файл удобно переносить и импортировать обратно.
- Поля совпадают с текущими Rust/TypeScript моделями приложения.
- Связи блюд с ингредиентами сохраняются через `ingredient_id`.
- Есть `schema_version`, чтобы безболезненно расширять формат позже.

Дополнительно сохранены:

- `ingredients.json` — только ингредиенты в виде `{ "ingredients": [...] }`
- `dishes.json` — только блюда в виде `{ "dishes": [...] }`
