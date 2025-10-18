<script lang="ts">
	import type { Frame } from '$lib/types/demo';
	import { onMount } from 'svelte';

	export let frames: Frame[] = [];
	export let activeFrameId: string | null = null;
	export let showJson = false;
	export let onToggleJson: () => void;

	let rawJson = '';

	onMount(() => {
		rawJson = JSON.stringify(frames, null, 2);
	});

	$: if (showJson) {
		rawJson = JSON.stringify(frames, null, 2);
	}

let expanded = new Set<string>();

$: {
	let updated = false;
	for (const frame of frames) {
		if (!expanded.has(frame.id) && frame.id === activeFrameId) {
			expanded.add(frame.id);
			updated = true;
		}
	}
	if (updated) {
		expanded = new Set(expanded);
	}
}

const toggleFrame = (id: string) => {
	const next = new Set(expanded);
	if (next.has(id)) {
		next.delete(id);
	} else {
		next.add(id);
	}
	expanded = next;
};
</script>

<section class="panel">
	<header class="panel__header">
		<div>
			<p class="panel__title">STATE INSPECTOR</p>
			<p class="panel__subtitle">Call stack &amp; locals</p>
		</div>
		<button class="json-toggle" type="button" on:click={onToggleJson}>
			{showJson ? 'Hide JSON' : 'Show JSON'}
		</button>
	</header>

	{#if showJson}
		<pre class="json-dump">{rawJson}</pre>
	{:else if frames.length === 0}
		<p class="placeholder">Frames will appear once execution pauses.</p>
	{:else}
		<div class="frames">
			{#each frames as frame (frame.id)}
				<article
					class={`frame ${frame.id === activeFrameId ? 'frame--active' : ''}`}
					role="group"
					aria-labelledby={`frame-${frame.id}`}
				>
					<button
						type="button"
						class="frame__header"
						id={`frame-${frame.id}`}
						on:click={() => toggleFrame(frame.id)}
					>
						<span class="frame__chevron" aria-hidden="true">
							{expanded.has(frame.id) ? '▾' : '▸'}
						</span>
						<span class="frame__label">{frame.fn}()</span>
						<span class="frame__file">{frame.file}:{frame.line}</span>
					</button>
					{#if expanded.has(frame.id)}
						<ul class="locals">
							{#each frame.locals as local}
								<li>
									<span class="name">{local.name}</span>
									<span class="type">{local.type}</span>
									<span class="value">{local.value}</span>
								</li>
							{/each}
						</ul>
					{/if}
				</article>
			{/each}
		</div>
	{/if}
</section>

<style>
	.panel {
		border: 1px solid var(--border);
		border-radius: 12px;
		background: rgba(10, 14, 19, 0.9);
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.panel__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
	}

	.panel__title {
		margin: 0;
		font-size: 11px;
		letter-spacing: 0.3em;
		color: var(--muted);
	}

	.panel__subtitle {
		margin: 4px 0 0;
		font-size: 12px;
		color: var(--muted);
	}

	.json-toggle {
		border: 1px solid var(--border);
		background: rgba(13, 17, 22, 0.8);
		color: var(--text);
		font-size: 12px;
		padding: 6px 12px;
		border-radius: 8px;
	}

	.json-toggle:hover {
		border-color: rgba(116, 218, 255, 0.7);
		box-shadow: 0 0 0 5px var(--ring);
	}

	.json-dump {
		background: rgba(5, 8, 12, 0.9);
		border-radius: 10px;
		padding: 14px;
		max-height: 260px;
		overflow: auto;
		font-size: 12px;
	}

	.placeholder {
		margin: 0;
		padding: 20px;
		text-align: center;
		color: var(--muted);
		border: 1px dashed var(--border);
		border-radius: 10px;
	}

	.frames {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.frame {
		border: 1px solid var(--border);
		border-radius: 10px;
		background: rgba(10, 14, 19, 0.8);
		overflow: hidden;
	}

	.frame--active {
		border-color: rgba(116, 218, 255, 0.75);
		box-shadow: 0 0 0 4px rgba(116, 218, 255, 0.08);
	}

	.frame__header {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 12px;
		background: transparent;
		color: var(--text);
		border: none;
		text-align: left;
		font-size: 13px;
	}

	.frame__file {
		margin-left: auto;
		font-size: 11px;
		color: var(--muted);
	}

	.locals {
		list-style: none;
		margin: 0;
		padding: 8px 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 12px;
	}

	.locals li {
		display: grid;
		grid-template-columns: 120px 120px 1fr;
		gap: 12px;
		align-items: baseline;
	}

	.name {
		color: var(--text);
		font-weight: 600;
	}

	.type {
		color: var(--muted);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.value {
		color: var(--accent-blue);
	}

	@media (max-width: 720px) {
		.locals li {
			grid-template-columns: 1fr;
		}
	}
</style>
