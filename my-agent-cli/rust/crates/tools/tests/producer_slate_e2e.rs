use std::fs;
use std::path::PathBuf;

#[test]
fn slate_run_creates_artifacts_and_unlocks_package() {
    std::env::set_var("NOVA_DEMO_MODE", "1");
    let root = PathBuf::from("/tmp/nova-producer-test");
    let _ = fs::remove_dir_all(&root);
    fs::create_dir_all(&root).unwrap();

    // Step 1: Create workspace
    let result = commands::handle_workspace_slash_command(Some("test-film"), &root)
        .expect("workspace create should succeed");
    assert!(result.message.contains("Created workspace"));

    let ws_path = root.join(".nova").join("workspaces").join("test-film");
    assert!(ws_path.join("workspace.json").exists());

    // Step 2: Run slate analysis
    let input = serde_json::json!({
        "workspace_name": "test-film",
        "run_type": "slate_analyze",
        "file": "projects.csv",
        "cwd": root.display().to_string(),
    });
    let result = tools::execute_tool("ProducerSlateAnalyze", &input)
        .expect("slate analyze should succeed");

    let result_json: serde_json::Value = serde_json::from_str(&result).unwrap();
    assert_eq!(result_json["status"], "completed");
    assert!(result_json["artifacts"].as_array().unwrap().contains(&serde_json::json!("SLATE_REPORT.md")));

    // Step 3: Verify workspace stage advanced
    let ws_content = fs::read_to_string(ws_path.join("workspace.json")).unwrap();
    let ws: runtime::producer::ProducerWorkspace = serde_json::from_str(&ws_content).unwrap();
    let slate_state = ws.stages.get(&runtime::producer::ProducerStage::Slate).unwrap();
    assert_eq!(slate_state.status, runtime::producer::StageStatus::Done);
    let package_state = ws.stages.get(&runtime::producer::ProducerStage::Package).unwrap();
    assert_eq!(package_state.status, runtime::producer::StageStatus::Ready);

    // Step 4: Verify artifact exists
    assert!(ws_path.join("artifacts").join("SLATE_REPORT.md").exists());

    // Step 5: Check run status
    let status_input = serde_json::json!({
        "workspace_name": "test-film",
        "run_id": result_json["run_id"].as_str().unwrap(),
        "cwd": root.display().to_string(),
    });
    let status_result = tools::execute_tool("ProducerRunStatus", &status_input)
        .expect("run status should succeed");
    let status_json: serde_json::Value = serde_json::from_str(&status_result).unwrap();
    assert_eq!(status_json["status"], "Completed");
    assert!(status_json["steps"].as_array().unwrap().len() >= 2);

    let _ = fs::remove_dir_all(&root);
}
