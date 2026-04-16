use serde::Serialize;
use std::path::PathBuf;

use crate::state::AppState;

#[derive(Debug, Clone, Serialize)]
pub struct ArtifactSummary {
    name: String,
    path: String,
    size_bytes: u64,
}

fn artifacts_dir(state: &AppState, ws_name: &str) -> PathBuf {
    let root = state.workspace_root.lock().unwrap();
    root.join(".nova").join("workspaces").join(ws_name).join("artifacts")
}

#[tauri::command]
pub fn list_artifacts(state: tauri::State<'_, AppState>) -> Result<Vec<ArtifactSummary>, String> {
    let ws_name = state.workspace_name.lock().unwrap().clone();
    let dir = artifacts_dir(&state, &ws_name);
    let mut artifacts = Vec::new();

    if dir.is_dir() {
        for entry in std::fs::read_dir(&dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.is_file() {
                let meta = entry.metadata().map_err(|e| e.to_string())?;
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    artifacts.push(ArtifactSummary {
                        name: name.to_string(),
                        path: path.to_string_lossy().to_string(),
                        size_bytes: meta.len(),
                    });
                }
            }
        }
    }

    artifacts.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(artifacts)
}

#[tauri::command]
pub fn read_artifact(name: String, state: tauri::State<'_, AppState>) -> Result<String, String> {
    let ws_name = state.workspace_name.lock().unwrap().clone();
    let path = artifacts_dir(&state, &ws_name).join(&name);
    if !path.exists() {
        return Err(format!("Artifact {} not found", name));
    }
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}
