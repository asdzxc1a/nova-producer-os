# Next Steps: Nova Producer OS

> **Status as of 2026-04-15:** Phase 5 (Cannes Demo Hardening) is **COMPLETE and PUSHED**.  
> When resuming, read `docs/project-memory/10-session-handoff.md` first.

---

## TOMORROW START HERE

1. Read `docs/project-memory/10-session-handoff.md` for the full end-of-day summary.
2. Verify state: `cd my-agent-cli && git log --oneline -1` should show `02fdb38`.
3. Run `cd my-agent-cli/rust && cargo test --workspace` to confirm everything still passes.
4. Pick your next priority from the list below.

---

## Completed Today (Phase 5) ✅

- ✅ Fix pre-existing `CARGO_BIN_EXE_claw` → `CARGO_BIN_EXE_nova` test regression in all nova-cli integration tests
- ✅ Add animated progress bars to `/run` with real-time agent completion tracker and synthesis progress bar
- ✅ Finalize demo workspace with realistic pre-staged artifacts (`SLATE_REPORT.md`, `PITCH_DECK.md`, `BUDGET_MODEL.json`)
- ✅ Update `docs/cannes-demo.md` to match exact commands and expected output
- ✅ Full CI verification: `cargo check --workspace`, `cargo build -p nova-cli`, `cargo test --workspace` all green
- ✅ Commit and push Phase 5 completion (`02fdb38` on `main`)

---

## Medium Priority (Post-Cannes — Pick One)

### 1. Retry Logic
- Implement real `/run retry` behavior: reload last run JSON, identify failed/blocked steps, re-run only those agents, re-synthesize
- **Files to touch:** `rust/crates/nova-cli/src/main.rs`, `rust/crates/tools/src/producer_plugin.rs`

### 2. Approval Resolution
- Add `/approvals approve <id>` and `/approvals reject <id>` commands
- Wire approval resolution into compliance scan so approved runs proceed to synthesis and stage completion
- **Files to touch:** `rust/crates/commands/src/lib.rs`, `rust/crates/nova-cli/src/main.rs`, `rust/crates/tools/src/producer_plugin.rs`

### 3. Agent Prompt Injection
- Move agent system prompts from stubs to real, production-ready prompts in `agent_prompts.rs`
- Integrate with actual LLM calls via the existing `Agent` tool mechanism (currently agents are simulated threads)
- **Files to touch:** `rust/crates/runtime/src/producer/agent_prompts.rs`, `rust/crates/tools/src/producer_plugin.rs`

### 4. External Integrations
- Connect Distribution Analyst to web search (`web_search` tool)
- Connect Pre-Viz Director to image generation MCP tools
- **Files to touch:** `rust/crates/tools/src/producer_plugin.rs`

---

## Architecture Reminders

- **Always run tests after changes:**
  ```bash
  cargo test -p runtime --test producer_domain_tests
  cargo test -p tools --test producer_slate_e2e
  cargo test -p tools --test producer_pipeline_e2e
  cargo test -p tools --test producer_approval_e2e
  ```
- **Commit message format:** `feat(producer): <description>`
- **Git remote:** `https://github.com/asdzxc1a/my-agent-cli.git`
- **Project root:** `my-agent-cli/`
- **Build command:** `cd my-agent-cli/rust && cargo build -p nova-cli`
- **Binary path:** `my-agent-cli/rust/target/debug/nova`
