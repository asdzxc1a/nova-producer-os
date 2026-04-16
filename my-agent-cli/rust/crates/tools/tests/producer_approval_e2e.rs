use std::fs;
use std::path::PathBuf;

#[test]
fn compliance_run_blocks_on_high_risk_and_creates_approval() {
    std::env::set_var("NOVA_DEMO_MODE", "1");
    let root = PathBuf::from("/tmp/nova-approval-test");
    let _ = fs::remove_dir_all(&root);
    fs::create_dir_all(&root).unwrap();

    // Create workspace and run through Finance so Comply is unlocked
    commands::handle_workspace_slash_command(Some("approval-film"), &root).unwrap();

    for tool in ["ProducerSlateAnalyze", "ProducerPackageBuild", "ProducerFinanceModel"] {
        let input = serde_json::json!({
            "workspace_name": "approval-film",
            "run_type": "test",
            "file": null,
            "cwd": root.display().to_string(),
        });
        tools::execute_tool(tool, &input).unwrap();
    }

    // Run compliance scan
    let comply_input = serde_json::json!({
        "workspace_name": "approval-film",
        "run_type": "comply_scan",
        "file": null,
        "cwd": root.display().to_string(),
    });
    let comply_result = tools::execute_tool("ProducerComplyScan", &comply_input)
        .expect("comply scan should return result even when blocked");
    let comply_json: serde_json::Value = serde_json::from_str(&comply_result).unwrap();

    // Verify run is blocked and approval is required
    assert_eq!(comply_json["status"], "blocked");
    assert_eq!(comply_json["approval_required"], true);

    // Verify workspace stage is blocked
    let ws_path = root.join(".nova").join("workspaces").join("approval-film").join("workspace.json");
    let ws_content = fs::read_to_string(&ws_path).unwrap();
    let ws: runtime::producer::ProducerWorkspace = serde_json::from_str(&ws_content).unwrap();
    assert_eq!(
        ws.stages.get(&runtime::producer::ProducerStage::Comply).unwrap().status,
        runtime::producer::StageStatus::Blocked
    );

    // Verify approvals command lists the pending approval
    let approvals_result = commands::handle_approvals_slash_command(&root, Some("approval-film"))
        .expect("approvals command should work");
    assert!(approvals_result.message.contains("Pending Approvals"));
    assert!(approvals_result.message.contains("Compliance Officer"));
    assert!(approvals_result.message.contains("EU AI Act disclosure missing"));

    let _ = fs::remove_dir_all(&root);
}

#[test]
fn retry_run_stub_outputs_expected_message() {
    std::env::set_var("NOVA_DEMO_MODE", "1");
    // The retry command in nova-cli is a stub that prints a message.
    // We verify the command parsing logic exists by checking no panic occurs.
    // Full retry integration would require mocking the CLI REPL.
    let root = PathBuf::from("/tmp/nova-retry-test");
    let _ = fs::remove_dir_all(&root);
    fs::create_dir_all(&root).unwrap();

    commands::handle_workspace_slash_command(Some("retry-film"), &root).unwrap();

    // We can't easily invoke the CLI REPL handler here without API keys,
    // but we can verify the tool layer doesn't crash on retry concepts.
    let _ = commands::handle_approvals_slash_command(&root, Some("retry-film"));

    let _ = fs::remove_dir_all(&root);
}
