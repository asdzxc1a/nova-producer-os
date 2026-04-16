# Cook.ai Pattern Reference: CLI Translation

## What Cook.ai Is

Cook.ai (from the analyzed PRD and App Map) is a **workspace-scoped GTM operating system** with a web UI. It helps operators move a business through stages:

```
Truth → Offer → Attention → Launch → Integrations/Ops
```

## Core Patterns We Are Stealing

### Pattern 1: Workspace as Container
**Cook:** Every business gets a workspace with its own stage state, artifacts, connectors, and history.  
**Nova Translation:** Every film project gets a workspace in `.nova/workspaces/<name>/`.

### Pattern 2: Stage-Based Operating Model
**Cook:** Main flow is Truth → Offer → Attention → Launch. Later stages inherit prior truth.  
**Nova Translation:** Main flow is Slate → Package → Finance → Comply → Launch. Each stage consumes artifacts from prior stages.

| Cook Stage | Nova Stage | What Happens |
|---|---|---|
| Truth | Slate | Research and evaluation (slate analysis, script coverage) |
| Offer | Package | Turn research into sellable package (pitch deck, casting) |
| Attention | Finance + Comply | Prepare for market (budget, compliance checks) |
| Launch | Launch | Execute distribution strategy (festivals, platforms) |

### Pattern 3: Runs and Run Steps
**Cook:** Every workflow execution is a "run" with visible steps, status, logs, and outputs.  
**Nova Translation:** Every agent execution is a `ProducerRun` with `RunStep`s tracked in the CLI.

**Cook UI:**
```
[✓] clarify business and niche
[✓] gather evidence
[▶] competitor analysis
[○] pain and objection synthesis
```

**Nova CLI:**
```
Run: slate-analyze-001
Status: RUNNING

[✓] 01: script_analyst        (45s)
[✓] 02: market_intel          (52s)
[▶] 03: budget_oracle         (running)
[○] 04: eulogist              (pending)
[○] 05: synthesizer           (pending)
```

### Pattern 4: Artifacts Over Chat
**Cook:** "Artifacts matter more than chat transcripts." Every meaningful output is a durable, inspectable object.  
**Nova Translation:** Agents write to `.md` and `.json` files in the workspace `artifacts/` directory. Chat (`/chat`) is an accessory.

### Pattern 5: One Decision Leads to Next
**Cook:** Every screen answers: "what exists," "what stage are we in," "what should happen next."  
**Nova Translation:** The `/dashboard` command always renders:
- Stage progress bar
- Recent artifacts
- Active crew tasks
- **➜ NEXT: `nova /run ...`** suggestion

### Pattern 6: Approval Gates
**Cook:** Risky external writes require approval. Drafts → Summaries → Approval → Action.  
**Nova Translation:** Integration with existing `PermissionPrompter`. When Compliance Officer finds high risk, CLI shows:

```
⚠ APPROVAL REQUIRED
Step: compliance_officer
Risk: EU AI Act disclosure missing.
[Approve] [Reject] [Revise]
```

### Pattern 7: Failure Visibility
**Cook:** "Failures must be visible and repairable." The user can see what failed and retry.  
**Nova Translation:** Failed run steps show red in `/run status`. Dashboard shows stage as `Blocked`. `/run retry` restarts failed steps only.

### Pattern 8: Dark Operator Console
**Cook:** Dark UI, stage progression cards, status badges, control language.  
**Nova Translation:** Use `crossterm` styling in terminal:
- Green checkmarks for Done
- Yellow arrows for Running
- Gray circles for Locked
- Red exclamation for Blocked
- Unicode progress bars

## Screen-to-Command Mapping

| Cook Screen | Nova Command | Purpose |
|---|---|---|
| Workspace switcher | `/workspaces` | List/select workspaces |
| Workspace home dashboard | `/dashboard` | Show operating state |
| Business setup | `nova init --producer` | Scaffold workspace |
| Truth stage overview | `/stage slate` | Slate stage summary |
| Truth run workspace | `/run slate analyze` | Execute slate analysis |
| Research artifact viewer | `cat artifacts/slate-report-v1.md` | Inspect artifact |
| Offer stage overview | `/stage package` | Package stage summary |
| Offer run workspace | `/run package build` | Generate pitch materials |
| Attention stage overview | `/stage finance` + `/stage comply` | Financing & compliance |
| Launch stage overview | `/stage launch` | Distribution strategy |
| Approval review screen | `/approvals` | Review pending approvals |
| Documents / artifacts library | `/artifacts` | Browse all artifacts |
| Workspace chat | `/chat` | Stage-aware conversation |
| Connector settings | `/connectors` | Manage external AI services |

## Deterministic vs AI Responsibilities

### Deterministic (System Code)
- Workspace ownership and routing
- Stage progression and unlocking
- Run lifecycle and step status
- Artifact versioning and persistence
- Approval state
- Failure and retry behavior
- Launch gating

### AI-Assisted (Agent Prompts)
- Synthesizing script coverage
- Recommending opportunities
- Drafting pitch concepts
- Generating budget suggestions
- Drafting landing pages and ad copy
- Explaining failure causes

**Hard Rule:** AI returns structured outputs that the system stores. AI is NOT the source of truth for workflow state.

## Context Inheritance Flow

**Nova:**
```
Slate report (SLATE_REPORT.md)
    ↓
Package run reads SLATE_REPORT.md → produces PITCH_DECK.md, CASTING_MATRIX.md
    ↓
Finance run reads PITCH_DECK.md → produces BUDGET_MODEL.json
    ↓
Comply run reads all prior artifacts → produces COMPLIANCE_REPORT.md
    ↓
Launch run reads all prior artifacts → produces FESTIVAL_STRATEGY.md
```

## The Decision Engine Logic

The dashboard suggestion logic mimics Cook's "recommended next action":

```rust
match current_stage_status {
    Slate(Locked) => "/workspace create <name>",
    Slate(Ready) => "/run slate analyze --slate <file>",
    Slate(Running) => "/run status",
    Slate(Done) => "/stage package",
    Slate(Blocked) => "/run retry",
    
    Package(Locked) => panic!("should not happen"),
    Package(Ready) => "/run package build --script <file>",
    Package(Running) => "/run status",
    Package(Done) => "/stage finance",
    Package(Blocked) => "/approvals",
    
    // ... etc for Finance, Comply, Launch
}
```

## Run Step State Machine

Each `RunStep` follows:

```
Pending → Running → Completed
                ↘ Failed
```

A `ProducerRun` is:
- `Created` → when initialized
- `Running` → when first step starts
- `Completed` → when all steps complete
- `Failed` → when any step fails and is not retryable

## Approval Request State Machine

```
Requested → Approved → Action Executed
          → Rejected → Run Blocked
          → Revise   → Run Returns to Running
```
