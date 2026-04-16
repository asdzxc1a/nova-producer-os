use axum::extract::{Path, State};
use axum::Json;
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Arc;

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

pub async fn list_artifacts(State(state): State<Arc<AppState>>) -> Result<Json<Vec<ArtifactSummary>>, String> {
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
    Ok(Json(artifacts))
}

pub async fn read_artifact(
    State(state): State<Arc<AppState>>,
    Path(name): Path<String>,
) -> Result<Json<String>, String> {
    let ws_name = state.workspace_name.lock().unwrap().clone();
    let path = artifacts_dir(&state, &ws_name).join(&name);
    if !path.exists() {
        return Err(format!("Artifact {} not found", name));
    }
    Ok(Json(std::fs::read_to_string(&path).map_err(|e| e.to_string())?))
}
