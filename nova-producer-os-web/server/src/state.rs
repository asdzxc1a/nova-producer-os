use std::path::PathBuf;
use std::sync::Mutex;

pub struct AppState {
    pub workspace_name: Mutex<String>,
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
