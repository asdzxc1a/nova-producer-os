# Agent Guidance

This file contains project-specific guidance for AI coding agents working in this repository.

## How This File Works

If you are reading this, you are an AI agent (Kimi, Claude, or another assistant) working on this project. This file persists across all sessions. When you encounter tasks related to:
- Tailwind CSS configuration
- Taking screenshots of native macOS apps
- Building or testing the Producer OS desktop app

**Read this file first.** It contains hard-won operational knowledge that will save significant debugging time.

---

## Repository Overview

- `rust/` — Rust workspace containing the CLI and runtime implementation.
- `src/` — Source files that should stay consistent with generated guidance and tests.
- `tests/` — Validation surfaces that should be reviewed alongside code changes.
- `producer-app/` — Tauri v2 desktop application (React 19 + TypeScript + Vite + Tailwind CSS 4).

## Producer App (`producer-app/`)

### Critical Build Requirement: Tailwind CSS v4

`vite.config.ts` **must** include the `@tailwindcss/vite` plugin:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  // ...
});
```

**What happens without it:** `vite build` will **silently fail to generate Tailwind utility classes** in production. The minified CSS will contain an unprocessed `@layer utilities{@tailwind utilities;}` directive. The built native `.app` will have broken layout, missing colors, and broken spacing, even though the Vite dev server (`npm run dev`) looks perfectly fine.

**How to verify the fix worked:** The production CSS file (`dist/assets/index-*.css`) should be ~45–50 kB or larger and must contain actual utility classes like `.flex`, `.text-slate-100`, `.bg-slate-950`, etc.

### LLM Backend Setup

The app now calls the **Google Gemini API directly via HTTP** (no CLI subprocess required).

**Required environment variable:**
```bash
export GEMINI_API_KEY="your-key-here"
```

**Optional environment variable:**
```bash
export GEMINI_MODEL="gemini-2.5-pro"  # default
# OR fallback if Pro quota is exceeded:
export GEMINI_MODEL="gemini-2.5-flash"
```

**How to get an API key via gcloud:**
```bash
# List existing keys
gcloud alpha services api-keys list --project=YOUR_GCP_PROJECT

# Get the key string
gcloud alpha services api-keys get-key-string KEY_ID --project=YOUR_GCP_PROJECT
```

**Note:** The `gws-workspace-zorepad` project already has a key (`nova-producer-os-gemini`), but its free-tier quota for `gemini-2.5-pro` is currently exhausted. Use `gemini-2.5-flash` for testing.

### Build & Bundle

```bash
cd producer-app && npm run tauri build
```

Produces:
- `producer-app/src-tauri/target/release/bundle/macos/Producer OS.app`
- `producer-app/src-tauri/target/release/bundle/dmg/Producer OS_0.1.0_aarch64.dmg`

### Testing the Native App on macOS

**Taking screenshots:**
- Use `screencapture /tmp/file.png` for reliable full-screen captures.
- **Do NOT rely on** AppleScript window capture (`screencapture -l$(osascript -e '...')`) — it requires accessibility permissions that are **not granted** in this environment and will fail with "oscript is not allowed assistive access (-1719)".
- `cliclick` is installed but also requires accessibility permissions; most actions will fail.

**Clear WebView caches before testing a fresh build** to avoid stale CSS/JS:
```bash
rm -rf ~/Library/WebKit/Producer\ OS
rm -rf ~/Library/Caches/Producer\ OS
rm -rf ~/Library/Saved\ Application\ State/com.producer-os.app.savedState
```

### Typical Verification Flow After CSS Changes

1. Make CSS/TSX changes in `producer-app/src/`
2. Run `cd producer-app && npm run tauri build`
3. Kill any running instance: `pkill -f "Producer OS.app"`
4. Clear WebView caches (commands above)
5. Set API key: `export GEMINI_API_KEY="..."`
6. Launch: `open "producer-app/src-tauri/target/release/bundle/macos/Producer OS.app"`
7. Bring to front: `open -a "Producer OS"`
8. Screenshot: `screencapture /tmp/producer-os-check.png`

## General Verification Commands

- Rust workspace (from `rust/`):
  ```bash
  cargo fmt
  cargo clippy --workspace --all-targets -- -D warnings
  cargo test --workspace
  ```
- TypeScript check (from `producer-app/`):
  ```bash
  npx tsc --noEmit
  ```
