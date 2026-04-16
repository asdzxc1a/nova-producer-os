import { invoke } from "@tauri-apps/api/core";
import type {
  ProducerWorkspace,
  DashboardData,
  ArtifactSummary,
  ApprovalRequest,
  ProducerRun,
} from "../types";

export interface WorkspaceSummary {
  name: string;
  path: string;
}

export interface StageRunResult {
  run_id: string;
  stage: string;
  status: string;
  artifacts: string[];
  message: string;
  approval_required: boolean;
}

export const api = {
  getDashboard: () => invoke<DashboardData>("get_dashboard"),
  listWorkspaces: () => invoke<WorkspaceSummary[]>("list_workspaces"),
  openWorkspace: (name: string) => invoke<ProducerWorkspace>("open_workspace", { name }),
  createWorkspace: (name: string) => invoke<ProducerWorkspace>("create_workspace", { name }),
  setProjectRoot: (path: string) => invoke<void>("set_project_root", { path }),
  runStage: (stage: string, file?: string) =>
    invoke<StageRunResult>("run_stage", { stage, file }),
  getRunStatus: (runId: string) => invoke<ProducerRun>("get_run_status", { runId }),
  listArtifacts: () => invoke<ArtifactSummary[]>("list_artifacts"),
  readArtifact: (name: string) => invoke<string>("read_artifact", { name }),
  listApprovals: () => invoke<ApprovalRequest[]>("list_approvals"),
  resolveApproval: (id: string, approve: boolean) =>
    invoke<ApprovalRequest>("resolve_approval", { id, approve }),
};
