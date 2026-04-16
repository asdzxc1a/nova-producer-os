# Project Overview: Nova Producer OS

## What This Project Is

**Nova Producer OS** is a CLI-native, stage-based operating system for film and television producers. It transforms the `nova-cli` codebase (a fork of `ultraworkers/claw-code`) from a coding agent harness into a **producer command center** where a user commands a virtual crew of 7 specialist AI agents.

## Origin Story

1. **The Base Repo:** `ultraworkers/claw-code` (184K+ stars on GitHub) — a Rust workspace implementing an agent harness with subagents, task registry, permissions, MCP, and a deterministic mock parity harness.
2. **The Fork:** We forked it to `asdzxc1a/my-agent-cli` and performed a full rebrand (Claw Code → Nova, rusty-claude-cli → nova-cli, binary `claw` → `nova`).
3. **The Pivot:** After analyzing extensive Cannes Film Festival research and the Cook.ai stage-based operating system pattern, we decided to build a **producer OS** instead of a generic agent CLI.

## Key Decisions Already Made

### Decision 1: Hard Fork & Rebrand (Done)
- Forked `ultraworkers/claw-code` → `asdzxc1a/my-agent-cli`
- Rebranded: `Claw Code` → `Nova`, `rusty-claude-cli` → `nova-cli`, `claw` → `nova`
- Removed tracked local artifacts (`.claude/sessions`, `.claw/sessions`, `.clawd-todos.json`)
- Verified `cargo check --workspace` passes after rebrand
- Pushed clean `main` branch with commit `8f7dddc`

### Decision 2: Full 7-Agent Crew (Approved)
We are NOT building just one tool. We are building a **virtual production crew** of 7 agents:
1. Script Analyst
2. Pre-Viz Director
3. Casting Scout
4. Location Scout
5. Budget Oracle
6. Compliance Officer
7. Distribution Analyst

### Decision 3: Cook-Inspired Stage-Based Architecture (Approved)
We translated Cook.ai's web-based stage flow into a **CLI-native state machine**:

```
SLATE (Development) → PACKAGE (Packaging) → FINANCE (Financing) → COMPLY (Compliance) → LAUNCH (Distribution)
```

- **Workspace-scoped:** Every film project gets a workspace in `.nova/workspaces/<name>/`
- **Stage-locked progression:** Can't skip from Slate to Launch
- **Run + RunStep visibility:** Every agent execution is a tracked run with named steps
- **Artifacts over chat:** Outputs are durable `.md` and `.json` files
- **Decision engine:** Dashboard always suggests the next command
- **Approval gates:** Risky actions pause for human approval

## Core Promise

> *Turn fragmented producer work into one context-preserving workflow that gets a project from script to launch-ready setup.*

## Target User

Film and TV producers who:
- Are founder-led and bottlenecked by their own decision-making capacity
- Know AI is important but don't have an orchestration layer
- Need to scale from 1-2 projects to a slate-driven operation
- Will be pitching this at Cannes Film Festival (May 12-20, 2026)

## Cannes Connection

This project is being built to demo at the Cannes Film Festival, specifically targeting:
- **Cannes Next "AI for Talent Summit"** (May 15-16)
- **Village Innovation** exhibition space
- The user (Dmytro Potmalnykov) has a Cannes 2008 win (*Everybody Dies But Me* — Prix Regards Jeune)

## Technology Stack

- **Language:** Rust (2021 edition)
- **Workspace:** 9 crates (api, commands, compat-harness, mock-anthropic-service, plugins, runtime, nova-cli, telemetry, tools)
- **CLI Framework:** Custom REPL in `nova-cli/src/main.rs` using `crossterm`, `rustyline`, `pulldown-cmark`
- **Async Runtime:** Tokio
- **Testing:** Mock parity harness with deterministic Anthropic-compatible mock service
- **Agent Spawning:** OS threads via `spawn_agent_job()` in `tools/src/lib.rs`
- **Task Tracking:** `TaskRegistry` in `runtime/src/task_registry.rs`
- **Permissions:** `PermissionEnforcer` + `bash_validation` in `runtime/src/`
