use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// A single execution of a producer stage workflow.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ProducerRun {
    pub run_id: String,
    pub run_type: RunType,
    pub status: RunStatus,
    pub steps: Vec<RunStep>,
    pub started_at: String,
    pub finished_at: Option<String>,
    pub artifact_names: Vec<String>,
    pub metadata: HashMap<String, String>,
}

impl ProducerRun {
    #[must_use]
    pub fn new(run_id: impl Into<String>, run_type: RunType) -> Self {
        Self {
            run_id: run_id.into(),
            run_type,
            status: RunStatus::Created,
            steps: Vec::new(),
            started_at: chrono::Utc::now().to_rfc3339(),
            finished_at: None,
            artifact_names: Vec::new(),
            metadata: HashMap::new(),
        }
    }

    pub fn add_step(&mut self, step: RunStep) {
        self.steps.push(step);
    }

    pub fn start(&mut self) {
        self.status = RunStatus::Running;
    }

    pub fn complete(&mut self) {
        self.status = RunStatus::Completed;
        self.finished_at = Some(chrono::Utc::now().to_rfc3339());
    }

    pub fn fail(&mut self) {
        self.status = RunStatus::Failed;
        self.finished_at = Some(chrono::Utc::now().to_rfc3339());
    }

    /// Returns true if all steps are completed.
    #[must_use]
    pub fn all_steps_completed(&self) -> bool {
        !self.steps.is_empty() && self.steps.iter().all(|s| s.status == StepStatus::Completed)
    }

    /// Returns the steps that are currently pending.
    #[must_use]
    pub fn pending_steps(&self) -> Vec<&RunStep> {
        self.steps
            .iter()
            .filter(|s| s.status == StepStatus::Pending)
            .collect()
    }

    /// Returns the steps that failed.
    #[must_use]
    pub fn failed_steps(&self) -> Vec<&RunStep> {
        self.steps
            .iter()
            .filter(|s| s.status == StepStatus::Failed)
            .collect()
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RunStep {
    pub step_number: u32,
    pub agent_id: String,
    pub agent_name: String,
    pub status: StepStatus,
    pub started_at: Option<String>,
    pub finished_at: Option<String>,
    pub duration_seconds: Option<u64>,
    pub output_summary: Option<String>,
    pub approval_required: bool,
}

impl RunStep {
    #[must_use]
    pub fn new(step_number: u32, agent_id: impl Into<String>, agent_name: impl Into<String>) -> Self {
        Self {
            step_number,
            agent_id: agent_id.into(),
            agent_name: agent_name.into(),
            status: StepStatus::Pending,
            started_at: None,
            finished_at: None,
            duration_seconds: None,
            output_summary: None,
            approval_required: false,
        }
    }

    pub fn start(&mut self) {
        self.status = StepStatus::Running;
        self.started_at = Some(chrono::Utc::now().to_rfc3339());
    }

    pub fn complete(&mut self) {
        self.status = StepStatus::Completed;
        self.finished_at = Some(chrono::Utc::now().to_rfc3339());
        if let Some(ref start) = self.started_at {
            if let Ok(start_dt) = chrono::DateTime::parse_from_rfc3339(start) {
                let duration = chrono::Utc::now().signed_duration_since(start_dt.with_timezone(&chrono::Utc));
                self.duration_seconds = Some(duration.num_seconds().max(0) as u64);
            }
        }
    }

    pub fn fail(&mut self) {
        self.status = StepStatus::Failed;
        self.finished_at = Some(chrono::Utc::now().to_rfc3339());
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RunType {
    SlateAnalyze,
    PackageBuild,
    FinanceModel,
    ComplyScan,
    LaunchStrategy,
}

impl RunType {
    #[must_use]
    pub fn stage(&self) -> super::workspace::ProducerStage {
        use super::workspace::ProducerStage;
        match self {
            Self::SlateAnalyze => ProducerStage::Slate,
            Self::PackageBuild => ProducerStage::Package,
            Self::FinanceModel => ProducerStage::Finance,
            Self::ComplyScan => ProducerStage::Comply,
            Self::LaunchStrategy => ProducerStage::Launch,
        }
    }

    #[must_use]
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::SlateAnalyze => "slate_analyze",
            Self::PackageBuild => "package_build",
            Self::FinanceModel => "finance_model",
            Self::ComplyScan => "comply_scan",
            Self::LaunchStrategy => "launch_strategy",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RunStatus {
    Created,
    Running,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum StepStatus {
    Pending,
    Running,
    Completed,
    Failed,
}

impl StepStatus {
    #[must_use]
    pub fn icon(&self) -> &'static str {
        match self {
            Self::Pending => "○",
            Self::Running => "▶",
            Self::Completed => "✓",
            Self::Failed => "✗",
        }
    }
}
