# Change Spec: Minimal Site + Interactive Debugging Demo

## Summary
Revise the Agent Debugger site to a minimal, focused experience that centers on a single interactive demo illustrating the debugging pipeline end-to-end:
1) Extension launches the target program in debug mode.
2) Extension collects execution stack, frame context, and variables.
3) Extension formats the context and injects it into the user’s coding copilot prompt (including where/when the break occurred and program state).
4) The coding agent proposes a fix without spurious code generation or hardcoded test-passing.

---

## Goals
- Reduce site to essential surfaces (hero + demo + minimal doc links).
- Make the interactive demo the primary explanation of value.
- Demonstrate an opinionated, safe debugging prompt handoff that avoids hallucinated rewrites.
- Keep performance high (static export, minimal JS), no auth or server required.

## Non-Goals
- No live connection to users’ editors.
- No full API reference rewritten in this change (link to existing docs).
- No marketplace publishing workflow changes.

---

## Information Architecture (After)
- `/` Home (hero + interactive demo)
- `/quickstart` (minimal 5-step guide)
- `/docs` (links to Agent API and Examples; no expanded feature page)
- `/privacy` (unchanged)
- `/changelog` (unchanged)

Remove: `/docs/features`, `/faq`, `/support` pages from the top-level nav. Provide links to issues in footer only.

---

## UX Changes

### Hero
- Headline: “Debug through your AI’s eyes.”
- Subhead: “Launch, capture, explain, and fix with surgical minimalism.”
- Two CTAs: “Run Demo” (scrolls to demo), “Quickstart”.
- Background: dark minimal, cyan accent. No carousel. 60–90vh.

### Interactive Demo (Primary Module)
A single panel with stepper + live terminal-like feed and a compact “copilot prompt” viewer.

**Demo Steps (user-controllable, with autoplay):**
1. **Launch**: “Extension starts target in debug mode.”
2. **Capture**: “Call stack and locals collected per frame.”
3. **Format & Inject**: “Context compiled into structured prompt and injected into copilot.”
4. **Agent Fix**: “Agent proposes minimal non-hallucinatory patch.”

**Panels:**
- **Event Stream**: synthetic terminal log (autotypes with replay controls).
- **State Inspector**: JSON view of frames, locals, and exception site (collapsible nodes).
- **Prompt Builder**: formatted prompt preview (markdown/plaintext), with guardrails (constraints listed at top).
- **Patch Preview**: minimal diff with reasons.

**Controls:**
- Play/Pause, Next/Back step.
- Speed (0.5×, 1×, 2×).
- Reset.
- Toggle “Show JSON” for raw objects.
- Copy buttons for Prompt and Patch.

**Guardrails shown in Prompt Builder:**
- “Do not add unrelated code or large refactors.”
- “No hardcoding constants to satisfy tests.”
- “Limit change set to ≤ N lines per file.”
- “Explain failure location and chosen fix in ≤ 4 bullets.”

---

## Demo Data & Simulation

**Data model (TypeScript):**
```ts
type FrameVar = { name: string; type: string; value: string };
type Frame = { id: string; file: string; line: number; fn: string; locals: FrameVar[] };
type DebugSnapshot = {
  timestamp: string;
  program: { cmd: string; args: string[] };
  event: "launch" | "breakpoint" | "exception" | "step" | "finish";
  activeFrameId?: string;
  frames: Frame[];
  message?: string;
};
type PromptPayload = {
  failure: { file: string; line: number; message: string };
  frames: Frame[];
  constraints: string[];
  repoContext?: { files: { path: string; digest: string }[] };
};
type PatchSuggestion = {
  diff: string; // unified diff
  rationale: string[]; // short bullet points
};
```

**Static assets:**
- `demo/snapshots.json` – sequence of `DebugSnapshot` objects.
- `demo/prompt.json` – single `PromptPayload` assembled from snapshots.
- `demo/patch.diff` – minimal fix diff.

**Simulation rules:**
- No network calls. All demo content local.
- Deterministic playback. Step transitions drive terminal output and panel updates.
- Optional seed switch for 2–3 alternate failure scenarios (e.g., null access, off-by-one, file not found).

---

## Component Changes

**New/Updated Components:**
- `DemoStepper` – step navigation, progress, controls.
- `EventStream` – terminal-like feed with typewriter effect.
- `StateInspector` – collapsible JSON viewer (virtualized for performance).
- `PromptBuilder` – formatted prompt with copy; shows constraints.
- `PatchPreview` – diff viewer with copy.

**Removed/Hidden Components:**
- Feature cards and timeline from the old layout.
- FAQ/support blocks from the home page.

---

## Styling & Motion
- Tailwind utilities, single accent color token.
- Reduced animation: prefers-reduced-motion honored.
- Focus-visible rings, ARIA-labelled controls.
- No parallax; microglow on CTAs only.

---

## Implementation Plan

1. **Scaffold**
   - Remove feature/timeline sections from home.
   - Add demo route section to `/` with anchor `#demo`.
2. **Data**
   - Add `demo/snapshots.json`, `demo/prompt.json`, `demo/patch.diff`.
3. **Components**
   - Build `EventStream`, `StateInspector`, `PromptBuilder`, `PatchPreview`, `DemoStepper`.
4. **State Machine**
   - Implement finite-state machine for steps: `idle → launch → capture → format → fix → done` with transitions.
5. **Accessibility**
   - Keyboard support for stepper, copy buttons, and panel toggles.
6. **Docs**
   - Trim nav; add Quickstart link and tiny “API” link only.
7. **Telemetry (optional)**
   - `demo_play`, `demo_step`, `prompt_copy`, `patch_copy` (aggregate only).

---

## Copy Updates

**Hero:** “Debug through your AI’s eyes.”  
**Sub:** “Launch, capture, explain, and fix. No bloat.”  
**Demo step labels:** Launch • Capture • Inject • Fix  
**Prompt header:** “Constraints for minimal, safe patching”

---

## Acceptance Criteria

- Home page renders ≤ 70KB gzipped (HTML+CSS+JS, excluding fonts).
- Demo runs offline and loops deterministically.
- Copy buttons work for prompt and patch.
- State inspector renders ≤ 500 variables smoothly (virtualized).
- All interactive elements keyboard-accessible and screen-reader labelled.
- Lighthouse (desktop) ≥ 95 Performance, ≥ 100 A11y/Best Practices/SEO.
- No external network requests during demo.

---

## Risks & Mitigations
- **Users assume it edits their code**: Add “simulation” label on demo.
- **Over-optimistic agent behavior**: Show constraints prominently and include example of rejected patch that violates rules.
- **Bundle growth**: Use static JSON, virtualized lists, and tree-shake diff viewer.

---

## Out of Scope
- Live connection to VS Code or the extension.
- Real LLM calls; agent output is pre-baked for demo clarity.
- Auth, user accounts, or persistence.

---

## Tracking
- Issue: “Revamp site: minimal + interactive demo”
- Labels: `ui`, `demo`, `docs`, `accessibility`, `perf`
- Milestone: `v0.4.0`
