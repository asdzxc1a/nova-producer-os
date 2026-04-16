use runtime::producer::{ProducerRun, ProducerStage};
use serde::Deserialize;

use std::path::PathBuf;

use crate::state::AppState;
use super::dashboard::{load_workspace, save_workspace};

#[derive(Debug, Clone, Deserialize)]
pub struct RunStagePayload {
    stage: String,
    file: Option<String>,
}

pub fn runs_dir(state: &AppState, ws_name: &str) -> PathBuf {
    let root = state.workspace_root.lock().unwrap();
    root.join(".nova").join("workspaces").join(ws_name).join("runs")
}

pub fn load_recent_runs(state: &AppState, ws_name: &str) -> Result<Vec<ProducerRun>, String> {
    let runs_dir = runs_dir(state, ws_name);
    let mut runs = Vec::new();

    if runs_dir.is_dir() {
        for entry in std::fs::read_dir(&runs_dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let run_path = entry.path().join("run.json");
            if run_path.is_file() {
                if let Ok(content) = std::fs::read_to_string(&run_path) {
                    if let Ok(run) = serde_json::from_str::<ProducerRun>(&content) {
                        runs.push(run);
                    }
                }
            }
        }
    }

    // Sort by started_at descending
    runs.sort_by(|a, b| b.started_at.cmp(&a.started_at));
    Ok(runs)
}



#[tauri::command]
pub fn get_run_status(run_id: String, state: tauri::State<'_, AppState>) -> Result<ProducerRun, String> {
    let ws_name = state.workspace_name.lock().unwrap().clone();
    let run_path = runs_dir(&state, &ws_name).join(&run_id).join("run.json");
    if !run_path.exists() {
        return Err(format!("Run {} not found", run_id));
    }
    let content = std::fs::read_to_string(&run_path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn run_stage(
    payload: RunStagePayload,
    state: tauri::State<'_, AppState>,
) -> Result<tools::producer_plugin::StageRunResult, String> {
    let ws_name = state.workspace_name.lock().unwrap().clone();

    // Ensure workspace exists on disk before running
    let ws = load_workspace(&state, &ws_name)?;
    save_workspace(&state, &ws)?;

    let stage: ProducerStage = match payload.stage.as_str() {
        "slate" => ProducerStage::Slate,
        "package" => ProducerStage::Package,
        "finance" => ProducerStage::Finance,
        "comply" => ProducerStage::Comply,
        "launch" => ProducerStage::Launch,
        _ => return Err(format!("unknown stage: {}", payload.stage)),
    };

    let run_type_str = match stage {
        ProducerStage::Slate => "slate_analyze",
        ProducerStage::Package => "package_build",
        ProducerStage::Finance => "finance_model",
        ProducerStage::Comply => "comply_scan",
        ProducerStage::Launch => "launch_strategy",
    };

    let input = serde_json::json!({
        "workspace_name": ws_name,
        "run_type": run_type_str,
        "file": payload.file,
        "cwd": state.workspace_root.lock().unwrap().to_string_lossy().to_string(),
    });

    // Dispatch to the real producer plugin
    let result_json = match stage {
        ProducerStage::Slate => tools::producer_plugin::run_slate_analyze(&input),
        ProducerStage::Package => tools::producer_plugin::run_package_build(&input),
        ProducerStage::Finance => tools::producer_plugin::run_finance_model(&input),
        ProducerStage::Comply => tools::producer_plugin::run_comply_scan(&input),
        ProducerStage::Launch => tools::producer_plugin::run_launch_strategy(&input),
    }?;

    let result: tools::producer_plugin::StageRunResult =
        serde_json::from_str(&result_json).map_err(|e| e.to_string())?;

    Ok(result)
}
