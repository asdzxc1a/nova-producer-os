use std::fs;
use std::path::PathBuf;

#[test]
fn full_pipeline_runs_all_five_stages_sequentially() {
    std::env::set_var("NOVA_DEMO_MODE", "1");
    let root = PathBuf::from("/tmp/nova-pipeline-test");
    let _ = fs::remove_dir_all(&root);
    fs::create_dir_all(&root).unwrap();

    // Stage 1: Create workspace
    let result = commands::handle_workspace_slash_command(Some("pipeline-film"), &root)
        .expect("workspace create should succeed");
    assert!(result.message.contains("Created workspace"));

    // Stage 2: Slate analysis
    let slate_input = serde_json::json!({
        "workspace_name": "pipeline-film",
        "run_type": "slate_analyze",
        "file": "projects.csv",
        "cwd": root.display().to_string(),
    });
    let slate_result = tools::execute_tool("ProducerSlateAnalyze", &slate_input)
        .expect("slate analyze should succeed");
    let slate_json: serde_json::Value = serde_json::from_str(&slate_result).unwrap();
    assert_eq!(slate_json["status"], "completed");
    assert!(slate_json["artifacts"].as_array().unwrap().contains(&serde_json::json!("SLATE_REPORT.md")));

    // Stage 3: Package build
    let package_input = serde_json::json!({
        "workspace_name": "pipeline-film",
        "run_type": "package_build",
        "file": "script.pdf",
        "cwd": root.display().to_string(),
    });
    let package_result = tools::execute_tool("ProducerPackageBuild", &package_input)
        .expect("package build should succeed");
    let package_json: serde_json::Value = serde_json::from_str(&package_result).unwrap();
    assert_eq!(package_json["status"], "completed");
    assert!(package_json["artifacts"].as_array().unwrap().contains(&serde_json::json!("PITCH_DECK.md")));

    // Stage 4: Finance model
    let finance_input = serde_json::json!({
        "workspace_name": "pipeline-film",
        "run_type": "finance_model",
        "file": "script.pdf",
        "cwd": root.display().to_string(),
    });
    let finance_result = tools::execute_tool("ProducerFinanceModel", &finance_input)
        .expect("finance model should succeed");
    let finance_json: serde_json::Value = serde_json::from_str(&finance_result).unwrap();
    assert_eq!(finance_json["status"], "completed");
    assert!(finance_json["artifacts"].as_array().unwrap().contains(&serde_json::json!("BUDGET_MODEL.json")));

    // Stage 5: Compliance scan (skip approval so pipeline completes)
    let comply_input = serde_json::json!({
        "workspace_name": "pipeline-film",
        "run_type": "comply_scan",
        "file": "skip-approval",
        "cwd": root.display().to_string(),
    });
    let comply_result = tools::execute_tool("ProducerComplyScan", &comply_input)
        .expect("comply scan should succeed");
    let comply_json: serde_json::Value = serde_json::from_str(&comply_result).unwrap();
    assert_eq!(comply_json["status"], "completed");
    assert!(comply_json["artifacts"].as_array().unwrap().contains(&serde_json::json!("COMPLIANCE_REPORT.md")));

    // Stage 6: Launch strategy
    let launch_input = serde_json::json!({
        "workspace_name": "pipeline-film",
        "run_type": "launch_strategy",
        "file": "pipeline-film",
        "cwd": root.display().to_string(),
    });
    let launch_result = tools::execute_tool("ProducerLaunchStrategy", &launch_input)
        .expect("launch strategy should succeed");
    let launch_json: serde_json::Value = serde_json::from_str(&launch_result).unwrap();
    assert_eq!(launch_json["status"], "completed");
    assert!(launch_json["artifacts"].as_array().unwrap().contains(&serde_json::json!("FESTIVAL_STRATEGY.md")));

    // Verify final workspace state
    let ws_path = root.join(".nova").join("workspaces").join("pipeline-film").join("workspace.json");
    let ws_content = fs::read_to_string(ws_path).unwrap();
    let ws: runtime::producer::ProducerWorkspace = serde_json::from_str(&ws_content).unwrap();

    assert_eq!(ws.current_stage, runtime::producer::ProducerStage::Launch);
    assert_eq!(
        ws.stages.get(&runtime::producer::ProducerStage::Slate).unwrap().status,
        runtime::producer::StageStatus::Done
    );
    assert_eq!(
        ws.stages.get(&runtime::producer::ProducerStage::Package).unwrap().status,
        runtime::producer::StageStatus::Done
    );
    assert_eq!(
        ws.stages.get(&runtime::producer::ProducerStage::Finance).unwrap().status,
        runtime::producer::StageStatus::Done
    );
    assert_eq!(
        ws.stages.get(&runtime::producer::ProducerStage::Comply).unwrap().status,
        runtime::producer::StageStatus::Done
    );
    assert_eq!(
        ws.stages.get(&runtime::producer::ProducerStage::Launch).unwrap().status,
        runtime::producer::StageStatus::Done
    );

    // Verify all artifacts exist
    let artifacts_dir = root.join(".nova").join("workspaces").join("pipeline-film").join("artifacts");
    assert!(artifacts_dir.join("SLATE_REPORT.md").exists());
    assert!(artifacts_dir.join("PITCH_DECK.md").exists());
    assert!(artifacts_dir.join("BUDGET_MODEL.json").exists());
    assert!(artifacts_dir.join("COMPLIANCE_REPORT.md").exists());
    assert!(artifacts_dir.join("FESTIVAL_STRATEGY.md").exists());

    let _ = fs::remove_dir_all(&root);
}
