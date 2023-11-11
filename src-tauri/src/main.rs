// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use globmatch::is_hidden_path;
use lazy_static::lazy_static;
use serde::Serialize;
use std::sync::Arc;
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;
use walkdir::WalkDir;

lazy_static! {
    static ref STOP_FINDING: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
}

#[derive(Serialize, Clone)]
struct Emit {
    is_folder: bool,
    name: String,
    path: String,
    extension: String,
}

#[tauri::command(async)]
async fn stop_finding() {
    *STOP_FINDING.lock().await = true
}

#[tauri::command(async, rename_all = "snake_case")]
async fn find_files_and_folders(
    app_handle: AppHandle,
    current_directory: String,
    search_in_directory: String,
    include_hidden_folders: bool,
) {
    // Recursively reading the dir
    for entry in WalkDir::new(&current_directory)
        .into_iter()
        .filter_map(|entry| entry.ok())
    {
        // When searching is supposed to be stopped, the variable gets set to true, so we need
        // to set its value back to true and quit the function by returning
        if *STOP_FINDING.lock().await {
            *STOP_FINDING.lock().await = false;
            return;
        }

        let entry_path = entry.path();
        let entry_filename = entry.file_name().to_str().unwrap();

        if (include_hidden_folders || !is_hidden_path(entry_path))
            && current_directory != entry_path.to_string_lossy()
            && entry_path
                .file_stem()
                .unwrap()
                .to_str()
                .unwrap()
                .contains(&search_in_directory)
        {
            let _ = app_handle.emit_all(
                "add",
                Emit {
                    is_folder: entry_path.is_dir(),
                    name: entry_filename.to_string(),
                    path: entry_path.to_string_lossy().to_string(),
                    extension: entry
                        .path()
                        .extension()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string(),
                },
            );
        }
    }
}

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            find_files_and_folders,
            stop_finding
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
