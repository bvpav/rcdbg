<script lang="ts">
	import type { PromptPayload } from '$lib/types/demo';
	import { browser } from '$app/environment';

	export let prompt: PromptPayload;
	export let enabled = false;
	export let onCopy: () => void;

	const buildPrompt = () => {
		const header = `${prompt.failure.file}:${prompt.failure.line} — ${prompt.failure.message}`;
		const constraints = prompt.constraints.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
		const frames = prompt.frames
			.map(
				(frame) =>
					`• ${frame.fn} (${frame.file}:${frame.line})\n${frame.locals
						.map((local) => `    - ${local.name}: ${local.value}`)
						.join('\n')}`
			)
			.join('\n');

		const repo = prompt.repoContext
			? `Repository files:\n${prompt.repoContext.files
					.map((file) => `  - ${file.path} (${file.digest})`)
					.join('\n')}`
			: '';

		return `${header}\n\nConstraints:\n${constraints}\n\nFrames:\n${frames}\n\n${repo}`.trim();
	};

	const copy = async () => {
		if (!enabled) return;
		try {
			if (browser && navigator.clipboard) {
				await navigator.clipboard.writeText(buildPrompt());
				onCopy();
			}
		} catch (error) {
			console.warn('Unable to copy prompt', error);
		}
	};
</script>

<section class="panel">
	<header class="panel__header">
		<div>
			<p class="panel__title">PROMPT BUILDER</p>
			<p class="panel__subtitle">Constraints for minimal patching</p>
		</div>
		<button class="copy-btn" type="button" on:click={copy} disabled={!enabled}>
			Copy prompt
		</button>
	</header>

	<div class="panel__body">
		{#if !enabled}
			<p class="placeholder">Prompt becomes available after context is formatted.</p>
		{:else}
			<div class="content">
				<pre class="prompt-text">{buildPrompt()}</pre>
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
		align-items: center;
		justify-content: space-between;
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

	.copy-btn {
		border: 1px solid var(--border);
		border-radius: 8px;
		background: rgba(13, 17, 22, 0.8);
		color: var(--text);
		font-size: 12px;
		padding: 6px 12px;
	}

	.copy-btn:not(:disabled):hover {
		border-color: rgba(116, 218, 255, 0.7);
		box-shadow: 0 0 0 5px var(--ring);
	}

	.copy-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.panel__body {
		min-height: 0;
		display: flex;
		flex-direction: column;
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
		min-height: 0;
		overflow: auto;
		padding-right: 4px;
	}

	.prompt-text {
		margin: 0;
		background: rgba(5, 8, 12, 0.9);
		border-radius: 10px;
		padding: 12px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		line-height: 1.6;
		color: var(--text);
		white-space: pre;
		word-break: keep-all;
		overflow-x: auto;
		overflow-y: auto;
	}
</style>
