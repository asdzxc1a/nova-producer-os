# Producer OS Desktop App — Redesign Status

> Last updated: 2026-04-16  
> Branch: `main`  
> App path: `producer-app/` (Tauri v2 + React 19 + TypeScript + Vite + Tailwind CSS 4)

---

## 1. What Was Done

### Cinematic UI Theme
- Deep gradient background (`#020617` base)
- Glassmorphism cards (`.glass`, `.glass-strong` with backdrop blur)
- Custom keyframe animations: `fadeIn`, `slideInRight`, `pulse-glow`, `shimmer`, `float`
- Gradient accents (cyan → violet) and professional typography

### Components Rebuilt / Created
| File | Purpose |
|------|---------|
| `src/pages/WorkspaceSelector.tsx` | Hero landing, demo quick-start, resume last workspace, workspace list |
| `src/pages/Dashboard.tsx` | Pipeline view, stats row, next-action banner, 5-stage visual connectors, drag-and-drop file inputs |
| `src/components/PipelineCard.tsx` | Stage cards with status glows, current-stage badge, run controls |
| `src/components/RunModal.tsx` | Live execution modal with gradient progress bar, polling agent steps |
| `src/components/ArtifactViewer.tsx` | Slide-over markdown/JSON viewer with syntax styling |
| `src/components/ToastContainer.tsx` | Global toast stack (success / error / info) |
| `src/hooks/useToast.ts` | Toast state manager |
| `src/hooks/useLocalStorage.ts` | `localStorage` ↔ React state sync |

### Key Features Added
- **Workspace persistence**: last opened workspace is remembered in `localStorage`; app auto-resumes on launch
- **Drag-and-drop files**: Package, Finance, and Launch stages accept file drops + browse fallback
- **Toast notifications**: user feedback across workspace selection and dashboard actions
- **Stage icons**: real Lucide icons mapped to each pipeline stage (Script, Briefcase, TrendingUp, ShieldCheck, Rocket)

---

## 2. What Was Verified

| Check | Result |
|-------|--------|
| Vite dev server renders correctly | ✅ Confirmed via headless browser screenshots |
| `npm run tauri build` succeeds | ✅ Multiple successful builds |
| macOS `.app` bundle produced | ✅ `src-tauri/target/release/bundle/macos/Producer OS.app` |
| macOS `.dmg` produced | ✅ `src-tauri/target/release/bundle/dmg/Producer OS_0.1.0_aarch64.dmg` |
| UI interactions (hover, modals, toasts) | ✅ Verified in dev-server screenshots |

---

## 3. Current Issue

**Text appears dark / hard to read inside the built native `.app`, while it looks correct in the Vite dev server.**

- In the headless browser against `http://localhost:5173`, `getComputedStyle(document.body).color` returns `rgb(241, 245, 249)` (correct slate-100).
- In the built `.app`, screenshots show body text staying near black/dark instead of the expected light color.

### Fix Already Applied
- Changed `body { background: radial-gradient(...) }` to `background-color: #020617` in `src/index.css` to resolve a black-background rendering bug in the native WebView.

### Root Cause (Found & Fixed)
**Tailwind v4 utility classes were not being generated in the production build.**

The `vite.config.ts` was missing the `@tailwindcss/vite` plugin. Without it, the `@import "tailwindcss"` directive in `src/index.css` was not fully processed during `vite build`. The minified CSS contained an unprocessed `@layer utilities{@tailwind utilities;}` directive, meaning **zero** Tailwind utility classes (`text-slate-100`, `bg-slate-950`, `flex`, `p-6`, etc.) existed in the production bundle. The app only rendered correctly in the Vite dev server because Vite’s dev-time HMR handles CSS transforms differently.

### Fix Applied
1. Installed `@tailwindcss/vite@^4.1.3` as a dev dependency.
2. Added `tailwindcss()` to the `plugins` array in `vite.config.ts`.
3. Rebuilt the app. The production CSS grew from ~25 kB to **48 kB**, confirming all missing utilities were now generated.

### Verification
- Native `.app` screenshot confirms the cinematic dark theme, gradient text, glassmorphism cards, and proper layout/spacing are all rendering correctly.
- Text colors are light (`slate-100`, `slate-200`, `slate-300`, `slate-400`) against the dark gradient background.

---

## 4. What Was Tried

- Added explicit `:root` CSS custom properties for `color-slate-100` and `color-slate-300`.
- Verified the minified CSS in `dist/assets/` includes those `:root` definitions.
- Re-ran `npm run tauri build` (which internally re-runs `npm run build`).
- Took screenshots of the built `.app` — still showing dark text.
- Used `* { color: #f1f5f9 !important; }` as a diagnostic hack; text turned white, confirming a CSS cascade issue.
- Discovered that **no Tailwind utility classes** (`flex`, `text-slate-100`, `bg-slate-950`, etc.) were present in the production CSS.
- Installed and configured `@tailwindcss/vite`, rebuilt, and verified utilities are now generated.

---

## 5. Final Verification

- `npm run tauri build` succeeds and produces both `.app` and `.dmg` bundles.
- Screenshot of the native app shows the WorkspaceSelector with correct colors, layout, and effects.
- CSS file size increased from ~25 kB → 48 kB, confirming utility generation.
- Build timestamp matches the latest code changes.

---

## 6. Pre-existing Issues (Unrelated)

Rust test failures that existed before this frontend work:
- `runtime/src/config.rs:1989` — `config::tests::validates_unknown_top_level_keys_with_line_and_field_name`
- `crates/nova-cli/src/main.rs:9785` — `tests::parses_direct_agents_mcp_and_skills_slash_commands` (`DangerFullAccess` vs `ReadOnly` mismatch)

These do **not** block the producer app build or bundle creation.
