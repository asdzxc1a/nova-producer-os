# Cannes Film Festival Demo Script

## Setup

```bash
cd examples/cannes-demo-workspace
nova /workspace cannes-demo
```

The demo workspace is pre-staged with:
- **SLATE_REPORT.md** — script analysis and budget oracle assessment
- **PITCH_DECK.md** — sample package artifact (will be refreshed live)
- **BUDGET_MODEL.json** — sample finance artifact (will be refreshed live)

Current stage state: **Slate (Done) → Package (Ready)**

## Demo Flow (7 minutes)

### 1. Dashboard (30s)
```
nova /dashboard
```
Shows:
- Workspace: cannes-demo
- Stage: Package (Ready)
- Next Action: `/run package build --script kill-list.pdf`
- Existing artifact: SLATE_REPORT.md

### 2. Workspace Context (30s)
```
nova /artifacts
```
Shows the Slate Report, Pitch Deck, and Budget Model already generated.

### 3. Stage Overview (30s)
```
nova /stage package
```
Shows Package stage summary and available commands.

### 4. Run Package Build (2m)
```
nova /run package build --script kill-list.pdf
```
Spawns Pre-Viz Director, Casting Scout, and Location Scout in parallel with animated progress bars.
Creates PITCH_DECK.md.
Unlocks Finance stage.

### 5. Dashboard Update (30s)
```
nova /dashboard
```
Now shows Stage: Finance (Ready).

### 6. Run Finance Model (2m)
```
nova /run finance model --project "The Kill List"
```
Generates BUDGET_MODEL.json with real-time synthesis progress.
Unlocks Comply stage.

### 7. Compliance Scan with Approval Gate (1m)
```
nova /run comply scan
```
Compliance Officer detects EU AI Act exposure.
Run blocks. Approval created.

```
nova /approvals
```
Shows pending approval.

## Demo Tips

- Set `NOVA_DEMO_MODE=1` to reduce agent sleep from 100ms to 10ms for faster demos.
- The progress bars show step-by-step agent completion and a filling synthesis bar.
- All ANSI colors are consistent across `/dashboard`, `/stage`, and `/run`.

## Closing Line

> *"This is not a chatbot. This is a production command center. From script to launch-ready setup — one context-preserving workflow."*
