<script lang="ts">
	import EditorCanvas from '$components/EditorCanvas.svelte';
	import RightPanel from '$components/RightPanel.svelte';
	import Stepper, { type Step } from '$components/Stepper.svelte';
	import ExtensionsCard from '$components/ExtensionsCard.svelte';
	import EventStream from '$components/EventStream.svelte';
	import type { FrameVar, DebugSnapshot } from '$lib/types/demo';
	import type { LogLine } from '$lib/types/logLine';

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
	let streamLines: LogLine[] = [];
	let streamSpeed = 1;

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
			<div class="topbar__tab topbar__tab--active">RealityCheck</div>
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
		<h1 class="hero__title">RealityCheck keeps your coding agents grounded.</h1>
		<p class="hero__subtitle">
			<span>Debugging tools for the coding agent of your choice</span> that surface context, stream events, and preview patches so you ship with confidence.
		</p>
		<div class="hero__cta">
			<a
				class="hero__install"
				href="https://marketplace.visualstudio.com/items?itemName=agent-debugger.extension"
				target="_blank"
				rel="noopener"
			>
				Install RealityCheck
			</a>
		</div>
	</section>

	<!-- Extensions -->
	<section class="extensions">
		<ExtensionsCard />
	</section>

	<!-- Stepper -->
	<section class="stepper">
		<Stepper {steps} {activeIndex} />
	</section>

	<!-- Editor -->
	<section class="workspace__editor">
		<EditorCanvas {activeLine} variables={lineVariables} />
	</section>

	<!-- Side panel -->
	<aside class="workspace__panel">
		<RightPanel
			on:state={handleState}
			bind:streamLines
			bind:streamSpeed />
	</aside>

	<!-- Event stream -->
	<section class="workspace__terminal">
		<EventStream lines={streamLines} speed={streamSpeed} />
	</section>

	<!-- Footer -->
	<footer class="status">
		<div class="status__item" aria-hidden="true">⌘</div>
		<div class="status__item">Spaces: 4</div>
		<div class="status__item">UTF-8</div>
		<div class="status__item status__pill" role="status">RealityCheck: connected</div>
		<div class="status__item status__link">
			<a href="https://github.com/agent-debugger/agent-debugger/issues">Open issues</a>
		</div>
	</footer>
</main>

<style>
	/* ---------- Layout ---------- */
	.page {
		display: grid;
		min-height: 100vh;
			padding: 32px clamp(16px, 4vw, 48px);
			row-gap: 28px;
			column-gap: 12px;
			max-width: 1200px;
			margin: 0 auto;
			grid-template-columns: minmax(0, 0.9fr) minmax(520px, 1.1fr);
		grid-template-rows:
			auto
			auto
			auto
			auto
			minmax(0, 1fr)
			minmax(30vh, 40vh)
			auto;
		grid-template-areas:
			"topbar topbar"
			"hero hero"
			"extensions extensions"
			"stepper stepper"
			"editor side"
			"terminal terminal"
			"status status";
	}

	.topbar {
		grid-area: topbar;
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
		grid-area: hero;
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

	.hero__cta {
		margin-top: 32px;
		display: flex;
		justify-content: center;
	}

	.hero__install {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 18px 52px;
		border-radius: 999px;
		font-size: 18px;
		font-weight: 700;
		letter-spacing: 0.02em;
		color: var(--text);
		text-decoration: none;
		border: 1px solid rgba(116, 218, 255, 0.5);
		background: linear-gradient(135deg, rgba(116, 218, 255, 0.28), rgba(52, 238, 137, 0.22));
		box-shadow:
			0 8px 32px rgba(116, 218, 255, 0.35),
			inset 0 0 18px rgba(52, 238, 137, 0.22);
		position: relative;
		overflow: hidden;
		animation: heroPulse 3s ease-in-out infinite;
	}

	.hero__install::after {
		content: "";
		position: absolute;
		inset: 0;
		background: linear-gradient(
			120deg,
			transparent 0%,
			rgba(255, 255, 255, 0.6) 45%,
			rgba(255, 255, 255, 0.9) 50%,
			rgba(255, 255, 255, 0.6) 55%,
			transparent 100%
		);
		transform: translateX(-130%);
		animation: heroSweep 2.6s linear infinite;
		mix-blend-mode: screen;
	}

	.hero__install:hover {
		border-color: rgba(116, 218, 255, 0.85);
		box-shadow:
			0 10px 40px rgba(116, 218, 255, 0.45),
			inset 0 0 22px rgba(52, 238, 137, 0.3);
	}

	@keyframes heroPulse {
		0%,
		100% {
			box-shadow:
				0 8px 32px rgba(116, 218, 255, 0.35),
				inset 0 0 18px rgba(52, 238, 137, 0.22);
		}
		50% {
			box-shadow:
				0 12px 44px rgba(116, 218, 255, 0.55),
				inset 0 0 26px rgba(52, 238, 137, 0.32);
		}
	}

	@keyframes heroSweep {
		0% {
			transform: translateX(-130%);
		}
		60% {
			transform: translateX(140%);
		}
		100% {
			transform: translateX(140%);
		}
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
	.extensions {
		grid-area: extensions;
	}

	.stepper {
		grid-area: stepper;
	}

	.workspace__editor {
		grid-area: editor;
		min-height: 0;
		display: flex;
	}

	.workspace__panel {
		grid-area: side;
		min-height: 0;
		display: flex;
		min-width: 0;
	}

	.workspace__panel :global(.right) {
		flex: 1;
		min-height: 0;
		min-width: 0;
	}

	.workspace__terminal {
		grid-area: terminal;
		min-height: 0;
		display: flex;
		overflow: auto;
	}

	.workspace__terminal :global(.stream) {
		flex: 1;
	}

	.status {
		grid-area: status;
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
	@media (max-width: 900px) {
		.page {
			grid-template-columns: 1fr;
			grid-template-rows:
				auto
				auto
				auto
				auto
				minmax(0, 1fr)
				35vh
				auto;
			grid-template-areas:
				"topbar"
				"hero"
				"extensions"
				"stepper"
				"editor"
				"side"
				"terminal"
				"status";
		}
	}

	@media (max-width: 640px) {
		.page {
			padding: 24px 16px;
		}

		.topbar {
			padding: 12px 14px;
		}

		.hero__cta {
			margin-top: 24px;
		}

		.hero__install {
			width: 100%;
			padding: 16px 24px;
			font-size: 16px;
		}
	}
</style>
