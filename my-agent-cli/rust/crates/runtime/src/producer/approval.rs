use serde::{Deserialize, Serialize};

/// A request for human approval before a risky producer action proceeds.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ApprovalRequest {
    pub approval_id: String,
    pub run_id: String,
    pub step_number: u32,
    pub agent_name: String,
    pub risk_summary: String,
    pub status: ApprovalStatus,
    pub created_at: String,
    pub resolved_at: Option<String>,
}

impl ApprovalRequest {
    #[must_use]
    pub fn new(
        approval_id: impl Into<String>,
        run_id: impl Into<String>,
        step_number: u32,
        agent_name: impl Into<String>,
        risk_summary: impl Into<String>,
    ) -> Self {
        Self {
            approval_id: approval_id.into(),
            run_id: run_id.into(),
            step_number,
            agent_name: agent_name.into(),
            risk_summary: risk_summary.into(),
            status: ApprovalStatus::Requested,
            created_at: chrono::Utc::now().to_rfc3339(),
            resolved_at: None,
        }
    }

    pub fn approve(&mut self) {
        self.status = ApprovalStatus::Approved;
        self.resolved_at = Some(chrono::Utc::now().to_rfc3339());
    }

    pub fn reject(&mut self) {
        self.status = ApprovalStatus::Rejected;
        self.resolved_at = Some(chrono::Utc::now().to_rfc3339());
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ApprovalStatus {
    Requested,
    Approved,
    Rejected,
}

impl ApprovalStatus {
    #[must_use]
    pub fn icon(&self) -> &'static str {
        match self {
            Self::Requested => "⏸",
            Self::Approved => "✓",
            Self::Rejected => "✗",
        }
    }
}
