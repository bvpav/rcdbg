<script lang="ts">
  import { onDestroy } from 'svelte';
  import { prefersReducedMotion } from '$lib/stores/preferences';
  import { get } from 'svelte/store';
  import type { LogLine } from '$lib/types/logLine';

  export let lines: LogLine[] = [];
  export let speed = 1;

  let rendered: LogLine[] = [];
  const timers = new Set<ReturnType<typeof setTimeout>>();

  const clearTimers = () => {
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
  };

const typeLine = (line: LogLine) => {
  if (get(prefersReducedMotion) || line.text.length === 0) {
    rendered = [...rendered, line];
    return;
  }

  const baseDelay = 24;
  const adjusted = Math.max(12, baseDelay / Math.max(speed, 0.5));
  const entry: LogLine = { ...line, text: '' };
  const index = rendered.length;
  rendered = [...rendered, entry];

  const tick = () => {
    const target = line.text;
    const nextLength = Math.min(entry.text.length + 1, target.length);
    entry.text = target.slice(0, nextLength);
    rendered = rendered.map((item, idx) => (idx === index ? { ...entry } : item));

    if (entry.text.length < target.length) {
      const timeout = setTimeout(tick, adjusted);
      timers.add(timeout);
    }
  };

  tick();
};

  $: {
    const desiredIds = lines.map((line) => line.id);
    const desiredSet = new Set(desiredIds);
    const existingMap = new Map(rendered.map((line) => [line.id, line]));
    const removed = rendered.some((line) => !desiredSet.has(line.id));
    const nextRendered: LogLine[] = [];

    for (const id of desiredIds) {
      const cached = existingMap.get(id);
      if (cached) {
        nextRendered.push(cached);
      }
    }

    const needsReorder =
      nextRendered.length === rendered.length &&
      nextRendered.some((item, idx) => item.id !== rendered[idx]?.id);

    if (removed || needsReorder || nextRendered.length !== rendered.length) {
      if (removed) clearTimers();
      rendered = nextRendered;
    }

    const existing = new Set(rendered.map((line) => line.id));
    for (const line of lines) {
      if (!existing.has(line.id)) typeLine(line);
    }
  }

  onDestroy(clearTimers);
</script>

<section class="stream" aria-label="Event stream log">
  <header class="stream__header">
    <span>EVENT STREAM</span>
    <span>Simulation</span>
  </header>
  <div class="stream__body" role="log" aria-live="polite">
    {#if rendered.length === 0}
      <p class="stream__placeholder">Awaiting launch…</p>
    {:else}
      {#each rendered as line (line.id)}
        <p class={`line line--${line.level ?? 'info'}`}>{line.text}</p>
      {/each}
    {/if}
  </div>
</section>

<style>
  .stream {
    border: 1px solid var(--border);
    border-radius: 12px;
    background: rgba(5, 8, 12, 0.95);
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.015);
  }

  .stream__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    font-size: 11px;
    letter-spacing: 0.32em;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
  }

  .stream__body {
    padding: 14px 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 1.6;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }

  .stream__placeholder { margin: 0; color: var(--muted); }
  .line { margin: 0; color: var(--muted); }
  .line--warn { color: var(--accent-blue); }
  .line--error { color: #ff6b6b; }
  .line--success { color: var(--accent-green); }
  .line--info { color: var(--muted); }
</style>
