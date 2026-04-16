import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import type { Toast } from "../hooks/useToast";

interface Props {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const styleMap = {
  success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  error: "bg-rose-500/10 border-rose-500/20 text-rose-400",
  info: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
};

export default function ToastContainer({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-sm animate-fadeIn min-w-[280px] max-w-md ${styleMap[toast.type]}`}
            style={{ background: "rgba(15, 23, 42, 0.95)" }}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <p className="text-sm text-slate-100 flex-1">{toast.message}</p>
            <button
              onClick={() => onRemove(toast.id)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
