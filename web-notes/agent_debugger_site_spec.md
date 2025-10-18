# Agent Debugger — Site Design Spec

## Overview
A minimal, interactive landing site for the VS Code extension that enables AI agents to control debugging actions.

### Objective
Visually communicate power and simplicity. Let users interact, understand, and install within 60 seconds.

---

## 1. Visual & Brand Identity

**Feel:** Precision, control, calm intelligence.  
**Keywords:** Minimal, futuristic, monochrome, tactile.

**Palette:**
- Background: #0E1013
- Accent: #38BDF8 (cyan glow)
- Text: #E2E8F0
- Muted: #9AA4B2
- OK: #34D399
- Error: #F87171

**Typography:**
- Primary: Inter (sans-serif)
- Code/UI: JetBrains Mono

**Motion:**
- Cursor blinking, soft parallax on hero background
- Subtle glow transitions on CTAs
- Typewriter console animation looping

---

## 2. Structure & Layout

### Sections
1. **Hero (Interactive Console)**
   - Headline: “Debug through your AI’s eyes.”
   - Sub: “Control VS Code’s debugger from your agent.”
   - Two CTAs: “Try Demo” and “Install in VS Code”
   - Live animated terminal typing sequence

2. **Interactive Debug Timeline**
   - Scrollable horizontal visualization of agent↔debugger events
   - Each node expandable for API example

3. **Quickstart Card**
   - Side-by-side layout: VS Code screenshot + 5-step quickstart

4. **Docs Teaser Grid**
   - Three cards: Quickstart, API Docs, Examples

5. **Footer**
   - Version, license, GitHub/Marketplace links

---

## 3. User Flow

1. Land on page → sees animation → clicks “Try Demo”
2. Scrolls → experiences interactive timeline
3. Clicks “Install” or “Docs”
4. Done. They either install or bookmark.

---

## 4. Interaction Details

| Element | Interaction | Feedback |
|----------|--------------|-----------|
| Hero console | Typewriter + blinking cursor | Feels alive |
| CTA buttons | Cyan glow pulse | Inviting |
| Timeline nodes | Hover expand | Intuitive exploration |
| Scroll down | Smooth easing | Fluid movement |
| Dark/light toggle | Key shortcut “T” | Empowerment |

---

## 5. Technical Stack

- Framework: SvelteKit (static)
- Styling: TailwindCSS
- Animations: Framer Motion
- Hosting: Cloudflare Pages
- Fonts: Inter + JetBrains Mono (Google Fonts)
- Analytics: Plausible (optional)
- Search: MiniSearch (local index)

---

## 6. Components

| Component | Purpose |
|------------|----------|
| `HeroConsole.svelte` | Animated hero demo |
| `DebugTimeline.svelte` | Interactive feature timeline |
| `QuickstartCard.svelte` | Step-by-step install demo |
| `DocsGrid.svelte` | Doc navigation shortcuts |
| `Footer.svelte` | Meta + links |

---

## 7. Responsiveness

- Mobile: Console collapses to carousel of steps
- Timeline → vertical stack
- CTAs always visible

---

## 8. Accessibility

- Keyboard navigation for all interactions
- ARIA labels for console and timeline
- High-contrast colors
- Motion reduced when prefers-reduced-motion=true

---

## 9. Deployment

- `main` branch auto-build → Cloudflare
- Versioned releases update `/changelog`
- Static export, no server dependencies

---

## 10. Success Criteria

- Bounce rate < 40%
- Avg time on site > 60s
- “Install” click-through > 25%
- Visuals stay consistent with VS Code ecosystem

---

© 2025 Agent Debugger — MIT Licensed
