use runtime::producer::{suggest_next_action, ProducerRun, ProducerWorkspace};
use serde::Serialize;

use std::path::PathBuf;

use crate::state::AppState;
use super::runs::load_recent_runs;
use super::approvals::load_pending_approvals;

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

#[tauri::command]
pub fn get_dashboard(state: tauri::State<'_, AppState>) -> Result<DashboardData, String> {
    let name = state.workspace_name.lock().unwrap().clone();
    let ws = load_workspace(&state, &name)?;
    let recent_runs = load_recent_runs(&state, &name)?;
    let pending_approvals = load_pending_approvals(&state, &name)?;
    let next_action = suggest_next_action(&ws);

    Ok(DashboardData {
        workspace: ws,
        next_action,
        recent_runs,
        pending_approvals,
    })
}

#[tauri::command]
pub fn list_workspaces(state: tauri::State<'_, AppState>) -> Result<Vec<WorkspaceSummary>, String> {
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
    Ok(summaries)
}

#[tauri::command]
pub fn open_workspace(name: String, state: tauri::State<'_, AppState>) -> Result<ProducerWorkspace, String> {
    let ws = load_workspace(&state, &name)?;
    *state.workspace_name.lock().unwrap() = name;
    Ok(ws)
}

#[tauri::command]
pub fn create_workspace(name: String, state: tauri::State<'_, AppState>) -> Result<ProducerWorkspace, String> {
    let root = state.workspace_root.lock().unwrap();
    let ws = ProducerWorkspace::new(&name, root.clone());
    save_workspace(&state, &ws)?;
    *state.workspace_name.lock().unwrap() = name;
    Ok(ws)
}

#[tauri::command]
pub fn set_project_root(path: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let new_root = PathBuf::from(path);
    if !new_root.is_dir() {
        return Err(format!("Path does not exist or is not a directory: {}", new_root.display()));
    }
    *state.workspace_root.lock().unwrap() = new_root;
    Ok(())
}
