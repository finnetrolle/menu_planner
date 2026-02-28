pub mod ingredient_repository;
pub mod dish_repository;
pub mod goals_repository;

pub use ingredient_repository::IngredientRepository;
pub use dish_repository::DishRepository;
pub use goals_repository::GoalsRepository;

use rusqlite::Connection;

/// Общий трейт репозитория для CRUD операций
pub trait Repository<T> {
    /// Получить запись по ID
    fn get_by_id(&self, conn: &Connection, id: i64) -> Result<Option<T>, String>;

    /// Получить все записи
    fn get_all(&self, conn: &Connection) -> Result<Vec<T>, String>;

    /// Создать новую запись
    fn create(&self, conn: &Connection, item: &T) -> Result<i64, String>;

    /// Обновить существующую запись
    fn update(&self, conn: &Connection, id: i64, item: &T) -> Result<(), String>;

    /// Удалить запись
    fn delete(&self, conn: &Connection, id: i64) -> Result<(), String>;
}
