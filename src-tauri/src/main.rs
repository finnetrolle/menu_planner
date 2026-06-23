mod commands;
mod database;
mod error;
mod models;
mod repositories;
mod services;
mod tests;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let db_path =
                database::resolve_app_db_path(app.handle()).map_err(std::io::Error::other)?;

            database::configure_database_path(db_path).map_err(std::io::Error::other)?;

            database::get_connection().map_err(std::io::Error::other)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_ingredients,
            commands::get_ingredient,
            commands::create_ingredient,
            commands::update_ingredient,
            commands::delete_ingredient,
            commands::get_dishes,
            commands::get_dish,
            commands::create_dish,
            commands::update_dish,
            commands::delete_dish,
            commands::get_goals,
            commands::save_goals,
            commands::calculate_menu_plan,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
