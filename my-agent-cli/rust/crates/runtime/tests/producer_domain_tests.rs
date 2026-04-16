use runtime::producer::{
    suggest_next_action, AgentArchetype, ProducerRun, ProducerStage, ProducerWorkspace, RunStatus,
    RunStep, RunType, StageStatus, StepStatus, Urgency,
};
use std::path::PathBuf;

#[test]
fn workspace_serializes_and_deserializes() {
    let root = PathBuf::from("/tmp/test-nova");
    let ws = ProducerWorkspace::new("test-film", root.clone());
    let json = serde_json::to_string(&ws).expect("should serialize");
    let de: ProducerWorkspace = serde_json::from_str(&json).expect("should deserialize");
    assert_eq!(ws.name, de.name);
    assert_eq!(ws.current_stage, de.current_stage);
    assert_eq!(ws.stages.len(), de.stages.len());
}

#[test]
fn stage_progression_slate_unlocks_package() {
    let root = PathBuf::from("/tmp/test-nova");
    let mut ws = ProducerWorkspace::new("test-film", root);

    // Slate starts ready
    assert_eq!(
        ws.stages.get(&ProducerStage::Slate).unwrap().status,
        StageStatus::Ready
    );

    // Package starts locked
    assert_eq!(
        ws.stages.get(&ProducerStage::Package).unwrap().status,
        StageStatus::Locked
    );

    // Complete slate and unlock package
    ws.complete_stage(ProducerStage::Slate);
    assert_eq!(
        ws.stages.get(&ProducerStage::Slate).unwrap().status,
        StageStatus::Done
    );
    assert_eq!(
        ws.stages.get(&ProducerStage::Package).unwrap().status,
        StageStatus::Ready
    );

    // Advance current stage
    ws.advance_stage().expect("should advance to package");
    assert_eq!(ws.current_stage, ProducerStage::Package);
}

#[test]
fn stage_locked_prevents_skip() {
    let root = PathBuf::from("/tmp/test-nova");
    let mut ws = ProducerWorkspace::new("test-film", root);

    // Can't advance to Package because it is locked
    let result = ws.advance_stage();
    assert!(result.is_err()); // Package is locked
    assert_eq!(ws.current_stage, ProducerStage::Slate);

    // Complete slate to unlock package
    ws.complete_stage(ProducerStage::Slate);
    let result = ws.advance_stage();
    assert!(result.is_ok()); // Now Package is ready
    assert_eq!(ws.current_stage, ProducerStage::Package);

    // Can't jump to Finance because it is locked
    let result = ws.advance_stage();
    assert!(result.is_err()); // Finance is still locked
}

#[test]
fn decision_engine_suggests_slate_for_empty_workspace() {
    let root = PathBuf::from("/tmp/test-nova");
    let ws = ProducerWorkspace::new("test-film", root);
    let action = suggest_next_action(&ws);
    assert!(action.command.contains("slate analyze"));
    assert_eq!(action.urgency, Urgency::Normal);
}

#[test]
fn decision_engine_suggests_package_after_slate_done() {
    let root = PathBuf::from("/tmp/test-nova");
    let mut ws = ProducerWorkspace::new("test-film", root);
    ws.complete_stage(ProducerStage::Slate);
    ws.advance_stage().unwrap();

    let action = suggest_next_action(&ws);
    assert!(action.command.contains("package build"));
}

#[test]
fn run_steps_track_status_correctly() {
    let mut run = ProducerRun::new("run-001", RunType::SlateAnalyze);
    assert_eq!(run.status, RunStatus::Created);

    run.start();
    assert_eq!(run.status, RunStatus::Running);

    let mut step = RunStep::new(1, "agent-1", "Script Analyst");
    step.start();
    assert_eq!(step.status, StepStatus::Running);

    step.complete();
    assert_eq!(step.status, StepStatus::Completed);
    assert!(step.finished_at.is_some());

    run.add_step(step);
    run.complete();
    assert_eq!(run.status, RunStatus::Completed);
    assert!(run.all_steps_completed());
}

#[test]
fn agent_archetype_stage_mapping() {
    let slate_agents = AgentArchetype::stage_agents(ProducerStage::Slate);
    assert!(slate_agents.contains(&AgentArchetype::ScriptAnalyst));
    assert!(slate_agents.contains(&AgentArchetype::SynthesisAgent));

    let package_agents = AgentArchetype::stage_agents(ProducerStage::Package);
    assert!(package_agents.contains(&AgentArchetype::PreVizDirector));
    assert!(package_agents.contains(&AgentArchetype::CastingScout));
    assert!(package_agents.contains(&AgentArchetype::LocationScout));
}
