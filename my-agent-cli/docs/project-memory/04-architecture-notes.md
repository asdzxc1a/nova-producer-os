# Architecture Notes: Codebase Deep Dive

## Repository Structure

```
my-agent-cli/
├── rust/
│   ├── Cargo.toml                    # Workspace root
│   └── crates/
│       ├── api/                      # LLM provider abstractions, auth, SSE streaming
│       ├── commands/                 # Slash command definitions and parsing
│       ├── compat-harness/           # Testing and parity helpers
│       ├── mock-anthropic-service/   # Deterministic mock LLM service for tests
│       ├── plugins/                  # Plugin loader, hook pipeline, bundled plugins
│       ├── runtime/                  # Agent lifecycle, tool dispatch, sessions, MCP
│       ├── nova-cli/                 # Main CLI binary (was rusty-claude-cli)
│       ├── telemetry/                # Event streaming and metrics
│       └── tools/                    # Tool definitions (ReadFile, Shell, Agent, WriteFile, etc.)
├── src/                              # Python/reference workspace (companion)
├── tests/                            # Audit helpers
└── docs/
```

## Key Architectural Patterns

### 1. Subagent Spawning

**File:** `rust/crates/tools/src/lib.rs`

The `Agent` tool is defined in `mvp_tool_specs()` (lines ~571-587). When called:

```
run_agent() → execute_agent() → execute_agent_with_spawn()
```

`execute_agent_with_spawn()`:
- Creates an `agent_id`
- Sets up a file store in `.clawd-agents/` (or `CLAWD_AGENT_STORE`)
- Spawns a dedicated OS thread named `clawd-agent-{agent_id}`
- The thread builds a `ConversationRuntime<ProviderRuntimeClient, SubagentToolExecutor>`
- Runs one turn capped at 32 iterations
- Persists results to:
  - `{agent_id}.md` — human-readable output
  - `{agent_id}.json` — machine-readable manifest with status, error, derivedState

**Critical insight:** There is **no in-memory channel** between parent and subagent. Communication is file-based.

### 2. Task Registry

**File:** `rust/crates/runtime/src/task_registry.rs`

- Thread-safe in-memory registry: `Arc<Mutex<HashMap<String, Task>>>`
- Tracks background tasks with:
  - `task_id`, `prompt`, `status` (Created/Running/Completed/Failed/Stopped)
  - `messages`, `output`, `team_id`
- Separate from the Agent subsystem
- Backs the `TaskCreate/Get/List/Stop/Update/Output` tools
- Team and Cron registries live in `team_cron_registry.rs`

### 3. Conversation Runtime & Turn Loop

**File:** `rust/crates/runtime/src/conversation.rs`

`ConversationRuntime<C: ApiClient, T: ToolExecutor>`:
- **`run_turn()`** (lines 314-515) is the core loop:
  1. Push user text to `Session`
  2. Loop up to `max_iterations`:
     a. Build `ApiRequest` from `session.messages`
     b. Stream via `api_client.stream(request)`
     c. `build_assistant_message(events)` → `ContentBlock`s
     d. Push assistant message
     e. If `ToolUse` blocks exist:
        - Run pre-tool-use hook
        - Evaluate permission policy
        - Call `tool_executor.execute(tool_name, effective_input)`
        - Run post-tool-use hook
        - Push `ToolResult` to session
  3. Auto-compact if token threshold exceeded
  4. Return `TurnSummary`

### 4. Permission & Safety Layers

**Permission System:** `rust/crates/runtime/src/permissions.rs`
- `PermissionMode`: `ReadOnly < WorkspaceWrite < DangerFullAccess < Prompt < Allow`
- `PermissionPolicy::authorize_with_context()` — full evaluation flow
- `PermissionPrompter` for interactive approval

**Permission Enforcer:** `rust/crates/runtime/src/permission_enforcer.rs`
- `PermissionEnforcer::check()`
- `check_file_write()` — workspace boundary enforcement
- `check_bash()` — read-only gating

**Bash Validation:** `rust/crates/runtime/src/bash_validation.rs`
- `validate_command()` — runs mode, sed, destructive, and path validations
- `validate_read_only()` — blocks write commands, state modifiers, git mutations
- `check_destructive()` — warns on `rm -rf`, `mkfs`, fork bombs
- `classify_command()` — semantic intent classifier

### 5. File Operations

**File:** `rust/crates/runtime/src/file_ops.rs`

- `read_file(path, offset, limit)` — up to 10MB, rejects binary (NUL detection)
- `write_file(path, content)` — up to 10MB, auto-creates parents
- `edit_file(path, old, new, replace_all)` — string replacement
- `glob_search(pattern, path)` — brace expansion, 100 result cap
- `grep_search(input)` — regex with context lines, file type filters
- Workspace-boundary variants: `read_file_in_workspace()`, `write_file_in_workspace()`, `edit_file_in_workspace()`

### 6. MCP Integration

**MCP Utilities:** `rust/crates/runtime/src/mcp.rs`
- `mcp_tool_prefix()`, `mcp_tool_name()`, `normalize_name_for_mcp()`

**MCP Stdio Transport:** `rust/crates/runtime/src/mcp_stdio.rs`
- `McpServerManager` — manages `BTreeMap<String, ManagedMcpServer>`
- `from_servers()` — initializes stdio transports
- `discover_tools()` / `call_tool()` — JSON-RPC stdio with retry logic
- `shutdown()` — terminates child processes

**MCP Tool Bridge:** `rust/crates/runtime/src/mcp_tool_bridge.rs`
- `McpToolRegistry` — client registry
- `spawn_tool_call()` — spawns dedicated thread with Tokio runtime for async MCP lifecycle

**MCP Server (hosting side):** `rust/crates/runtime/src/mcp_server.rs`
- Exposes Nova as an MCP server to other clients

### 7. Plugin System

**File:** `rust/crates/plugins/src/lib.rs`

- `PluginRegistry` — loads `plugin.json` (or `.claude-plugin/plugin.json`)
- `build_plugin_manifest()` — validation
- `PluginManager::plugin_registry_report()` — discovers builtin, bundled, installed, external
- Plugin **tools** work: `PluginTool::execute()` spawns plugin executable
- Plugin **commands** (slash commands) are parsed but **currently rejected** by CLI — we will need to enable or route them differently for producer commands

### 8. Command Surface

**Definitions:** `rust/crates/commands/src/lib.rs`
- `SLASH_COMMAND_SPECS` table (lines 59-1037)
- `SlashCommand` enum parsed by `validate_slash_command_input()`

**Dispatch:** `rust/crates/nova-cli/src/main.rs`
- `LiveCli::handle_repl_command()` — giant `match` on parsed slash commands
- `run_repl()` reads input, calls `SlashCommand::parse()`, dispatches
- `STUB_COMMANDS` — unimplemented commands filtered from help

### 9. Session & Persistence

**File:** `rust/crates/runtime/src/session.rs`

- `Session` — persisted conversational state
  - `messages: Vec<ConversationMessage>`
  - `workspace_root: Option<PathBuf>`
  - Incremental JSONL writes via `push_message()`
  - Atomic save with log rotation
- `ConversationMessage` — roles: System, User, Assistant, Tool
- `ContentBlock` — Text, ToolUse, ToolResult

### 10. Testing Infrastructure

**Mock Parity Harness:** `rust/crates/nova-cli/tests/mock_parity_harness.rs`
- Reproducible clean-environment CLI harness
- Scripted scenarios with captured `/v1/messages` requests
- Scenarios: `streaming_text`, `read_file_roundtrip`, `grep_chunk_assembly`, `write_file_allowed`, `write_file_denied`, `multi_tool_turn_roundtrip`, `bash_stdout_roundtrip`, `bash_permission_prompt_approved`, `bash_permission_prompt_denied`, `plugin_tool_roundtrip`

**Mock Anthropic Service:** `rust/crates/mock-anthropic-service/src/main.rs`
- Deterministic Anthropic-compatible mock service
- Returns scripted responses for tests

**Compat Harness:** `rust/crates/compat-harness/src/lib.rs`
- Helpers for upstream integration testing

## Where Our Code Will Live

### Phase 0 (Domain Models)
- `rust/crates/runtime/src/producer/` — NEW directory
- `rust/crates/runtime/src/lib.rs` — add `pub mod producer;`
- `rust/crates/runtime/tests/producer_domain_tests.rs` — NEW

### Phase 1 (Commands & Dashboard)
- `rust/crates/commands/src/lib.rs` — add `/workspaces`, `/workspace`, `/dashboard`
- `rust/crates/nova-cli/src/main.rs` — dispatch handlers
- `rust/crates/nova-cli/src/render.rs` — `DashboardRenderer`
- `rust/crates/nova-cli/tests/producer_workspace_e2e.rs` — NEW

### Phase 2 (Slate Run)
- `rust/crates/plugins/src/producer_plugin.rs` — NEW
- `rust/crates/plugins/src/lib.rs` — register producer plugin
- `rust/crates/nova-cli/src/render.rs` — `RunTimelineRenderer`
- `rust/crates/nova-cli/tests/producer_slate_e2e.rs` — NEW
- `rust/crates/nova-cli/tests/mock_parity_harness.rs` — extend with slate scenario

### Phase 3 (Full Registry)
- `rust/crates/runtime/src/producer/agent_prompts.rs` — full prompts
- `rust/crates/plugins/src/producer_plugin.rs` — all run tools
- `rust/crates/nova-cli/tests/producer_pipeline_e2e.rs` — NEW

## Build & Test Commands

```bash
cd rust

# Check workspace compiles
cargo check --workspace

# Run all tests
cargo test --workspace

# Run specific test
cargo test -p runtime producer_domain_tests
cargo test -p nova-cli producer_workspace_e2e

# Run with mock parity
cargo test -p nova-cli --test mock_parity_harness
```
