<script lang="ts">
	import type { PatchSuggestion } from '../types/demo';
	import { browser } from '$app/environment';

	export let patch: PatchSuggestion;
	export let enabled = false;
	export let onCopy: () => void;

	const copy = async () => {
		if (!enabled) return;
		try {
			if (browser && navigator.clipboard) {
				await navigator.clipboard.writeText(patch.diff);
				onCopy();
			}
		} catch (error) {
			console.warn('Unable to copy diff', error);
		}
	};
</script>

<section class="panel">
	<header class="panel__header">
		<div>
			<p class="panel__title">PATCH PREVIEW</p>
			<p class="panel__subtitle">Minimal diff proposed by agent</p>
		</div>
		<button class="copy-btn" type="button" on:click={copy} disabled={!enabled}>Copy diff</button>
	</header>

	<div class="panel__body">
		{#if !enabled}
			<p class="placeholder">Patch preview unlocks after agent responds.</p>
		{:else}
			<div class="content">
				<h3>Rationale</h3>
				<ul class="reasons">
					{#each patch.rationale as reason}
						<li>{reason}</li>
					{/each}
				</ul>
				<h3>Diff</h3>
				<pre class="diff">{patch.diff}</pre>
			</div>
		{/if}
	</div>
</section>

<style>
	.panel {
		border: 1px solid var(--border);
		border-radius: 12px;
		background: rgba(10, 14, 19, 0.9);
		padding: 14px;
		display: grid;
		grid-template-rows: auto 1fr;
		gap: 12px;
		min-height: 0;
	}

	.panel__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}

	.panel__title {
		margin: 0;
		font-size: 11px;
		color: var(--muted);
		letter-spacing: 0.3em;
	}

	.panel__subtitle {
		margin: 4px 0 0;
		font-size: 12px;
		color: var(--muted);
	}

	.panel__body {
		min-height: 0;
		display: flex;
		flex-direction: column;
	}

	.copy-btn {
		border: 1px solid var(--border);
		background: rgba(13, 17, 22, 0.8);
		color: var(--text);
		font-size: 12px;
		padding: 6px 12px;
		border-radius: 8px;
	}

	.copy-btn:not(:disabled):hover {
		border-color: rgba(116, 218, 255, 0.7);
		box-shadow: 0 0 0 5px var(--ring);
	}

	.copy-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.placeholder {
		margin: 0;
		text-align: center;
		padding: 20px;
		color: var(--muted);
		border: 1px dashed var(--border);
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: 10px;
		font-size: 13px;
		min-height: 0;
		overflow: auto;
		padding-right: 4px;
	}

	h3 {
		margin: 0;
		font-size: 12px;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.reasons {
		margin: 6px 0 0 16px;
		padding: 0;
		color: var(--text);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.diff {
		background: rgba(5, 8, 12, 0.9);
		border-radius: 10px;
		padding: 14px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		white-space: pre;
		word-break: keep-all;
		overflow-x: auto;
		overflow-y: auto;
	}
</style>
