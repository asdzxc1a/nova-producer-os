export type ProducerStage = "slate" | "package" | "finance" | "comply" | "launch";

export type StageStatus = "locked" | "ready" | "running" | "done" | "blocked";

export type BudgetTier = "micro" | "indie" | "mid" | "studio";

export interface StageState {
  status: StageStatus;
}

export interface ProducerWorkspace {
  name: string;
  genre?: string;
  budget_tier?: BudgetTier;
  target_rating?: string;
  current_stage: ProducerStage;
  stages: Record<ProducerStage, StageState>;
  created_at: string;
  workspace_root: string;
}

export type RunStatus = "created" | "running" | "completed" | "failed";

export type StepStatus = "pending" | "running" | "completed" | "failed";

export interface RunStep {
  step_number: number;
  agent_id: string;
  agent_name: string;
  status: StepStatus;
  started_at?: string;
  finished_at?: string;
  duration_seconds?: number;
  output_summary?: string;
  approval_required: boolean;
}

export type RunType = "slate_analyze" | "package_build" | "finance_model" | "comply_scan" | "launch_strategy";

export interface ProducerRun {
  run_id: string;
  run_type: RunType;
  status: RunStatus;
  steps: RunStep[];
  started_at: string;
  finished_at?: string;
  artifact_names: string[];
  metadata: Record<string, string>;
}

export type Urgency = "low" | "normal" | "high" | "critical";

export interface NextAction {
  command: string;
  reason: string;
  urgency: Urgency;
}

export type ApprovalStatus = "requested" | "approved" | "rejected";

export interface ApprovalRequest {
  approval_id: string;
  run_id: string;
  step_number: number;
  agent_name: string;
  risk_summary: string;
  status: ApprovalStatus;
  created_at: string;
  resolved_at?: string;
}

export interface DashboardData {
  workspace: ProducerWorkspace;
  next_action: NextAction;
  recent_runs: ProducerRun[];
  pending_approvals: ApprovalRequest[];
}

export interface ArtifactSummary {
  name: string;
  path: string;
  size_bytes: number;
}
