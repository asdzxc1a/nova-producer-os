use axum::extract::State;
use axum::Json;
use runtime::producer::{suggest_next_action, ProducerRun, ProducerWorkspace};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;

use crate::state::AppState;
use super::approvals::load_pending_approvals;
use super::runs::load_recent_runs;

#[derive(Debug, Clone, Serialize)]
pub struct DashboardData {
    workspace: ProducerWorkspace,
    next_action: runtime::producer::NextAction,
    recent_runs: Vec<ProducerRun>,
    pending_approvals: Vec<runtime::producer::ApprovalRequest>,
}

#[derive(Debug, Clone, Serialize)]
pub struct WorkspaceSummary {
    name: String,
    path: String,
}

fn workspace_path(state: &AppState, name: &str) -> PathBuf {
    let root = state.workspace_root.lock().unwrap();
    root.join(".nova").join("workspaces").join(name)
}

pub fn load_workspace(state: &AppState, name: &str) -> Result<ProducerWorkspace, String> {
    let ws_path = workspace_path(state, name).join("workspace.json");
    if ws_path.exists() {
        let content = std::fs::read_to_string(&ws_path).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).map_err(|e| e.to_string())
    } else {
        let root = state.workspace_root.lock().unwrap();
        Ok(ProducerWorkspace::new(name, root.clone()))
    }
}

pub fn save_workspace(state: &AppState, ws: &ProducerWorkspace) -> Result<(), String> {
    let ws_path = workspace_path(state, &ws.name).join("workspace.json");
    std::fs::create_dir_all(ws_path.parent().unwrap()).map_err(|e| e.to_string())?;
    let json = serde_json::to_string_pretty(ws).map_err(|e| e.to_string())?;
    std::fs::write(&ws_path, json).map_err(|e| e.to_string())
}

pub async fn get_dashboard(State(state): State<Arc<AppState>>) -> Result<Json<DashboardData>, String> {
    let name = state.workspace_name.lock().unwrap().clone();
    let ws = load_workspace(&state, &name)?;
    let recent_runs = load_recent_runs(&state, &name)?;
    let pending_approvals = load_pending_approvals(&state, &name)?;
    let next_action = suggest_next_action(&ws);

    Ok(Json(DashboardData {
        workspace: ws,
        next_action,
        recent_runs,
        pending_approvals,
    }))
}

pub async fn list_workspaces(State(state): State<Arc<AppState>>) -> Result<Json<Vec<WorkspaceSummary>>, String> {
    let root = state.workspace_root.lock().unwrap();
    let workspaces_dir = root.join(".nova").join("workspaces");
    let mut summaries = Vec::new();

    if workspaces_dir.is_dir() {
        for entry in std::fs::read_dir(&workspaces_dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.is_dir() {
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    summaries.push(WorkspaceSummary {
                        name: name.to_string(),
                        path: path.to_string_lossy().to_string(),
                    });
                }
            }
        }
    }

    summaries.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(Json(summaries))
}

#[derive(Debug, Clone, Deserialize)]
pub struct OpenWorkspaceReq {
    name: String,
}

pub async fn open_workspace(
    State(state): State<Arc<AppState>>,
    Json(req): Json<OpenWorkspaceReq>,
) -> Result<Json<ProducerWorkspace>, String> {
    let ws = load_workspace(&state, &req.name)?;
    *state.workspace_name.lock().unwrap() = req.name;
    Ok(Json(ws))
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateWorkspaceReq {
    name: String,
}

pub async fn create_workspace(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateWorkspaceReq>,
) -> Result<Json<ProducerWorkspace>, String> {
    let root = state.workspace_root.lock().unwrap().clone();
    let ws = ProducerWorkspace::new(&req.name, root);
    // save_workspace acquires workspace_root lock; drop our lock first
    drop(state.workspace_root.lock().unwrap());
    save_workspace(&state, &ws)?;
    *state.workspace_name.lock().unwrap() = req.name;
    Ok(Json(ws))
}

#[derive(Debug, Clone, Deserialize)]
pub struct SetProjectRootReq {
    path: String,
}

pub async fn set_project_root(
    State(state): State<Arc<AppState>>,
    Json(req): Json<SetProjectRootReq>,
) -> Result<Json<serde_json::Value>, String> {
    let new_root = PathBuf::from(req.path);
    if !new_root.is_dir() {
        return Err(format!("Path does not exist or is not a directory: {}", new_root.display()));
    }
    *state.workspace_root.lock().unwrap() = new_root;
    Ok(Json(serde_json::json!({ "ok": true })))
}
