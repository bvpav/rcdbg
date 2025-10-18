<script lang="ts">
import Stepper, { type Step } from './Stepper.svelte';
import EventStream, { type LogLine } from './EventStream.svelte';
import StateInspector from './StateInspector.svelte';
import PromptBuilder from './PromptBuilder.svelte';
import PatchPreview from './PatchPreview.svelte';
import ExtensionsCard from './ExtensionsCard.svelte';
import { snapshotsData } from '$data/snapshots';
import { promptData } from '$data/prompt';
import patchDiffSource from '$data/patch.diff?raw';
import type { DebugSnapshot, PatchSuggestion, PromptPayload, Frame } from '$lib/types/demo';
import { browser } from '$app/environment';
import { createEventDispatcher, onDestroy } from 'svelte';

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
			return;
		}
		const base = baseDurations[activeIndex];
		const adjusted = Math.max(800, base / Math.max(playbackSpeed, 0.5));
		timer = setTimeout(() => {
			activeIndex = Math.min(activeIndex + 1, steps.length - 1);
			if (activeIndex >= steps.length - 1) {
				isPlaying = false;
			}
		}, adjusted);
	};

	$: schedule();

	onDestroy(() => resetTimer());

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
			activeIndex = 0;
		}
		isPlaying = !isPlaying;
	};

	const goNext = () => {
		activeIndex = Math.min(activeIndex + 1, steps.length - 1);
		isPlaying = false;
	};

	const goPrev = () => {
		activeIndex = Math.max(activeIndex - 1, 0);
		isPlaying = false;
	};

	const reset = () => {
		activeIndex = 0;
		isPlaying = false;
		showJson = false;
		notif = null;
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
		<EventStream lines={displayedLogs} speed={playbackSpeed} />
<!--		<StateInspector-->
<!--				frames={currentFrames}-->
<!--				{activeFrameId}-->
<!--				showJson={showJson}-->
<!--				onToggleJson={() => (showJson = !showJson)}-->
<!--		/>-->
		<PatchPreview patch={patch} enabled={fixReady} onCopy={copyDiff} />
		<div class="prompt-builder">
			<PromptBuilder prompt={prompt} enabled={formatReady} onCopy={copyPrompt}/>
		</div>
	</div>
</section>

<style>
	.right {
		display: flex;
		flex-direction: column;
		gap: 18px;
		background: rgba(10, 14, 19, 0.92);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 20px;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.015);
	}

	.stepper-wrap {
		display: flex;
		flex-direction: column;
		gap: 12px;
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
		grid-template-columns: 1fr;
		gap: 16px;
	}

	.panels :global(.prompt-builder) {
		width: 100%;
		grid-column: 1 / -1; /* spans all columns when grid is 2-col layout */
	}

	@media (min-width: 1080px) {
		.panels {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 720px) {
		.panels {
			grid-template-columns: 1fr;
		}
	}
</style>
