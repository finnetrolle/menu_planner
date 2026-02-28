mod models;
mod database;
mod commands;
mod repositories;
mod services;
mod error;
mod tests;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
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
            commands::calculate_menu_nutrition,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
