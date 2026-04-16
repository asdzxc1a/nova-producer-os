import { useState, useEffect } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import WorkspaceSelector from "./pages/WorkspaceSelector";
import Dashboard from "./pages/Dashboard";
import type { ProducerWorkspace } from "./types";

export default function App() {
  const [workspace, setWorkspace] = useState<ProducerWorkspace | null>(null);
  const [lastWorkspaceName, setLastWorkspaceName] = useLocalStorage<string | null>("producer-os:last-workspace", null);
  const [isRestoring, setIsRestoring] = useState(true);

  // When a workspace is opened, remember it
  const handleOpen = (ws: ProducerWorkspace) => {
    setWorkspace(ws);
    setLastWorkspaceName(ws.name);
  };

  const handleBack = () => {
    setWorkspace(null);
    // Keep lastWorkspaceName so we can pre-select it next time
  };

  useEffect(() => {
    // Small delay to allow the restore process in WorkspaceSelector to complete
    const timer = setTimeout(() => setIsRestoring(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!workspace) {
    return (
      <WorkspaceSelector
        onOpen={handleOpen}
        lastWorkspaceName={lastWorkspaceName}
        isRestoring={isRestoring}
      />
    );
  }

  return <Dashboard workspaceName={workspace.name} onBack={handleBack} />;
}
