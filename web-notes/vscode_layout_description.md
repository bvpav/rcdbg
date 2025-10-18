# Visual Studio Code — Interface Layout & Visual Description

Visual Studio Code (VS Code) is a modular, dark-themed code editor with a **split-pane layout** and a minimalist design that emphasizes clarity and keyboard flow. The entire UI is built around a central editor area flanked by sidebars, panels, and a status bar.

---

## 1. Overall Layout

```
+--------------------------------------------------------------------------------------+
| [Activity Bar] [Side Bar]                | [Editor Group]              | [Minimap]   |
+--------------------------------------------------------------------------------------+
| [Panel (Terminal / Problems / Output / Debug Console)]                              |
+--------------------------------------------------------------------------------------+
| [Status Bar]                                                                     ^v  |
+--------------------------------------------------------------------------------------+
```

### Main Regions
| Region | Description |
|--------|--------------|
| **Activity Bar** | Narrow vertical strip on the far left with icons for *Explorer*, *Search*, *Source Control*, *Run & Debug*, and *Extensions*. |
| **Side Bar** | Contains collapsible views (File Explorer, Outline, Extensions list, etc.). |
| **Editor Group** | The main workspace for files; supports tabs and split editing horizontally or vertically. |
| **Minimap** | Optional small preview strip of the open file aligned to the right edge. |
| **Panel** | Bottom dock area used for the integrated terminal, debug console, problems list, or output logs. |
| **Status Bar** | Thin strip at the bottom showing language mode, encoding, Git branch, notifications, and live status info. |

---

## 2. Visual Style

| Element | Color (Dark Theme) | Notes |
|----------|--------------------|-------|
| Background | `#1E1E1E` (default dark) | Flat, low-contrast base. |
| Editor text | `#D4D4D4` | Neutral gray for code. |
| Selection | `#264F78` | Muted blue overlay. |
| Accent (links, highlights) | `#007ACC` | Core VS Code blue. |
| Error underline | `#F14C4C` | Bright red squiggle. |
| Warning underline | `#CCA700` | Amber squiggle. |
| Git added/modified/deleted | `#81B88B`, `#E2C08D`, `#C74E39` | Shown in the gutter and file tree. |

---

## 3. Typical Panels & Icons

### Activity Bar Icons
- **Explorer (📁)** — lists files and folders.
- **Search (🔍)** — global text search with filters.
- **Source Control (⎇)** — Git view, commits, branches.
- **Run & Debug (▶️)** — shows debug sessions, breakpoints, variables.
- **Extensions (⌘)** — marketplace for extensions.

### Side Bar (Explorer)
```
src/
 ┣ components/
 ┃ ┗ EventStream.svelte
 ┣ lib/
 ┃ ┗ types/
 ┃   ┗ log.ts
 ┣ app.d.ts
 ┗ app.html
```
Shows the open folder tree with icons, modified-file highlights, and right-click context menus.

---

## 4. Debugging Interface

When debugging:
- A **debug toolbar** appears at the top with buttons:
  - ▶ Continue
  - ⏸ Pause
  - ⏩ Step Over
  - ↳ Step Into
  - ↰ Step Out
  - ⏹ Stop
- **LEFT PANEL:** *Variables*, *Watch*, *Call Stack*, and *Breakpoints*.
- **MAIN EDITOR:** Active line highlighted (yellow) with breakpoint dots in the gutter.
- **BOTTOM PANEL:** *Debug Console* shows runtime logs.

---

## 5. Status Bar Layout

Located at the very bottom:

| Section | Typical Info |
|----------|---------------|
| **Left** | Git branch, sync status, errors/warnings count |
| **Center** | Build / Run indicators, live server info |
| **Right** | Encoding (UTF-8), line endings (LF/CRLF), language mode (TypeScript, Python), Prettier icon, bell notifications |

---

## 6. Extensions View (Marketplace)

When the **Extensions** tab is selected:

```
────────────────────────────────────────────────────────────
| ●  | Agent Debugger               | Install ☐ | ☆ 245     |
|    | SentIRX • Debug from your AI agent                     |
|    | v0.4.0 • Category: Debugging                           |
────────────────────────────────────────────────────────────
```

Each extension card shows:
- Icon and name on the left
- Author and short description
- Buttons: *Install*, *Uninstall*, *Reload*, or *Manage*
- Version and category tags
- Star rating and download count

The right side of the view shows the full marketplace page with README and screenshots.

---

## 7. Color Palette Example (Custom)

| Token | Example Custom Color |
|--------|----------------------|
| Background | `#02040A` |
| Foreground / Panels | `#0D1116` |
| Accent Blue | `#74DAFF` |
| Accent Green | `#34EE89` |
| Muted Text | `#9AA4B2` |
| Border | `#1C222B` |

These values replicate a slightly brighter, cooler palette than VS Code’s stock theme — useful for reproducing the editor feel on a web demo.

---

## 8. Interaction Feel

- Tabs drag smoothly; panels slide in/out.
- Everything supports keyboard shortcuts (`Ctrl + B` toggles Side Bar, `Ctrl + \`` opens Terminal, etc.).
- Font rendering is tight and monospaced (typically *Consolas*, *JetBrains Mono*, or *Fira Code*).
- Subtle shadows and 1-pixel borders separate regions.

---

## 9. Minimal Description Summary

> **VS Code** = dark modular grid.  
> Left vertical control strip → file tree → central editor → optional minimap → bottom terminal → status bar.  
> Everything is flat, keyboard-driven, and accentuated by cool blue highlights.

```
Activity Bar → Side Bar → Editor → Terminal → Status Bar
Dark, cool hues; smooth animations; sharp typography.
```
