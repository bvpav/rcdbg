<script lang="ts">
import { type Step } from './Stepper.svelte';
import PromptBuilder from './PromptBuilder.svelte';
import PatchPreview from './PatchPreview.svelte';
import { snapshotsData } from '$data/snapshots';
import { promptData } from '$data/prompt';
import patchDiffSource from '$data/patch.diff?raw';
import type { DebugSnapshot, PatchSuggestion, PromptPayload, Frame } from '$lib/types/demo';
import type { LogLine } from '$lib/types/logLine';
import { browser } from '$app/environment';
import { createEventDispatcher, onDestroy } from 'svelte';
import { base } from '$app/paths';

	const patchDiff = patchDiffSource.trim();

	const steps: Step[] = [
		{ id: 'launch', label: 'Launch', description: 'Extension starts target' },
		{ id: 'capture', label: 'Capture', description: 'Collect stack & locals' },
		{ id: 'inject', label: 'Inject', description: 'Context into copilot prompt' },
		{ id: 'fix', label: 'Fix', description: 'Agent proposes minimal patch' }
	];

	const snapshots = snapshotsData as DebugSnapshot[];
	const prompt = promptData as PromptPayload;
	const patch: PatchSuggestion = {
		diff: patchDiff,
		rationale: [
			'Abort division before it faults by validating divisor upfront.',
			'Raise a ValueError so callers can retry with safe input.',
			'Keep calculation unchanged for valid paths.'
		]
	};

let activeIndex = 0;
let isPlaying = false;
let playbackSpeedChoice = '1';
let playbackSpeed = parseFloat(playbackSpeedChoice);
$: playbackSpeed = parseFloat(playbackSpeedChoice);
	let showJson = false;
	let notif: string | null = null;
	export let streamLines: LogLine[] = [];
	export let streamSpeed = 1;
	let showConfetti = false;
	type ConfettiPiece = {
		id: number;
		left: number;
		delay: number;
		duration: number;
		hue: number;
		drift: number;
		size: number;
	};
let confettiPieces: ConfettiPiece[] = [];
let completionTimeout: ReturnType<typeof setTimeout> | null = null;
let confettiTimeout: ReturnType<typeof setTimeout> | null = null;
let confettiAudio: HTMLAudioElement | null = null;

	const baseDurations = [2500, 3200, 3400, 3600];
	let timer: ReturnType<typeof setTimeout> | null = null;

	const resetTimer = () => {
		if (timer) clearTimeout(timer);
		timer = null;
	};

	const schedule = () => {
		resetTimer();
		if (!isPlaying) return;
		if (activeIndex >= steps.length - 1) {
			isPlaying = false;
			checkCompletion();
			return;
		}
		const base = baseDurations[activeIndex];
		const adjusted = Math.max(800, base / Math.max(playbackSpeed, 0.5));
		timer = setTimeout(() => {
			activeIndex = Math.min(activeIndex + 1, steps.length - 1);
			if (activeIndex >= steps.length - 1) {
				isPlaying = false;
				checkCompletion();
			}
		}, adjusted);
	};

	$: schedule();

	onDestroy(() => {
		resetTimer();
		cleanupCompletion();
	});

const dispatch = createEventDispatcher<{
	state: {
		step: Step;
		line: number | null;
		locals: Frame['locals'];
		snapshot: DebugSnapshot;
	};
}>();


const logs: LogLine[] = snapshots.map((snapshot) => {
		const timestamp = new Date(snapshot.timestamp).toLocaleTimeString([], {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});

		let level: LogLine['level'] = 'info';
		if (snapshot.event === 'fix') level = 'success';
		if (snapshot.event === 'inject') level = 'warn';
		if (snapshot.event === 'breakpoint') level = 'warn';

		return {
			id: snapshot.timestamp,
			text: `[${timestamp}] ${snapshot.message}`,
			level
		};
	});

	let displayedLogs: LogLine[] = logs.slice(0, 1);

	$: displayedLogs = logs.slice(0, Math.max(1, activeIndex + 1));

const handlePlayPause = () => {
	if (activeIndex >= steps.length - 1) {
		stopCelebration();
		activeIndex = 0;
	}
	isPlaying = !isPlaying;
};

const goNext = () => {
	activeIndex = Math.min(activeIndex + 1, steps.length - 1);
	isPlaying = false;
	checkCompletion();
};

const goPrev = () => {
	stopCelebration();
	activeIndex = Math.max(activeIndex - 1, 0);
	isPlaying = false;
};

	type ResetOptions = { preserveCelebration?: boolean };
	const reset = (arg?: ResetOptions | Event) => {
		const options: ResetOptions =
			arg instanceof Event || arg === undefined ? {} : (arg as ResetOptions);
	const { preserveCelebration = false } = options;

	resetTimer();
	const wasCelebrating = showConfetti;
	stopCelebration();
	activeIndex = 0;
	isPlaying = false;
	showJson = false;
	notif = null;

	if (preserveCelebration && wasCelebrating) {
		confettiPieces = createConfettiPieces();
		showConfetti = true;
	}
};

	const announce = (message: string) => {
		notif = message;
		if (browser) {
			setTimeout(() => {
				notif = null;
			}, 2000);
		}
	};

const copyPrompt = () => announce('Prompt copied to clipboard');
const copyDiff = () => announce('Diff copied to clipboard');

const cleanupCompletion = () => {
	if (completionTimeout) {
		clearTimeout(completionTimeout);
		completionTimeout = null;
	}
	if (confettiTimeout) {
		clearTimeout(confettiTimeout);
		confettiTimeout = null;
	}
};

const stopCelebration = () => {
	showConfetti = false;
	confettiPieces = [];
	cleanupCompletion();
};

const createConfettiPieces = (count = 120): ConfettiPiece[] =>
	Array.from({ length: count }, (_, idx) => ({
		id: idx,
			left: Math.random() * 100,
			delay: Math.random() * 0.4,
			duration: 2.4 + Math.random() * 1.4,
			hue: Math.floor(Math.random() * 360),
			drift: Math.random() * 160 - 80,
			size: 6 + Math.random() * 6
		}));

const triggerCompletion = () => {
	if (completionTimeout || showConfetti) return;
	stopCelebration();
	completionTimeout = setTimeout(() => {
		confettiPieces = createConfettiPieces();
		showConfetti = true;
		playCelebrationSound();
		confettiTimeout = setTimeout(() => {
			showConfetti = false;
			confettiPieces = [];
			reset();
		}, 2500);
	}, 200);
};

const checkCompletion = () => {
	if (activeIndex >= steps.length - 1) {
		triggerCompletion();
	}
};

const playCelebrationSound = async () => {
	if (!browser) return;
	try {
		if (!confettiAudio) {
			const audioSrc = `${base.replace(/\/$/, '')}/confetti.mp3`;
			confettiAudio = new Audio(audioSrc);
			confettiAudio.preload = 'auto';
			confettiAudio.volume = 0.65;
		}
		confettiAudio.currentTime = 0;
		await confettiAudio.play().catch(() => undefined);
	} catch (error) {
		console.warn('Unable to play celebration sound', error);
	}
};

const currentSnapshot = () => snapshots[Math.min(activeIndex, snapshots.length - 1)];

let currentFrames = currentSnapshot().frames.map((frame) => ({ ...frame, locals: [...frame.locals] }));
let activeFrameId = currentSnapshot().activeFrameId;

	$: {
		const snapshot = currentSnapshot();
		currentFrames = snapshot.frames.map((frame) => ({ ...frame, locals: [...frame.locals] }));
		activeFrameId = snapshot.activeFrameId;
	}
$: {
	const snapshot = currentSnapshot();
	const frame = snapshot.frames.find((item) => item.id === snapshot.activeFrameId) ?? snapshot.frames[0];
	const line = frame?.line ?? null;
	const locals = frame ? [...frame.locals] : [];
	dispatch('state', { step: steps[activeIndex], line, locals, snapshot });
}

	let formatReady = activeIndex >= 2;
	let fixReady = activeIndex >= 3;

	$: formatReady = activeIndex >= 2;
	$: fixReady = activeIndex >= 3;

	export { handlePlayPause, goNext, goPrev, reset, playbackSpeedChoice, isPlaying, steps, activeIndex };

$: streamLines = displayedLogs;
$: streamSpeed = playbackSpeed;
</script>

<section class="right">
	<div class="controls" role="group" aria-label="Demo controls">
		<button type="button" on:click={handlePlayPause}>
			{isPlaying ? 'Pause' : activeIndex >= steps.length - 1 ? 'Replay' : 'Play'}
		</button>
		<button type="button" on:click={goPrev} aria-label="Previous step">
			←
		</button>
		<button type="button" on:click={goNext} aria-label="Next step">
			→
		</button>
		<button type="button" on:click={reset}>Reset</button>
		<label class="speed">
			Speed
			<select bind:value={playbackSpeedChoice}>
				<option value="0.5">0.5×</option>
				<option value="1">1×</option>
				<option value="2">2×</option>
			</select>
		</label>
	</div>

	{#if notif}
		<p class="toast" role="status">{notif}</p>
	{/if}

	<div class="panels">
		<div class="panel-item">
			<PromptBuilder prompt={prompt} enabled={formatReady} onCopy={copyPrompt}/>
		</div>
		<div class="panel-item">
			<PatchPreview patch={patch} enabled={fixReady} onCopy={copyDiff} />
		</div>
	</div>

	{#if showConfetti}
		<div class="confetti" aria-hidden="true">
			{#each confettiPieces as piece (piece.id)}
				<span
					class="confetti__piece"
					style={`left:${piece.left}%; --size:${piece.size}px; --drift:${piece.drift}px; animation-delay:${piece.delay}s; animation-duration:${piece.duration}s; background-color:hsl(${piece.hue}, 90%, 60%);`}
				></span>
			{/each}
		</div>
	{/if}
</section>

<style>
	.right {
		display: grid;
		grid-template-rows: auto 1fr;
		gap: 18px;
		background: rgba(10, 14, 19, 0.92);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 20px;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.015);
		min-height: 0;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: center;
		padding: 10px 14px;
		border-radius: 10px;
		border: 1px solid rgba(28, 34, 43, 0.9);
		background: rgba(6, 10, 15, 0.9);
	}

	.controls button,
	.controls select {
		font-size: 12px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: rgba(13, 17, 22, 0.85);
		color: var(--text);
		padding: 6px 12px;
	}

	.controls button:hover,
	.controls select:hover {
		border-color: rgba(116, 218, 255, 0.7);
	}

	.speed {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--muted);
		font-size: 12px;
	}

	.toast {
		margin: 0;
		padding: 8px 12px;
		border-radius: 10px;
		background: rgba(52, 238, 137, 0.15);
		border: 1px solid rgba(52, 238, 137, 0.35);
		color: var(--accent-green);
		font-size: 12px;
	}

	.panels {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
		min-height: 0;
		align-items: stretch;
	}

	.panel-item {
		min-height: 0;
		min-width: 0;
		display: flex;
		overflow: visible;
	}

	.panel-item :global(.panel) {
		flex: 1;
		min-height: 0;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.confetti {
		position: fixed;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
		z-index: 999;
	}

	.confetti__piece {
		position: absolute;
		top: -12vh;
		width: var(--size, 8px);
		height: calc(var(--size, 8px) * 2);
		border-radius: 2px;
		opacity: 0;
		animation-name: confetti-fall;
		animation-timing-function: linear;
		animation-fill-mode: forwards;
	}

	@keyframes confetti-fall {
		0% {
			transform: translate3d(0, -12vh, 0) rotate(0deg);
			opacity: 0;
		}
		10% {
			opacity: 1;
		}
		100% {
			transform: translate3d(var(--drift, 0px), 110vh, 0) rotate(720deg);
			opacity: 0;
		}
	}

	@media (max-width: 900px) {
		.panels {
			grid-template-columns: 1fr;
			grid-auto-rows: minmax(0, 1fr);
		}
	}

	@media (max-width: 720px) {
		.right {
			grid-template-rows: auto auto;
		}
	}
</style>
