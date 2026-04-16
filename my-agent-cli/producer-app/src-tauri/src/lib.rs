use crate::state::AppState;

mod commands;
mod state;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Resolve workspace root: if we're inside the producer-app directory,
    // use the parent (project root) so we can find .nova/workspaces
    let cwd = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
    let workspace_root = if cwd.file_name().map(|n| n == "producer-app").unwrap_or(false) {
        cwd.parent().unwrap_or(&cwd).to_path_buf()
    } else {
        cwd
    };

    let app_state = AppState::new("cannes-demo", workspace_root);

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::dashboard::get_dashboard,
            commands::dashboard::list_workspaces,
            commands::dashboard::open_workspace,
            commands::dashboard::create_workspace,
            commands::dashboard::set_project_root,
            commands::runs::run_stage,
            commands::runs::get_run_status,
            commands::artifacts::list_artifacts,
            commands::artifacts::read_artifact,
            commands::approvals::list_approvals,
            commands::approvals::resolve_approval,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
