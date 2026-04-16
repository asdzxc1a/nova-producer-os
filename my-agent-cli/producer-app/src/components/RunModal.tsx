import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { X, Loader2, CheckCircle2, AlertCircle, Play, FileText } from "lucide-react";
import type { ProducerRun, RunStatus, StepStatus } from "../types";

const StatusIcon = ({ status }: { status: StepStatus }) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    case "running":
      return <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />;
    case "failed":
      return <AlertCircle className="w-5 h-5 text-rose-400" />;
    default:
      return <Play className="w-5 h-5 text-slate-500" />;
  }
};

const runStatusColor = (status: RunStatus) => {
  switch (status) {
    case "completed":
      return "text-emerald-400";
    case "failed":
      return "text-rose-400";
    case "running":
      return "text-amber-400";
    default:
      return "text-slate-400";
  }
};

const runStatusLabel = (status: RunStatus) => {
  switch (status) {
    case "completed":
      return "Complete";
    case "failed":
      return "Failed";
    case "running":
      return "Running";
    default:
      return "Created";
  }
};

interface Props {
  runId: string;
  onClose: () => void;
}

export default function RunModal({ runId, onClose }: Props) {
  const [run, setRun] = useState<ProducerRun | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const r = await api.getRunStatus(runId);
        if (active) setRun(r);
      } catch (e) {
        console.error("Failed to load run status:", e);
      }
    }

    poll();
    const id = setInterval(poll, 800);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [runId]);

  if (!run) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-center text-slate-400 mt-4">Loading run details...</p>
        </div>
      </div>
    );
  }

  const completedSteps = run.steps.filter((s) => s.status === "completed").length;
  const progress = run.steps.length > 0 ? Math.round((completedSteps / run.steps.length) * 100) : 0;
  const isDone = run.status === "completed" || run.status === "failed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${run.status === "completed" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : run.status === "failed" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
              {isDone ? <FileText className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100 capitalize">
                {run.run_type.replace("_", " ")}
              </h3>
              <p className={`text-sm font-medium ${runStatusColor(run.status)} capitalize`}>
                {runStatusLabel(run.status)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-6 space-y-6">
          <div>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-slate-400">Overall Progress</span>
              <span className="text-slate-100 font-semibold">{progress}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  run.status === "completed"
                    ? "bg-emerald-500"
                    : run.status === "failed"
                    ? "bg-rose-500"
                    : "bg-gradient-to-r from-cyan-500 to-violet-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {run.steps.map((step, idx) => (
              <div
                key={step.step_number}
                className="flex items-center gap-4 rounded-xl border border-slate-800/60 bg-slate-950/50 p-4"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <StatusIcon status={step.status} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-200">{step.agent_name}</p>
                  {step.output_summary && (
                    <p className="text-xs text-slate-500 mt-0.5">{step.output_summary}</p>
                  )}
                </div>
                {step.duration_seconds !== undefined && (
                  <span className="text-xs text-slate-500 font-mono">{step.duration_seconds}s</span>
                )}
              </div>
            ))}
          </div>

          {/* Artifacts */}
          {run.artifact_names.length > 0 && (
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-950/15 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-300">Generated Artifacts</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {run.artifact_names.map((name) => (
                  <span
                    key={name}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-slate-200 text-sm border border-slate-800"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/60 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-mono">{run.run_id}</p>
            {!isDone && (
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing agents...
              </div>
            )}
            {isDone && (
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-cyan-500/15"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
