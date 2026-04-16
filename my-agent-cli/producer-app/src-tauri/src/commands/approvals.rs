use runtime::producer::{ApprovalRequest, ApprovalStatus};
use serde::Deserialize;
use std::path::PathBuf;

use crate::state::AppState;

fn approvals_dir(state: &AppState, ws_name: &str) -> PathBuf {
    let root = state.workspace_root.lock().unwrap();
    root.join(".nova").join("workspaces").join(ws_name).join("approvals")
}

pub fn load_pending_approvals(
    state: &AppState,
    ws_name: &str,
) -> Result<Vec<ApprovalRequest>, String> {
    let dir = approvals_dir(state, ws_name);
    let mut approvals = Vec::new();

    if dir.is_dir() {
        for entry in std::fs::read_dir(&dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.is_file() {
                if let Ok(content) = std::fs::read_to_string(&path) {
                    if let Ok(approval) = serde_json::from_str::<ApprovalRequest>(&content) {
                        if approval.status == ApprovalStatus::Requested {
                            approvals.push(approval);
                        }
                    }
                }
            }
        }
    }

    approvals.sort_by(|a, b| a.created_at.cmp(&b.created_at));
    Ok(approvals)
}

#[derive(Debug, Clone, Deserialize)]
pub struct ResolveApprovalPayload {
    id: String,
    approve: bool,
}

#[tauri::command]
pub fn list_approvals(state: tauri::State<'_, AppState>) -> Result<Vec<ApprovalRequest>, String> {
    let ws_name = state.workspace_name.lock().unwrap().clone();
    load_pending_approvals(&state, &ws_name)
}

#[tauri::command]
pub fn resolve_approval(
    payload: ResolveApprovalPayload,
    state: tauri::State<'_, AppState>,
) -> Result<ApprovalRequest, String> {
    let ws_name = state.workspace_name.lock().unwrap().clone();
    let dir = approvals_dir(&state, &ws_name);
    let path = dir.join(format!("{}.json", payload.id));

    if !path.exists() {
        return Err(format!("Approval {} not found", payload.id));
    }

    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let mut approval: ApprovalRequest =
        serde_json::from_str(&content).map_err(|e| e.to_string())?;

    if payload.approve {
        approval.approve();
    } else {
        approval.reject();
    }

    std::fs::write(&path, serde_json::to_string_pretty(&approval).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    Ok(approval)
}
