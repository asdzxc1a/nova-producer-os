import { useState, useEffect } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import WorkspaceSelector from "./pages/WorkspaceSelector";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import type { ProducerWorkspace } from "./types";

export default function App() {
  const [workspace, setWorkspace] = useState<ProducerWorkspace | null>(null);
  const [lastWorkspaceName, setLastWorkspaceName] = useLocalStorage<string | null>(
    "producer-os:last-workspace",
    null
  );
  const [isRestoring, setIsRestoring] = useState(true);
  const [enteredApp, setEnteredApp] = useState(false);

  const handleOpen = (ws: ProducerWorkspace) => {
    setWorkspace(ws);
    setLastWorkspaceName(ws.name);
  };

  const handleBack = () => {
    setWorkspace(null);
  };

  const handleEnterApp = () => {
    setEnteredApp(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsRestoring(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!enteredApp) {
    return <LandingPage onEnter={handleEnterApp} />;
  }

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
