<script lang="ts">
	import EditorCanvas from '$components/EditorCanvas.svelte';
	import RightPanel from '$components/RightPanel.svelte';
	import type { Step } from '$components/Stepper.svelte';
	import type { FrameVar, DebugSnapshot } from '$lib/types/demo';

	let activeLine: number | null = null;
	let lineVariables: FrameVar[] = [];

	const handleState = (
		event: CustomEvent<{
			step: Step;
			line: number | null;
			locals: FrameVar[];
			snapshot: DebugSnapshot;
		}>
	) => {
		activeLine = event.detail.line;
		lineVariables = [...event.detail.locals];
	};
</script>

<main class="page">
	<header class="topbar" aria-hidden="true">
		<div class="topbar__tabs">
			<div class="topbar__tab topbar__tab--active">Agent Debugger</div>
			<div class="topbar__tab">README</div>
			<div class="topbar__tab">tests.py</div>
		</div>
		<div class="topbar__crumbs">
			<span>src</span>
			<span class="chevron">›</span>
			<span>queue</span>
			<span class="chevron">›</span>
			<span class="current">main.py</span>
		</div>
	</header>

	<section class="grid">
		<div class="grid__editor">
			<h1>Debug through your AI’s eyes.</h1>
			<p class="subtitle">
				Launch, capture, inject, fix. Minimal moves, maximal signal. The Agent Debugger extension keeps VS Code’s
				debugger grounded while your agent proposes the safest patch.
			</p>
			<EditorCanvas {activeLine} variables={lineVariables} />
		</div>
		<div class="grid__panel">
			<RightPanel on:state={handleState} />
		</div>
	</section>

	<footer class="status">
		<div class="status__item" aria-hidden="true">⌘</div>
		<div class="status__item">Spaces: 4</div>
		<div class="status__item">UTF-8</div>
		<div class="status__item status__pill" role="status">Agent Debugger: connected</div>
		<div class="status__item status__link">
			<a href="https://github.com/agent-debugger/agent-debugger/issues">Open issues</a>
		</div>
		<div class="status__item status__link">
			<a
				href="https://marketplace.visualstudio.com/items?itemName=agent-debugger.extension"
				target="_blank"
				rel="noopener"
			>
				Marketplace
			</a>
		</div>
	</footer>
</main>

<style>
	.page {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		padding: 32px clamp(16px, 4vw, 48px);
		gap: 28px;
		max-width: 1200px;
		margin: 0 auto;
	}

	.topbar {
		display: flex;
		flex-direction: column;
		gap: 10px;
		background: rgba(13, 17, 22, 0.92);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 16px 20px;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.015);
	}

	.topbar__tabs {
		display: flex;
		gap: 8px;
	}

	.topbar__tab {
		padding: 6px 12px;
		border-radius: 8px;
		font-size: 12px;
		color: var(--muted);
		background: rgba(10, 14, 19, 0.8);
	}

	.topbar__tab--active {
		color: var(--text);
		background: rgba(116, 218, 255, 0.12);
		box-shadow: 0 0 0 1px rgba(116, 218, 255, 0.3);
	}

	.topbar__crumbs {
		display: flex;
		gap: 6px;
		font-size: 12px;
		color: var(--muted);
	}

	.topbar__crumbs .current {
		color: var(--text);
	}

	.chevron {
		opacity: 0.5;
	}

	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
		gap: 32px;
		align-items: start;
		flex: 1;
	}

	.grid__editor {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	h1 {
		margin: 0;
		font-size: clamp(28px, 3vw, 40px);
	}

	.subtitle {
		margin: 0;
		font-size: 15px;
		color: var(--muted);
		max-width: 540px;
		line-height: 1.6;
	}

	.grid__panel {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.status {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: center;
		padding: 10px 16px;
		border-radius: 12px;
		background: rgba(10, 14, 19, 0.88);
		border: 1px solid var(--border);
		font-size: 12px;
		color: var(--muted);
	}

	.status__item {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.status__pill {
		padding: 4px 10px;
		border-radius: 999px;
		border: 1px solid rgba(52, 238, 137, 0.4);
		background: rgba(52, 238, 137, 0.12);
		color: var(--accent-green);
		font-weight: 600;
	}

	.status__link a {
		color: var(--accent-blue);
	}

	@media (max-width: 1024px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.page {
			padding: 24px 16px;
		}

		.topbar {
			padding: 12px 14px;
		}
	}
</style>
