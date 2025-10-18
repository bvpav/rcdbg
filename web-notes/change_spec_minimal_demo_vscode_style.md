# Change Spec (Self‑Contained): Minimal Site with VS Code‑style Interactive Debug Demo

This spec replaces the current site with a **single‑screen, VS Code‑like layout**. The demo runs offline and shows the extension workflow in the right chat panel: **Launch → Capture → Inject → Fix**. It also includes an **“Extensions” link block** that looks like the VS Code Extensions tab, pointing to the marketplace page.

---

## Visual System

**Goal:** VS Code ambiance, but with your palette.

**Colors (tokens):**
- `--bg`: `#02040a` (black background)
- `--panel`: `#0d1116` (black foreground / panels)
- `--accent-blue`: `#74DAFF`
- `--accent-green`: `#34EE89`
- `--text`: `#E6EDF3`
- `--muted`: `#9AA4B2`
- `--border`: `#1c222b`
- `--ring`: `rgba(116,218,255,0.25)`

**Typography:**
- UI & body: Inter
- Code & terminal: JetBrains Mono

**Motion:**
- Cursor blink in terminal
- Subtle focus ring glow in accent blue
- Reduced motion honored via `prefers-reduced-motion`

---

## Page IA (after change)

- `/` Home (single VS Code‑style canvas with editor left, interactive chat right)
- `/quickstart` (5 concise steps)
- `/docs` (links to API + examples)
- Footer: marketplace link, GitHub issues

Remove other pages from nav.

---

## Layout (single screen)

```
+----------------------------------------------------------------------------------+
| [Top bar: fake tabs + breadcrumbs (non-interactive)]                             |
+--------------------------------------+-------------------------------------------+
|                                      |                                           |
|  LEFT: Editor canvas                 | RIGHT: Chat / Demo panel                  |
|  - dark code area with fake gutter   | - Stepper (Launch • Capture • Inject • Fix)|
|  - read-only sample code             | - Event Stream (terminal-like)            |
|                                      | - State Inspector (JSON)                  |
|                                      | - Prompt Builder (formatted prompt)       |
|                                      | - Patch Preview (diff)                    |
|                                      | - Extensions link block (VS Code style)   |
+--------------------------------------+-------------------------------------------+
| [Status bar: icons + “Extension connected” pill]                                 |
+----------------------------------------------------------------------------------+
```

- **Left editor** is static; **right panel** is the interactive demo.
- The **Extensions link block** sits pinned at the top of the right panel, styled like the VS Code Extensions tab card with an **Install** button.

---

## Interactive Demo: Steps & Panels

**Stepper (always visible at top of right panel):**
1. **Launch** – “Extension starts target in debug mode.”
2. **Capture** – “Collect call stack + locals per frame.”
3. **Inject** – “Format context → inject into copilot prompt.”
4. **Fix** – “Agent proposes minimal patch (no hallucinations, no hardcoding).”

**Panels under the stepper (toggle sections):**
- **Event Stream** (terminal):
  - Autotypes demo logs; supports Play/Pause/Next/Reset.
- **State Inspector** (JSON viewer):
  - Collapsible frames, locals, exception site.
- **Prompt Builder**:
  - Shows the exact prompt to your copilot with constraints at top.
- **Patch Preview**:
  - Unified diff plus 3–4 rationale bullets.

**Controls:**
- Play/Pause, Next/Back, Speed (0.5×/1×/2×), Reset
- Copy buttons for Prompt and Patch
- “Show JSON” toggle in State Inspector

**Guardrails (rendered at top of Prompt Builder):**
- Do not add unrelated code or large refactors.
- No hardcoding constants to satisfy tests.
- Limit changes to ≤ N lines per file.
- Explain failure location and chosen fix in ≤ 4 bullets.

---

## Right‑Panel “Extensions” Link Block (VS Code‑like)

A small card at the top of the right panel that mimics the VS Code Extensions tab entry:

- Icon (square), Title: **Agent Debugger**, Publisher
- Version tag, short description
- Buttons: **Install**, **Learn more**
- Clicking **Install** opens the marketplace URL in a new tab

**Sample HTML (drop‑in):**
```html
<div class="ext-card" role="button" aria-label="Open extension">
  <div class="ext-icon">AD</div>
  <div class="ext-meta">
    <div class="ext-title">Agent Debugger</div>
    <div class="ext-sub">by SentIRX • Debug from your AI agent</div>
    <div class="ext-tags"><span>v0.4.0</span><span>Debugging</span></div>
  </div>
  <div class="ext-actions">
    <a class="btn install" href="https://marketplace.visualstudio.com/items?itemName=sentirx.agent-debugger" target="_blank" rel="noopener">Install</a>
    <a class="btn" href="/quickstart">Learn more</a>
  </div>
</div>
```

---

## Data & Simulation (self‑contained)

Demo uses local JSON and diff files. No network.

**Types (TS):**
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
};
type PatchSuggestion = { diff: string; rationale: string[] };
```

**Files:**
```
/static/demo/snapshots.json   # DebugSnapshot[] sequence
/static/demo/prompt.json      # PromptPayload
/static/demo/patch.diff       # PatchSuggestion.diff
```

**Example content (trimmed):**
```json
// snapshots.json
[
  { "timestamp": "T0", "program": { "cmd": "python", "args": ["main.py"] }, "event": "launch", "frames": [] },
  { "timestamp": "T1", "event": "breakpoint", "activeFrameId": "f1",
    "frames": [
      { "id": "f1", "file": "main.py", "line": 42, "fn": "calc",
        "locals": [{ "name": "a", "type": "int", "value": "3" },
                   { "name": "b", "type": "int", "value": "0" }] }
    ],
    "message": "ZeroDivisionError at main.py:42"
  }
]
```
```json
// prompt.json
{
  "failure": { "file": "main.py", "line": 42, "message": "ZeroDivisionError" },
  "frames": [{ "id": "f1", "file": "main.py", "line": 42, "fn": "calc",
    "locals": [{ "name": "a", "type": "int", "value": "3" }, { "name": "b", "type": "int", "value": "0" }]}],
  "constraints": [
    "Do not add unrelated code or refactors",
    "No hardcoded constants to pass tests",
    "Limit change set to ≤ 6 lines",
    "Explain the failure location and the fix in ≤ 4 bullets"
  ]
}
```
```diff
--- a/main.py
+++ b/main.py
@@ -40,7 +40,9 @@ def calc(a, b):
-    return a / b
+    if b == 0:
+        raise ValueError("b must be non-zero")
+    return a / b
```

---

## Components (Svelte names)

- `RightPanel.svelte` (container: stepper, actions, panels)
- `Stepper.svelte` (Launch • Capture • Inject • Fix)
- `EventStream.svelte` (typewriter terminal)
- `StateInspector.svelte` (virtualized JSON tree)
- `PromptBuilder.svelte` (rendered prompt + copy)
- `PatchPreview.svelte` (diff view + copy)
- `ExtensionsCard.svelte` (marketplace link block)
- `EditorCanvas.svelte` (left read‑only code with gutter)

**FSM for demo:**
`idle → launch → capture → inject → fix → done` (loopable; keyboard: Space = play/pause, ←/→ = prev/next step)

---

## CSS Tokens (vanilla or Tailwind)

```css
:root{
  --bg:#02040a; --panel:#0d1116; --text:#E6EDF3; --muted:#9AA4B2;
  --accent-blue:#74DAFF; --accent-green:#34EE89; --border:#1c222b;
  --ring:rgba(116,218,255,.25);
}
body{background:var(--bg);color:var(--text);}
.panel{background:var(--panel);border:1px solid var(--border);border-radius:12px;}
.btn{border:1px solid var(--border);padding:.55rem .8rem;border-radius:8px}
.btn:hover{box-shadow:0 0 0 8px var(--ring)}
.gutter{color:#5c6773}
a{color:var(--accent-blue)}
.status-pill{background:#0a141b;border:1px solid var(--border);color:var(--accent-green);}
```

**Tailwind config additions (optional):**
```js
theme:{ extend:{
  colors:{
    bg:"#02040a", panel:"#0d1116", text:"#E6EDF3", muted:"#9AA4B2",
    accent:{ blue:"#74DAFF", green:"#34EE89" }, border:"#1c222b"
  }
}}
```

---

## Copy (short, VS Code‑ish)

- **Header:** “Debug through your AI’s eyes.”
- **Sub:** “Launch, capture, inject, fix. Minimal moves, maximal signal.”
- **Stepper labels:** Launch • Capture • Inject • Fix
- **Status bar text:** “Agent Debugger: connected”

---

## Accessibility

- All interactive elements keyboard‑navigable and screen‑reader labeled
- `prefers-reduced-motion` respected
- Sufficient contrast on blue/green accents against `#0d1116`

---

## Acceptance Criteria

- Single page ≤ 70 KB gzipped (HTML+CSS+JS, no fonts)
- Demo plays offline with local JSON/diff
- Copy buttons work
- Right‑panel Extensions card looks like VS Code tab and opens marketplace link
- Lighthouse desktop: ≥ 95 Performance, 100 A11y/Best Practices/SEO

---

## Implementation Steps

1. Scaffold VS Code‑like layout (left EditorCanvas, right RightPanel).
2. Add ExtensionsCard at top of right panel with marketplace URL.
3. Implement Stepper + FSM wiring.
4. Build EventStream with typewriter; load `/demo/snapshots.json`.
5. StateInspector: lazy render + collapse/expand.
6. PromptBuilder: render `/demo/prompt.json` with constraints header; add Copy.
7. PatchPreview: render `/demo/patch.diff`; add Copy.
8. Status bar pill “Extension connected” on bottom.
9. Trim nav to Home, Quickstart, Docs.
10. A11y + perf pass; ship.

---

## Marketplace URL Placeholder

Use:
`https://marketplace.visualstudio.com/items?itemName=sentirx.agent-debugger`

Replace `sentirx.agent-debugger` if your actual identifier differs.
