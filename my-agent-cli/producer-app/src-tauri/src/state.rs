use std::path::PathBuf;
use std::sync::Mutex;

/// Shared application state.
pub struct AppState {
    /// The currently active workspace name.
    pub workspace_name: Mutex<String>,
    /// The directory from which workspaces are resolved (typically the project root).
    pub workspace_root: Mutex<PathBuf>,
}

impl AppState {
    pub fn new(workspace_name: impl Into<String>, workspace_root: PathBuf) -> Self {
        Self {
            workspace_name: Mutex::new(workspace_name.into()),
            workspace_root: Mutex::new(workspace_root),
        }
    }
}
