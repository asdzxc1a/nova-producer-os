import type {
  ProducerWorkspace,
  DashboardData,
  ArtifactSummary,
  ApprovalRequest,
  ProducerRun,
} from "../types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Request failed");
    throw new Error(text);
  }
  return res.json() as Promise<T>;
}

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
  getDashboard: () => apiFetch<DashboardData>("/dashboard"),
  listWorkspaces: () => apiFetch<WorkspaceSummary[]>("/workspaces"),
  openWorkspace: (name: string) =>
    apiFetch<ProducerWorkspace>("/workspace/open", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  createWorkspace: (name: string) =>
    apiFetch<ProducerWorkspace>("/workspace/create", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  setProjectRoot: (path: string) =>
    apiFetch<void>("/project-root", {
      method: "POST",
      body: JSON.stringify({ path }),
    }),
  runStage: (stage: string, file?: string) =>
    apiFetch<StageRunResult>("/run", {
      method: "POST",
      body: JSON.stringify({ stage, file }),
    }),
  getRunStatus: (runId: string) =>
    apiFetch<ProducerRun>(`/run/${encodeURIComponent(runId)}`),
  listArtifacts: () => apiFetch<ArtifactSummary[]>("/artifacts"),
  readArtifact: (name: string) =>
    apiFetch<string>(`/artifacts/${encodeURIComponent(name)}`),
  listApprovals: () => apiFetch<ApprovalRequest[]>("/approvals"),
  resolveApproval: (id: string, approve: boolean) =>
    apiFetch<ApprovalRequest>("/approvals/resolve", {
      method: "POST",
      body: JSON.stringify({ id, approve }),
    }),
};
