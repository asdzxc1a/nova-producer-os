import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../lib/api";
import {
  RefreshCw,
  ChevronRight,
  Loader2,
  FileText,
  Zap,
  ArrowLeft,
  Upload,
  Clock,
  Play,
} from "lucide-react";
import type { DashboardData, ProducerStage } from "../types";
import PipelineCard from "../components/PipelineCard";
import ApprovalCard from "../components/ApprovalCard";
import ArtifactViewer from "../components/ArtifactViewer";
import RunModal from "../components/RunModal";
import ToastContainer from "../components/ToastContainer";
import { useToast } from "../hooks/useToast";

const stages: ProducerStage[] = ["slate", "package", "finance", "comply", "launch"];

const urgencyGradient: Record<string, string> = {
  critical: "from-rose-500/20 to-rose-950/10 border-rose-500/25",
  high: "from-amber-500/20 to-amber-950/10 border-amber-500/25",
  normal: "from-cyan-500/20 to-cyan-950/10 border-cyan-500/25",
  low: "from-slate-500/20 to-slate-950/10 border-slate-500/25",
};

const urgencyBadge: Record<string, string> = {
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  normal: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  low: "bg-slate-500/15 text-slate-400 border-slate-500/20",
};

interface Props {
  workspaceName: string;
  onBack: () => void;
}

export default function Dashboard({ onBack }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningStage, setRunningStage] = useState<ProducerStage | null>(null);
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ProducerStage | null>(null);
  const [stageParams, setStageParams] = useState<Record<ProducerStage, string>>({
    slate: "",
    package: "kill-list.pdf",
    finance: "The Kill List",
    comply: "",
    launch: "",
  });

  const fileInputRefs = useRef<Record<ProducerStage, HTMLInputElement | null>>({
    slate: null,
    package: null,
    finance: null,
    comply: null,
    launch: null,
  });
  const [activeFileStage, setActiveFileStage] = useState<ProducerStage | null>(null);
  const { toasts, showToast, removeToast } = useToast();

  const loadDashboard = useCallback(async () => {
    try {
      const result = await api.getDashboard();
      setData(result);
    } catch (e) {
      console.error("Failed to load dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  async function runStage(stage: ProducerStage) {
    setRunningStage(stage);
    try {
      const file = stageParams[stage] || undefined;
      const result = await api.runStage(stage, file);
      setActiveRunId(result.run_id);
      showToast(`${stage.charAt(0).toUpperCase() + stage.slice(1)} run started`, "info");
      await loadDashboard();
    } catch (e: any) {
      console.error("Failed to run stage:", e);
      showToast(e?.message || `Failed to start ${stage} run`, "error");
    } finally {
      setRunningStage(null);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Poll while a stage is running
  useEffect(() => {
    if (!data || data.workspace.stages[data.workspace.current_stage].status !== "running") return;
    const id = setInterval(loadDashboard, 2000);
    return () => clearInterval(id);
  }, [data, loadDashboard]);

  const handleDragOver = (e: React.DragEvent, stage: ProducerStage) => {
    e.preventDefault();
    if (stage === "package" || stage === "finance" || stage === "launch") {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stage: ProducerStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const file = e.dataTransfer.files?.[0];
    if (file && (stage === "package" || stage === "finance" || stage === "launch")) {
      setStageParams((prev) => ({ ...prev, [stage]: file.name }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, stage: ProducerStage) => {
    const file = e.target.files?.[0];
    if (file) {
      setStageParams((prev) => ({ ...prev, [stage]: file.name }));
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-950">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl animate-pulse" />
          <Loader2 className="relative w-12 h-12 text-cyan-400 animate-spin" />
        </div>
        <p className="text-slate-500 mt-6 text-sm tracking-wide">Loading dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-950">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-slate-500">
          <Zap className="w-8 h-8" />
        </div>
        <p className="text-lg">Failed to load dashboard.</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors font-medium"
        >
          Back to Workspaces
        </button>
      </div>
    );
  }

  const handleApprovalResolved = () => {
    loadDashboard();
    showToast("Approval resolved", "success");
  };

  const doneCount = stages.filter((s) => data.workspace.stages[s].status === "done").length;
  const pipelineProgress = Math.round((doneCount / stages.length) * 100);

  return (
    <div className="min-h-full w-full p-6 md:p-10 bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                <span className="gradient-text">Producer OS</span>
              </h1>
              <p className="text-slate-400 mt-1">
                Project: <span className="text-slate-200 font-medium">{data.workspace.name}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowArtifacts(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700/60 bg-slate-900/60 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Artifacts
            </button>
            <button
              onClick={loadDashboard}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700/60 bg-slate-900/60 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn" style={{ animationDelay: "50ms" }}>
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
            <p className="text-sm text-slate-500">Pipeline Progress</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-3xl font-bold text-slate-100">{pipelineProgress}%</span>
              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-700"
                  style={{ width: `${pipelineProgress}%` }}
                />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
            <p className="text-sm text-slate-500">Stages Complete</p>
            <p className="text-3xl font-bold text-slate-100 mt-1">
              {doneCount} <span className="text-lg text-slate-500 font-normal">/ {stages.length}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
            <p className="text-sm text-slate-500">Recent Runs</p>
            <p className="text-3xl font-bold text-slate-100 mt-1">{data.recent_runs.length}</p>
          </div>
        </div>

        {/* Next Action Card */}
        <div
          className={`rounded-2xl border bg-gradient-to-r p-6 ${urgencyGradient[data.next_action.urgency]} animate-fadeIn`}
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/60 border border-white/10">
                <Zap className="w-6 h-6 text-cyan-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-400 uppercase tracking-wide">Next Action</p>
                <h2 className="text-xl font-semibold text-slate-100 mt-1">{data.next_action.reason}</h2>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/40 border border-slate-700/50">
                  <code className="text-sm text-slate-300 font-mono">{data.next_action.command}</code>
                </div>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase border ${urgencyBadge[data.next_action.urgency]}`}
            >
              {data.next_action.urgency}
            </span>
          </div>
        </div>

        {/* Pipeline */}
        <div className="space-y-5 animate-fadeIn" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-200">Production Pipeline</h3>
            <p className="text-sm text-slate-500">Drag a file onto Package, Finance, or Launch</p>
          </div>
          <div className="grid gap-4">
            {stages.map((stage, idx) => {
              const needsParam = stage === "package" || stage === "finance" || stage === "launch";
              const paramLabel = stage === "package" ? "Script or PDF" : "Project name";
              const isDragOver = dragOverStage === stage;

              return (
                <div
                  key={stage}
                  className="space-y-3"
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage)}
                >
                  <PipelineCard
                    stage={stage}
                    status={data.workspace.stages[stage].status}
                    isCurrent={data.workspace.current_stage === stage}
                    isRunning={runningStage === stage}
                    onRun={() => runStage(stage)}
                    isLast={idx === stages.length - 1}
                  />
                  {(data.workspace.stages[stage].status === "ready" || data.workspace.stages[stage].status === "blocked") &&
                    needsParam && (
                      <div className="pl-4">
                        <div
                          className={`drag-zone flex items-center gap-3 rounded-xl border px-4 py-3 bg-slate-900/40 ${
                            isDragOver
                              ? "border-cyan-500/50 bg-cyan-500/5"
                              : "border-slate-800/60"
                          }`}
                        >
                          <span className="text-sm text-slate-500 w-28 shrink-0">{paramLabel}</span>
                          <input
                            type="text"
                            value={stageParams[stage]}
                            onChange={(e) =>
                              setStageParams((prev) => ({ ...prev, [stage]: e.target.value }))
                            }
                            disabled={runningStage === stage}
                            className="flex-1 max-w-sm px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50 transition-all"
                          />
                          <button
                            onClick={() => {
                              setActiveFileStage(stage);
                              fileInputRefs.current[stage]?.click();
                            }}
                            disabled={runningStage === stage}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700/60 bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors text-sm disabled:opacity-50"
                          >
                            <Upload className="w-4 h-4" />
                            Browse
                          </button>
                          <input
                            ref={(el) => { fileInputRefs.current[stage] = el; }}
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              if (activeFileStage === stage) {
                                handleFileSelect(e, stage);
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Approvals */}
        {data.pending_approvals.length > 0 && (
          <ApprovalCard approvals={data.pending_approvals} onResolved={handleApprovalResolved} />
        )}

        {/* Recent Runs */}
        {data.recent_runs.length > 0 && (
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 animate-fadeIn" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-200">Recent Runs</h3>
            </div>
            <div className="space-y-2">
              {data.recent_runs.map((run, idx) => (
                <button
                  key={run.run_id}
                  onClick={() => setActiveRunId(run.run_id)}
                  className="group w-full flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 text-left hover:border-slate-700 hover:bg-slate-900/60 transition-all"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                        run.status === "completed"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : run.status === "failed"
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      }`}
                    >
                      {run.status === "completed" ? (
                        <Play className="w-4 h-4 fill-current" />
                      ) : run.status === "failed" ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-slate-200 capitalize block">
                        {run.run_type.replace("_", " ")}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{run.run_id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-slate-400">
                      {run.steps.filter((s) => s.status === "completed").length} / {run.steps.length}{" "}
                      <span className="text-slate-600">agents</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showArtifacts && <ArtifactViewer onClose={() => setShowArtifacts(false)} />}
      {activeRunId && <RunModal runId={activeRunId} onClose={() => setActiveRunId(null)} />}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
