pub mod dish_repository;
pub mod goals_repository;
pub mod ingredient_repository;

pub use dish_repository::DishRepository;
pub use goals_repository::GoalsRepository;
pub use ingredient_repository::IngredientRepository;

use crate::error::AppResult;
use rusqlite::Connection;

/// Общий трейт репозитория для CRUD операций
pub trait Repository<T> {
    /// Получить запись по ID
    fn get_by_id(&self, conn: &Connection, id: i64) -> AppResult<Option<T>>;

    /// Получить все записи
    fn get_all(&self, conn: &Connection) -> AppResult<Vec<T>>;

    /// Создать новую запись
    fn create(&self, conn: &Connection, item: &T) -> AppResult<i64>;

    /// Обновить существующую запись
    fn update(&self, conn: &Connection, id: i64, item: &T) -> AppResult<()>;

    /// Удалить запись
    fn delete(&self, conn: &Connection, id: i64) -> AppResult<()>;
}
