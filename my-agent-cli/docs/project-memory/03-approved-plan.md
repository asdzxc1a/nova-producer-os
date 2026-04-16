# Approved Plan: Nova Producer OS

## Vision

Transform `nova-cli` into a **Producer Command Center CLI**. A producer runs `nova` in their project directory and commands a virtual crew of 7 specialist AI agents through a **workspace-scoped, stage-based operating system**.

## The 5 Producer Stages (The Pipeline)

```
1. SLATE      (Development)  → Evaluate development slate, kill dead projects
2. PACKAGE    (Packaging)    → Turn chosen projects into investor-ready materials
3. FINANCE    (Financing)    → Budget models, burn analysis, reallocation playbooks
4. COMPLY     (Compliance)   → EU AI Act, union, legal exposure scans
5. LAUNCH     (Distribution) → Festival strategy, platform fit, campaign drafts
```

Core promise: *Turn fragmented producer work into one context-preserving workflow that gets a project from script to launch-ready setup.*

## The 7 Agents

| Agent | Primary Stage | Artifact Produced |
|---|---|---|
| **Script Analyst** | SLATE | `SCRIPT_COVERAGE.md` |
| **Pre-Viz Director** | PACKAGE | `PITCH_DECK.md` |
| **Casting Scout** | PACKAGE | `CASTING_MATRIX.md` |
| **Location Scout** | PACKAGE | `LOCATION_REPORT.md` |
| **Budget Oracle** | FINANCE | `BUDGET_MODEL.json`, `BURN_REPORT.md` |
| **Compliance Officer** | COMPLY | `COMPLIANCE_REPORT.md` |
| **Distribution Analyst** | LAUNCH | `FESTIVAL_STRATEGY.md`, `PLATFORM_FIT.md` |

**Synthesis Agent** runs at the end of every stage to merge agent outputs into a single stage artifact.

## CLI Command Surface

### Global Navigation
```bash
nova /workspaces              # List workspaces
nova /workspace <name>        # Switch active workspace
nova /dashboard               # Show workspace home dashboard
nova /artifacts               # Browse artifact library
nova /approvals               # Pending approvals
nova /crew                    # Crew status and management
nova /chat                    # Stage-aware chat with context
```

### Stage Commands
```bash
nova /stage slate             # Enter Slate stage overview
nova /stage package           # Enter Package stage overview
nova /stage finance           # Enter Finance stage overview
nova /stage comply            # Enter Compliance stage overview
nova /stage launch            # Enter Launch stage overview
```

### Run Commands
```bash
nova /run slate analyze --slate projects.csv    # Start a Slate run
nova /run package build --script script.pdf     # Start a Package run
nova /run finance model --project "Project X"   # Start a Finance run
nova /run comply scan                           # Start a Compliance run
nova /run launch strategy --project "Project X" # Start a Launch run
nova /run status                                # Show current run steps
nova /run retry                                 # Retry failed steps
```

## Workspace Directory Structure

```
.nova/workspaces/<project-name>/
  workspace.json              # Name, genre, current_stage, created_at
  stage_state.json            # Status per stage: locked | ready | running | done | blocked
  runs/
    run-2026-04-15-001/
      run.json                # run_type, status, started_at, finished_at
      steps/                  # Visible step statuses
        01-slate-analyze.json
        02-script-analyst.json
        ...
  artifacts/                  # Durable outputs
    slate-report-v1.md
    pitch-deck-v1.md
    budget-model-v1.json
    compliance-report-v1.md
    festival-strategy-v1.md
  crew-config.toml            # Which agents are enabled
  approvals/                  # Pending approval requests
```

## Milestone Plan (Test-Driven)

### Phase 0 — Domain Model & Workspace Foundation (Days 1-2)
**Goal:** Typed workspace, stage, run, and artifact models. First tests green.

**Tasks:**
1. Create `rust/crates/runtime/src/producer/` with:
   - `workspace.rs` — `ProducerWorkspace`, `StageState`, `ProducerStage`, `StageStatus`
   - `run.rs` — `ProducerRun`, `RunStep`, `RunStatus`, `StepStatus`
   - `artifact.rs` — `ProducerArtifact`, `ArtifactVersion`
   - `decision_engine.rs` — `suggest_next_action()`
   - `agent_prompts.rs` — `AgentArchetype` enum
   - `mod.rs` — module exports
2. Wire into `runtime/src/lib.rs`.
3. Add tests in `runtime/tests/producer_domain_tests.rs`:
   - `workspace_serializes_and_deserializes()`
   - `stage_progression_slate_unlocks_package()`
   - `decision_engine_suggests_slate_for_empty_workspace()`
4. Run tests: `cargo test -p runtime producer_domain_tests` → green.

**Deliverable:** Compiling runtime with typed producer domain model.

---

### Phase 1 — Workspace Shell Commands & Dashboard (Days 3-4)
**Goal:** Producer can create workspaces and see the dashboard.

**Tasks:**
1. Add commands to `commands/src/lib.rs`:
   - `/workspaces`
   - `/workspace <name>`
   - `/dashboard`
2. Implement CLI dispatch in `nova-cli/src/main.rs`:
   - `handle_workspaces()`
   - `handle_dashboard()`
   - `handle_workspace_create()`
3. Add `DashboardRenderer` in `nova-cli/src/render.rs`.
4. Tests:
   - `create_workspace_scaffolds_directory_tree()`
   - `dashboard_shows_current_stage_and_next_action()`

**Deliverable:** `nova /workspace create "My Film"` works, `nova /dashboard` renders a status board.

---

### Phase 2 — The Slate Stage Run (Days 5-7)
**Goal:** First full stage execution: `/run slate analyze` with 4 agents + synthesis.

**Tasks:**
1. Implement `ProducerPlugin` in `plugins/src/producer_plugin.rs`:
   - `run_slate_analyze` tool
   - Parallel agent spawning (Script Analyst, Market Intel, Budget Oracle, Eulogist)
   - Synthesizer agent
   - Artifact creation and stage unlocking
2. Add `/run slate analyze <file>` command routing.
3. Implement `RunTimelineRenderer` in `nova-cli/src/render.rs`.
4. Tests:
   - `slate_run_spawns_four_agents_and_synthesizer()`
   - `slate_run_creates_slate_report_artifact()`
   - `slate_run_unlocks_package_stage()`
   - Mock parity harness scenario for deterministic slate analysis

**Deliverable:** Producer can run `nova /run slate analyze --slate projects.csv`, watch steps complete, dashboard updates to "Package: Ready."

---

### Phase 3 — Full 7-Agent Stage Registry (Days 8-10)
**Goal:** All 5 stages and 7 agents are wired.

**Tasks:**
1. Write complete system prompts for all 7 agents in `producer/agent_prompts.rs`.
2. Add run tools:
   - `run_package_build`
   - `run_finance_model`
   - `run_comply_scan`
   - `run_launch_strategy`
3. Map agents to stages and artifacts.
4. Tests:
   - `full_pipeline_runs_all_five_stages_sequentially()`
   - Mock parity scenarios for each stage run

**Deliverable:** Full stage pipeline executable from CLI.

---

### Phase 4 — Approval Gates & Failure Recovery (Days 11-12)
**Goal:** Risky steps pause for approval; failed steps can be retried.

**Tasks:**
1. Add `ApprovalRequest` struct and `/approvals` command.
2. Integrate with existing `PermissionPrompter`:
   - Compliance Officer can set `approval_required = true`
3. Add `/run retry` command.
4. Tests:
   - `compliance_run_blocks_on_high_risk_and_creates_approval()`
   - `retry_run_restarts_failed_steps_only()`

**Deliverable:** Approval-aware operating system behavior.

---

### Phase 5 — Cannes Demo Hardening (Days 13-16)
**Goal:** 7-minute demo is deterministic and visually impressive.

**Tasks:**
1. **Demo Workspace:** `examples/cannes-demo-workspace/` with pre-staged state.
2. **Demo Mode:** `nova --demo /dashboard` uses fast/short agent prompts.
3. **Demo Script:** Document exact commands in `docs/cannes-demo.md`.
4. **Terminal Polish:**
   - Animated progress bars during runs (using `crossterm`)
   - Color-coded stage cards
   - Auto-suggested next command highlighted
5. **CI:** All producer tests run in `cargo test --workspace`.

**Deliverable:** Anyone can `cd examples/cannes-demo-workspace && nova /dashboard` and see a compelling demo.

## Architecture Principles

1. **Stage-locked progression** — Can't skip stages.
2. **Artifacts are source of truth** — Chat is ephemeral; files are durable.
3. **One command, one decision** — Every command leaves the producer knowing what happened and what to type next.
4. **Fail visibly** — Failed steps show red, dashboard shows "Blocked."
5. **Agent isolation** — Each agent runs in its own OS thread with fresh `ConversationRuntime`.
6. **Taste as code** — Producer preferences live in `workspace.json` and flow into every agent prompt.
