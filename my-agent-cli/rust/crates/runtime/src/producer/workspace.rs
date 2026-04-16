use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// A film/TV project workspace in the Nova Producer OS.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ProducerWorkspace {
    pub name: String,
    pub genre: Option<String>,
    pub budget_tier: Option<BudgetTier>,
    pub target_rating: Option<String>,
    pub current_stage: ProducerStage,
    pub stages: HashMap<ProducerStage, StageState>,
    pub created_at: String,
    pub workspace_root: PathBuf,
}

impl ProducerWorkspace {
    /// Create a new workspace with all stages initialized.
    #[must_use]
    pub fn new(name: impl Into<String>, root: PathBuf) -> Self {
        let name = name.into();
        let mut stages = HashMap::new();
        stages.insert(ProducerStage::Slate, StageState::ready());
        stages.insert(ProducerStage::Package, StageState::locked());
        stages.insert(ProducerStage::Finance, StageState::locked());
        stages.insert(ProducerStage::Comply, StageState::locked());
        stages.insert(ProducerStage::Launch, StageState::locked());

        Self {
            name: name.clone(),
            genre: None,
            budget_tier: None,
            target_rating: None,
            current_stage: ProducerStage::Slate,
            stages,
            created_at: chrono::Utc::now().to_rfc3339(),
            workspace_root: root.join(".nova").join("workspaces").join(&name),
        }
    }

    /// Advance the current stage if the next one is unlocked or ready.
    pub fn advance_stage(&mut self) -> Result<ProducerStage, WorkspaceError> {
        let next = self.current_stage.next();
        let state = self.stages.get(&next).copied().unwrap_or(StageState::locked());
        if state.status == StageStatus::Locked {
            return Err(WorkspaceError::StageLocked(next));
        }
        self.current_stage = next;
        Ok(next)
    }

    /// Unlock a stage, typically called when the previous stage completes.
    pub fn unlock_stage(&mut self, stage: ProducerStage) {
        if let Some(s) = self.stages.get_mut(&stage) {
            if s.status == StageStatus::Locked {
                s.status = StageStatus::Ready;
            }
        }
    }

    /// Mark a stage as done and unlock the next one.
    pub fn complete_stage(&mut self, stage: ProducerStage) {
        if let Some(s) = self.stages.get_mut(&stage) {
            s.status = StageStatus::Done;
        }
        if let Some(next) = stage.next_opt() {
            self.unlock_stage(next);
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ProducerStage {
    Slate,
    Package,
    Finance,
    Comply,
    Launch,
}

impl ProducerStage {
    #[must_use]
    pub fn next(self) -> Self {
        self.next_opt().unwrap_or(Self::Launch)
    }

    #[must_use]
    pub fn next_opt(self) -> Option<Self> {
        match self {
            Self::Slate => Some(Self::Package),
            Self::Package => Some(Self::Finance),
            Self::Finance => Some(Self::Comply),
            Self::Comply => Some(Self::Launch),
            Self::Launch => None,
        }
    }

    #[must_use]
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Slate => "slate",
            Self::Package => "package",
            Self::Finance => "finance",
            Self::Comply => "comply",
            Self::Launch => "launch",
        }
    }
}

impl std::fmt::Display for ProducerStage {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct StageState {
    pub status: StageStatus,
}

impl StageState {
    #[must_use]
    pub const fn locked() -> Self {
        Self {
            status: StageStatus::Locked,
        }
    }

    #[must_use]
    pub const fn ready() -> Self {
        Self {
            status: StageStatus::Ready,
        }
    }

    #[must_use]
    pub const fn running() -> Self {
        Self {
            status: StageStatus::Running,
        }
    }

    #[must_use]
    pub const fn done() -> Self {
        Self {
            status: StageStatus::Done,
        }
    }

    #[must_use]
    pub const fn blocked() -> Self {
        Self {
            status: StageStatus::Blocked,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum StageStatus {
    Locked,
    Ready,
    Running,
    Done,
    Blocked,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BudgetTier {
    Micro,    // < $1M
    Indie,    // $1M - $5M
    Mid,      // $5M - $25M
    Studio,   // $25M+
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WorkspaceError {
    StageLocked(ProducerStage),
}

impl std::fmt::Display for WorkspaceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::StageLocked(stage) => write!(f, "stage {stage} is locked"),
        }
    }
}

impl std::error::Error for WorkspaceError {}
