import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Plus, FolderOpen, Film, ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import type { ProducerWorkspace } from "../types";
import ToastContainer from "../components/ToastContainer";
import { useToast } from "../hooks/useToast";

interface Props {
  onOpen: (ws: ProducerWorkspace) => void;
  lastWorkspaceName: string | null;
  isRestoring: boolean;
}

export default function WorkspaceSelector({ onOpen, lastWorkspaceName, isRestoring }: Props) {
  const [workspaces, setWorkspaces] = useState<{ name: string; path: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [projectPath, setProjectPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toasts, showToast, removeToast } = useToast();

  async function loadWorkspaces() {
    setError(null);
    try {
      const list = await api.listWorkspaces();
      setWorkspaces(list);
      setLoading(false);
    } catch (e) {
      setError("Failed to load workspaces.");
      setLoading(false);
    }
  }

  useEffect(() => {
    const guess =
      window.location.origin.includes("localhost")
        ? "/Users/dmytrnewaimastery/Documents/CLAUDE CODE/Claude Code Project/my-agent-cli/examples/cannes-demo-workspace"
        : "";
    setProjectPath(guess);
    api.setProjectRoot(guess || ".").then(() => loadWorkspaces());
  }, []);

  async function applyPath() {
    if (!projectPath.trim()) return;
    setLoading(true);
    await api.setProjectRoot(projectPath.trim());
    await loadWorkspaces();
  }

  async function createWorkspace() {
    if (!newName.trim()) return;
    try {
      const ws = await api.createWorkspace(newName.trim());
      showToast(`Workspace "${ws.name}" created`, "success");
      onOpen(ws);
    } catch (e: any) {
      setError("Failed to create workspace.");
      showToast(e?.message || "Failed to create workspace", "error");
    }
  }

  async function openWorkspaceByName(name: string) {
    try {
      const ws = await api.openWorkspace(name);
      showToast(`Opened "${ws.name}"`, "success");
      onOpen(ws);
    } catch (e: any) {
      setError(`Failed to open workspace "${name}".`);
      showToast(e?.message || `Failed to open workspace "${name}"`, "error");
    }
  }

  const hasDemo = workspaces.some((w) => w.name === "cannes-demo");

  if (loading || isRestoring) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-950">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl animate-pulse" />
          <Film className="relative w-12 h-12 text-cyan-400 animate-pulse" />
        </div>
        <p className="text-slate-500 mt-6 text-sm tracking-wide">Loading Producer OS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-lg">
        {/* Hero */}
        <div className="text-center mb-10 animate-fadeIn">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 mx-auto">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 opacity-20 blur-lg" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20" />
            <Film className="relative w-10 h-10 text-cyan-300" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="gradient-text">Producer OS</span>
          </h1>
          <p className="text-slate-400 mt-3 text-lg">AI-powered film production pipeline</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-950/20 px-4 py-3 text-sm text-rose-300 animate-fadeIn">
            {error}
          </div>
        )}

        {/* Quick start demo */}
        {hasDemo && (
          <button
            onClick={() => openWorkspaceByName("cannes-demo")}
            className="group w-full mb-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 to-slate-900/60 p-5 text-left transition-all hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.12)] animate-fadeIn"
            style={{ animationDelay: "50ms" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">Try the Cannes Demo</p>
                  <p className="text-sm text-slate-400">Pre-loaded with slate, package & finance data</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-cyan-400 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        )}

        {/* Last workspace */}
        {lastWorkspaceName && workspaces.some((w) => w.name === lastWorkspaceName) && (
          <button
            onClick={() => openWorkspaceByName(lastWorkspaceName)}
            className="group w-full mb-6 rounded-2xl border border-slate-700/60 bg-slate-900/40 p-5 text-left transition-all hover:border-slate-600 hover:bg-slate-800/40 animate-fadeIn"
            style={{ animationDelay: "100ms" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">Continue {lastWorkspaceName}</p>
                  <p className="text-sm text-slate-400">Resume where you left off</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        )}

        {/* Workspace list */}
        <div
          className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden animate-fadeIn"
          style={{ animationDelay: "150ms" }}
        >
          <div className="px-5 py-4 border-b border-slate-800/60">
            <p className="text-sm font-medium text-slate-300">Your workspaces</p>
          </div>
          <div className="divide-y divide-slate-800/60">
            {workspaces
              .filter((w) => w.name !== "cannes-demo")
              .map((ws) => (
                <button
                  key={ws.name}
                  onClick={() => openWorkspaceByName(ws.name)}
                  className="group w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-800/40"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400 group-hover:text-slate-300">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-200 truncate">{ws.name}</p>
                    <p className="text-xs text-slate-500 truncate">{ws.path}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </button>
              ))}
            {workspaces.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-slate-500">No workspaces found yet.</p>
                <p className="text-xs text-slate-600 mt-1">Create one below or enter a project path.</p>
              </div>
            )}
          </div>
        </div>

        {/* Project path */}
        <div
          className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 animate-fadeIn"
          style={{ animationDelay: "200ms" }}
        >
          <p className="text-sm font-medium text-slate-400 mb-3">Project folder</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={projectPath}
              onChange={(e) => setProjectPath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyPath()}
              placeholder="/path/to/project"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all"
            />
            <button
              onClick={applyPath}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-all text-sm font-medium"
            >
              Scan
            </button>
          </div>
        </div>

        {/* Create new */}
        <div
          className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 animate-fadeIn"
          style={{ animationDelay: "250ms" }}
        >
          <p className="text-sm font-medium text-slate-400 mb-3">Create new project</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createWorkspace()}
              placeholder="my-film-project"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all"
            />
            <button
              onClick={createWorkspace}
              disabled={!newName.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold transition-all text-sm shadow-lg shadow-cyan-500/15"
            >
              <Plus className="w-4 h-4" />
              Create
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">
          Producer OS v0.1.0 · Tauri Desktop App
        </p>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </div>
  );
}
