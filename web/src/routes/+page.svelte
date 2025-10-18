<script lang="ts">
	import EditorCanvas from '$components/EditorCanvas.svelte';
	import RightPanel from '$components/RightPanel.svelte';
	import Stepper, { type Step } from '$components/Stepper.svelte';
	import ExtensionsCard from '$components/ExtensionsCard.svelte';
	import type { FrameVar, DebugSnapshot } from '$lib/types/demo';

	/* ---------- State ---------- */
	let activeLine: number | null = null;
	let lineVariables: FrameVar[] = [];

	const steps: Step[] = [
		{ id: 'launch', label: 'Launch', description: 'Extension starts target' },
		{ id: 'capture', label: 'Capture', description: 'Collect stack & locals' },
		{ id: 'inject', label: 'Inject', description: 'Context into copilot prompt' },
		{ id: 'fix', label: 'Fix', description: 'Agent proposes minimal patch' }
	];

	let activeIndex = 0;
	let isPlaying = false;
	let playbackSpeedChoice = '1';
	$: playbackSpeed = parseFloat(playbackSpeedChoice);

	/* ---------- Handlers ---------- */
	type StateEvent = {
		step: Step;
		line: number | null;
		locals: FrameVar[];
		snapshot: DebugSnapshot;
	};

	function handleState(event: CustomEvent<StateEvent>) {
		const { step, line, locals } = event.detail;
		activeLine = line;
		lineVariables = [...locals];
		activeIndex = steps.findIndex((s) => s.id === step.id);
	}

	function handlePlayPause() {
		isPlaying = !isPlaying;
	}

	function navigate(offset: number) {
		activeIndex = Math.min(Math.max(activeIndex + offset, 0), steps.length - 1);
	}

	function reset() {
		activeIndex = 0;
		isPlaying = false;
	}
</script>

<main class="page">
	<!-- Navigation -->
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

	<!-- Hero -->
	<section class="hero">
		<h1 class="hero__title">Debug through your AI’s eyes.</h1>
		<p class="hero__subtitle">
			Launch, capture, inject, fix. <span>Minimal moves, maximal signal.</span><br />
			The Agent Debugger extension keeps VS Code’s debugger grounded while your agent proposes the safest patch.
		</p>
	</section>

	<!-- Extensions -->
	<ExtensionsCard />

	<!-- Stepper -->
	<Stepper {steps} {activeIndex} />

	<!-- Main content -->
	<section class="grid">
		<div class="grid__editor">
			<EditorCanvas {activeLine} variables={lineVariables} />
		</div>

		<div class="grid__panel">
			<RightPanel on:state={handleState} />
		</div>
	</section>

	<!-- Footer -->
	<footer class="status">
		<div class="status__item" aria-hidden="true">⌘</div>
		<div class="status__item">Spaces: 4</div>
		<div class="status__item">UTF-8</div>
		<div class="status__item status__pill" role="status">Agent Debugger: connected</div>
		<div class="status__item status__link">
			<a href="https://github.com/agent-debugger/agent-debugger/issues">Open issues</a>
		</div>
	</footer>
</main>

<style>
	/* ---------- Layout ---------- */
	.page {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		padding: 32px clamp(16px, 4vw, 48px);
		gap: 28px;
		max-width: 1200px;
		margin: 0 auto;
	}

	/* ---------- Navigation ---------- */
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

	/* ---------- Hero ---------- */
	.hero {
		text-align: center;
		padding: 80px 20px 60px;
		background: radial-gradient(circle at 50% 0%, rgba(116, 218, 255, 0.15), transparent 70%);
		position: relative;
		overflow: hidden;
	}

	.hero::before {
		content: "";
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 50% 100%, rgba(52, 238, 137, 0.05), transparent 60%);
		pointer-events: none;
	}

	.hero__title {
		font-size: clamp(40px, 6vw, 72px);
		font-weight: 800;
		background: linear-gradient(90deg, #74daff 0%, #34ee89 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		line-height: 1.1;
		letter-spacing: -0.02em;
		margin: 0;
		text-shadow: 0 0 20px rgba(116, 218, 255, 0.25);
		animation: fadeInSlide 1s ease-out;
	}

	.hero__subtitle {
		max-width: 680px;
		margin: 20px auto 0;
		font-size: clamp(16px, 1.5vw, 20px);
		color: var(--muted);
		line-height: 1.7;
		font-weight: 400;
		text-align: center;
	}

	.hero__subtitle span {
		color: var(--accent-blue);
		font-weight: 600;
	}

	@keyframes fadeInSlide {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ---------- Grid ---------- */
	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
		gap: 32px;
		align-items: start;
		flex: 1;
	}

	.grid__panel {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	/* ---------- Footer ---------- */
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

	/* ---------- Responsive ---------- */
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
