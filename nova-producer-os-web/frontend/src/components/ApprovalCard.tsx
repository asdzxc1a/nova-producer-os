import { api } from "../lib/api";
import { AlertCircle, XCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { ApprovalRequest } from "../types";

interface Props {
  approvals: ApprovalRequest[];
  onResolved: () => void;
}

export default function ApprovalCard({ approvals, onResolved }: Props) {
  async function handleResolve(id: string, approve: boolean) {
    await api.resolveApproval(id, approve);
    onResolved();
  }

  return (
    <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-950/20 to-slate-900/40 p-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-rose-100">Pending Approvals</h3>
          <p className="text-sm text-rose-300/70">
            {approvals.length} item{approvals.length !== 1 ? "s" : ""} require your review
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {approvals.map((approval) => (
          <div
            key={approval.approval_id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-rose-500/10 bg-slate-900/60 p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-slate-200">{approval.agent_name}</p>
                <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{approval.risk_summary}</p>
                <p className="text-xs text-slate-500 mt-2 font-mono">{approval.approval_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:shrink-0">
              <button
                onClick={() => handleResolve(approval.approval_id, false)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-sm font-medium hover:bg-rose-500/20 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={() => handleResolve(approval.approval_id, true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
