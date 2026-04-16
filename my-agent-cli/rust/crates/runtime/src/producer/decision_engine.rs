use super::workspace::{ProducerStage, ProducerWorkspace, StageStatus};
use serde::{Deserialize, Serialize};

/// The next recommended action for a producer.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NextAction {
    pub command: String,
    pub reason: String,
    pub urgency: Urgency,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Urgency {
    Low,
    Normal,
    High,
    Critical,
}

impl Urgency {
    #[must_use]
    pub fn icon(&self) -> &'static str {
        match self {
            Self::Low => "○",
            Self::Normal => "●",
            Self::High => "▲",
            Self::Critical => "◆",
        }
    }
}

/// Given a workspace, suggest the most appropriate next CLI command.
#[must_use]
pub fn suggest_next_action(workspace: &ProducerWorkspace) -> NextAction {
    let stage = workspace.current_stage;
    let state = workspace.stages.get(&stage).copied().unwrap_or_else(super::workspace::StageState::locked);

    match (stage, state.status) {
        (ProducerStage::Slate, StageStatus::Ready) => NextAction {
            command: format!("nova /run slate analyze --slate <file> --workspace {}", workspace.name),
            reason: "Start by analyzing your development slate.".to_string(),
            urgency: Urgency::Normal,
        },
        (ProducerStage::Slate, StageStatus::Running) => NextAction {
            command: "nova /run status".to_string(),
            reason: "A slate analysis is currently running. Check progress.".to_string(),
            urgency: Urgency::Normal,
        },
        (ProducerStage::Slate, StageStatus::Blocked) => NextAction {
            command: "nova /run retry".to_string(),
            reason: "The slate run hit a blocker. Retry the failed steps.".to_string(),
            urgency: Urgency::High,
        },
        (ProducerStage::Slate, StageStatus::Done) => NextAction {
            command: format!("nova /stage package --workspace {}", workspace.name),
            reason: "Slate is complete. Move to packaging your chosen project.".to_string(),
            urgency: Urgency::Normal,
        },

        (ProducerStage::Package, StageStatus::Ready) => NextAction {
            command: format!("nova /run package build --script <file> --workspace {}", workspace.name),
            reason: "Turn your selected script into an investor-ready package.".to_string(),
            urgency: Urgency::Normal,
        },
        (ProducerStage::Package, StageStatus::Running) => NextAction {
            command: "nova /run status".to_string(),
            reason: "Package build is in progress.".to_string(),
            urgency: Urgency::Normal,
        },
        (ProducerStage::Package, StageStatus::Blocked) => NextAction {
            command: "nova /approvals".to_string(),
            reason: "A package step requires approval before continuing.".to_string(),
            urgency: Urgency::High,
        },
        (ProducerStage::Package, StageStatus::Done) => NextAction {
            command: format!("nova /stage finance --workspace {}", workspace.name),
            reason: "Package complete. Time to model the budget.".to_string(),
            urgency: Urgency::Normal,
        },

        (ProducerStage::Finance, StageStatus::Ready) => NextAction {
            command: format!("nova /run finance model --project <name> --workspace {}", workspace.name),
            reason: "Build the financial model for this project.".to_string(),
            urgency: Urgency::Normal,
        },
        (ProducerStage::Finance, StageStatus::Running) => NextAction {
            command: "nova /run status".to_string(),
            reason: "Finance model is running.".to_string(),
            urgency: Urgency::Normal,
        },
        (ProducerStage::Finance, StageStatus::Blocked) => NextAction {
            command: "nova /run retry".to_string(),
            reason: "Finance run is blocked. Review and retry.".to_string(),
            urgency: Urgency::High,
        },
        (ProducerStage::Finance, StageStatus::Done) => NextAction {
            command: format!("nova /stage comply --workspace {}", workspace.name),
            reason: "Finance complete. Run compliance checks next.".to_string(),
            urgency: Urgency::Normal,
        },

        (ProducerStage::Comply, StageStatus::Ready) => NextAction {
            command: format!("nova /run comply scan --workspace {}", workspace.name),
            reason: "Scan for EU AI Act and union exposure before going to market.".to_string(),
            urgency: Urgency::Normal,
        },
        (ProducerStage::Comply, StageStatus::Running) => NextAction {
            command: "nova /run status".to_string(),
            reason: "Compliance scan is running.".to_string(),
            urgency: Urgency::Normal,
        },
        (ProducerStage::Comply, StageStatus::Blocked) => NextAction {
            command: "nova /approvals".to_string(),
            reason: "Compliance found high-risk items requiring approval.".to_string(),
            urgency: Urgency::Critical,
        },
        (ProducerStage::Comply, StageStatus::Done) => NextAction {
            command: format!("nova /stage launch --workspace {}", workspace.name),
            reason: "Compliance cleared. Plan your launch strategy.".to_string(),
            urgency: Urgency::Normal,
        },

        (ProducerStage::Launch, StageStatus::Ready) => NextAction {
            command: format!("nova /run launch strategy --project <name> --workspace {}", workspace.name),
            reason: "Map festivals, platforms, and territories.".to_string(),
            urgency: Urgency::Normal,
        },
        (ProducerStage::Launch, StageStatus::Running) => NextAction {
            command: "nova /run status".to_string(),
            reason: "Launch strategy is being drafted.".to_string(),
            urgency: Urgency::Normal,
        },
        (ProducerStage::Launch, StageStatus::Blocked) => NextAction {
            command: "nova /run retry".to_string(),
            reason: "Launch planning hit a snag. Retry to continue.".to_string(),
            urgency: Urgency::High,
        },
        (ProducerStage::Launch, StageStatus::Done) => NextAction {
            command: "nova /artifacts".to_string(),
            reason: "Project is launch-ready. Review all artifacts.".to_string(),
            urgency: Urgency::Low,
        },

        // Fallback for locked stages (shouldn't normally happen for current_stage)
        (_, StageStatus::Locked) => NextAction {
            command: "nova /dashboard".to_string(),
            reason: "This stage is locked. Check the dashboard for available actions.".to_string(),
            urgency: Urgency::Low,
        },
    }
}
