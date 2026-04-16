# Nova Producer OS — Web App

A standalone web-based frontend for Nova Producer OS, featuring a React UI and a Rust Axum HTTP server. It reuses the exact same business logic from `my-agent-cli` via path dependencies.

## Architecture

- **`frontend/`** — Vite + React 19 + TypeScript + Tailwind CSS v4
- **`server/`** — Rust Axum HTTP server (port `3001`)

## Quick Start

### 1. Start the backend

```bash
cd server
cargo build
./target/debug/nova-producer-web-server
```

The server will start on `http://localhost:3001`.

### 2. Start the frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The web app will open on `http://localhost:5173`.

### 3. Open in browser

Navigate to `http://localhost:5173` and click **"Try the Cannes Demo"**.

## What was ported from the desktop app

| Desktop (Tauri) | Web equivalent |
|-----------------|----------------|
| `src/App.tsx` | `frontend/src/App.tsx` |
| `src/pages/WorkspaceSelector.tsx` | `frontend/src/pages/WorkspaceSelector.tsx` |
| `src/pages/Dashboard.tsx` | `frontend/src/pages/Dashboard.tsx` |
| `src/components/*.tsx` | `frontend/src/components/*.tsx` |
| `src/lib/api.ts` (Tauri `invoke`) | `frontend/src/lib/api.ts` (`fetch` to `localhost:3001/api`) |
| Tauri commands in Rust | Axum handlers in `server/src/handlers/` |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server health check |
| GET | `/api/dashboard` | Dashboard data |
| GET | `/api/workspaces` | List workspaces |
| POST | `/api/workspace/open` | Open workspace |
| POST | `/api/workspace/create` | Create workspace |
| POST | `/api/project-root` | Set project root path |
| POST | `/api/run` | Run a pipeline stage |
| GET | `/api/run/:id` | Get run status |
| GET | `/api/artifacts` | List artifacts |
| GET | `/api/artifacts/:name` | Read artifact content |
| GET | `/api/approvals` | List pending approvals |
| POST | `/api/approvals/resolve` | Approve/reject approval |

## Testing

All backend endpoints were tested with `curl`. The full frontend was tested end-to-end with a headless browser covering:

- Workspace selector rendering
- Opening the Cannes demo workspace
- Dashboard with pipeline progress and stage cards
- Artifacts viewer
- Running a stage (Finance Model)
- Run modal with agent progress and generated artifacts
