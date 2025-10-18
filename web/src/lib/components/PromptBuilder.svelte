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

	{#if !enabled}
		<p class="placeholder">Prompt becomes available after context is formatted.</p>
	{:else}
		<section class="content">
			<h3>Failure</h3>
			<p class="failure">
				<strong>{prompt.failure.message}</strong>
				<span>{prompt.failure.file}:{prompt.failure.line}</span>
			</p>
			<h3>Constraints</h3>
			<ul class="constraints">
				{#each prompt.constraints as item}
					<li>{item}</li>
				{/each}
			</ul>
			<h3>Frames</h3>
			{#each prompt.frames as frame}
				<div class="frame">
					<p class="frame__label">{frame.fn}()</p>
					<p class="frame__file">{frame.file}:{frame.line}</p>
					<ul class="frame__locals">
						{#each frame.locals as local}
							<li>
								<span class="name">{local.name}</span>
								<span class="value">{local.value}</span>
								<span class="type">{local.type}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
			{#if prompt.repoContext}
				<h3>Repository snapshot</h3>
				<ul class="repo">
					{#each prompt.repoContext.files as file}
						<li>
							{file.path}
							<span>{file.digest}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
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

	.placeholder {
		margin: 0;
		text-align: center;
		padding: 20px;
		color: var(--muted);
		border: 1px dashed var(--border);
		border-radius: 10px;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: 10px;
		font-size: 13px;
	}

	h3 {
		margin: 12px 0 0;
		font-size: 12px;
		color: var(--muted);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.content h3:first-child {
		margin-top: 0;
	}

	.failure {
		display: flex;
		gap: 12px;
		align-items: center;
		margin: 4px 0 0;
	}

	.failure span {
		font-size: 12px;
		color: var(--muted);
	}

	.constraints {
		list-style: decimal-leading-zero;
		margin: 6px 0 0 22px;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
		color: var(--text);
	}

	.frame {
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 10px;
		background: rgba(5, 8, 12, 0.8);
	}

	.frame__label {
		margin: 0;
		font-weight: 600;
		color: var(--text);
		font-size: 13px;
	}

	.frame__file {
		margin: 4px 0 8px;
		font-size: 12px;
		color: var(--muted);
	}

	.frame__locals {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.frame__locals li {
		display: grid;
		grid-template-columns: 120px 1fr auto;
		gap: 8px;
		align-items: baseline;
		font-size: 12px;
	}

	.frame__locals .name {
		color: var(--text);
		font-weight: 600;
	}

	.frame__locals .value {
		color: var(--accent-blue);
	}

	.frame__locals .type {
		color: var(--muted);
		font-size: 11px;
		text-transform: uppercase;
	}

	.repo {
		list-style: none;
		margin: 6px 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 12px;
		color: var(--muted);
	}

	.repo span {
		margin-left: 8px;
		color: var(--muted);
		font-size: 11px;
	}

	@media (max-width: 720px) {
		.frame__locals li {
			grid-template-columns: 1fr;
		}
	}
</style>
