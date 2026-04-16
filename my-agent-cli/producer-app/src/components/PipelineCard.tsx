import { FileText, Briefcase, TrendingUp, ShieldCheck, Rocket, Play, CheckCircle2, Lock, Loader2, AlertCircle } from "lucide-react";
import type { ProducerStage, StageStatus } from "../types";

const stageConfig: Record<
  ProducerStage,
  { label: string; icon: React.ElementType; description: string; color: string }
> = {
  slate: { label: "Slate", icon: FileText, description: "Script analysis & budget oracle", color: "#22d3ee" },
  package: { label: "Package", icon: Briefcase, description: "Pitch deck & investor materials", color: "#a78bfa" },
  finance: { label: "Finance", icon: TrendingUp, description: "Budget model & financing plan", color: "#34d399" },
  comply: { label: "Comply", icon: ShieldCheck, description: "Compliance scan & risk review", color: "#fbbf24" },
  launch: { label: "Launch", icon: Rocket, description: "Festival strategy & distribution", color: "#fb7185" },
};

const statusConfig: Record<StageStatus, { bg: string; border: string; text: string; glow: string; label: string }> = {
  locked: {
    bg: "bg-slate-900/40",
    border: "border-slate-800",
    text: "text-slate-500",
    glow: "",
    label: "Locked",
  },
  ready: {
    bg: "bg-slate-900/60",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    glow: "shadow-[0_0_24px_rgba(6,182,212,0.12)]",
    label: "Ready",
  },
  running: {
    bg: "bg-slate-900/60",
    border: "border-amber-500/30",
    text: "text-amber-400",
    glow: "shadow-[0_0_24px_rgba(245,158,11,0.12)]",
    label: "Running",
  },
  done: {
    bg: "bg-slate-900/60",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    glow: "shadow-[0_0_24px_rgba(16,185,129,0.12)]",
    label: "Complete",
  },
  blocked: {
    bg: "bg-slate-900/60",
    border: "border-rose-500/30",
    text: "text-rose-400",
    glow: "shadow-[0_0_24px_rgba(244,63,94,0.12)]",
    label: "Blocked",
  },
};

const StatusIcon = ({ status }: { status: StageStatus }) => {
  switch (status) {
    case "done":
      return <CheckCircle2 className="w-5 h-5" />;
    case "running":
      return <Loader2 className="w-5 h-5 animate-spin" />;
    case "blocked":
      return <AlertCircle className="w-5 h-5" />;
    case "ready":
      return <Play className="w-5 h-5" />;
    case "locked":
    default:
      return <Lock className="w-5 h-5" />;
  }
};

interface Props {
  stage: ProducerStage;
  status: StageStatus;
  isCurrent: boolean;
  isRunning: boolean;
  onRun: () => void;
  isLast?: boolean;
}

export default function PipelineCard({ stage, status, isCurrent, isRunning, onRun, isLast }: Props) {
  const config = stageConfig[stage];
  const statusStyle = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="relative stage-connector">
      {/* Connector dot */}
      {!isLast && (
        <div
          className={`absolute left-[23px] top-14 w-3 h-3 rounded-full border-2 z-10 transition-colors duration-500 ${
            status === "done"
              ? "bg-emerald-500 border-emerald-500"
              : status === "running" || status === "blocked" || status === "ready"
              ? "bg-slate-950 border-cyan-500"
              : "bg-slate-950 border-slate-700"
          }`}
        />
      )}

      <div
        className={`relative rounded-2xl border p-5 transition-all duration-300 ${statusStyle.bg} ${statusStyle.border} ${statusStyle.glow} ${
          isCurrent ? "ring-1 ring-cyan-500/20" : ""
        } ${status === "locked" ? "opacity-70" : ""}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Icon circle */}
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl border transition-colors duration-300"
              style={{
                background: `${config.color}10`,
                borderColor: `${config.color}30`,
                color: config.color,
              }}
            >
              <Icon className="w-6 h-6" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <span className="text-lg font-semibold text-slate-100">{config.label}</span>
                {isCurrent && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">{config.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 text-sm font-medium ${statusStyle.text}`}>
              <StatusIcon status={status} />
              <span className="capitalize hidden sm:inline">{statusStyle.label}</span>
            </div>
            {(status === "ready" || status === "blocked") && (
              <button
                onClick={onRun}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/15"
              >
                {isRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span className="hidden sm:inline">{isRunning ? "Running..." : "Run"}</span>
              </button>
            )}
            {status === "running" && (
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">In Progress</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
