

<script lang="ts">
	import { editorLines } from '$data/editor-snippet';
	import type { FrameVar } from '$lib/types/demo';

	export let activeLine: number | null = null;
	export let variables: FrameVar[] = [];

	$: highlightedLine = activeLine ?? editorLines[0]?.number ?? null;
	$: visibleVariables = variables.slice(0, 3);

	const keywordRegex = /\b(def|return|if|else|for|in|raise|print|main)\b/g;
	const builtinsRegex = /\b(ValueError|ZeroDivisionError|log)\b/g;
	const numberRegex = /(?<![\w_])(?:0|[1-9]\d*)(?![\w_])/g;

	const highlight = (line: string) => {
		const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return escaped
			.replace(keywordRegex, '<span class="kw">$1</span>')
			.replace(builtinsRegex, '<span class="builtin">$1</span>')
			.replace(numberRegex, '<span class="num">$&</span>');
	};
</script>

<section class="editor" aria-label="Read-only editor preview">
	<header class="editor__tabs" aria-hidden="true">
		<div class="tab tab--active">main.py</div>
		<div class="tab">math_utils.py</div>
		<div class="tab tab--disabled">README.md</div>
	</header>
	<div class="editor__toolbar" aria-hidden="true">
		<span class="crumb">workspace</span>
		<span class="chevron">›</span>
		<span class="crumb">queue</span>
		<span class="chevron">›</span>
		<span class="crumb crumb--active">main.py</span>
	</div>
	<div class="editor__pane">
		<div class="code" aria-label="Sample code">
			{#each editorLines as entry}
				<div class="line-row" class:line-row--active={entry.number === highlightedLine}>
					<span class="line-row__number">{entry.number}</span>
					<div class="line-row__body">
						<div class="code__text">
							{@html highlight(entry.text || '&nbsp;')}
						</div>
						{#if entry.number === highlightedLine && visibleVariables.length}
							<ul class="locals" aria-label="Active variables">
								{#each visibleVariables as local}
									<li>{local.name} = <span>{local.value}</span></li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.editor {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--panel);
		border-radius: 16px;
		border: 1px solid var(--border);
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.01);
		overflow: hidden;
	}

	.editor__tabs {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 10px 12px;
		background: rgba(12, 16, 22, 0.85);
		border-bottom: 1px solid var(--border);
	}

	.tab {
		padding: 6px 12px;
		border-radius: 8px;
		font-size: 13px;
		color: var(--muted);
		background: transparent;
	}

	.tab--active {
		background: rgba(116, 218, 255, 0.12);
		color: var(--text);
		box-shadow: 0 0 0 1px rgba(116, 218, 255, 0.25);
	}

	.tab--disabled {
		opacity: 0.4;
	}

	.editor__toolbar {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		font-size: 12px;
		color: var(--muted);
		border-bottom: 1px solid var(--border);
	}

	.crumb--active {
		color: var(--text);
	}

	.chevron {
		opacity: 0.6;
	}

	.editor__pane {
		display: flex;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.code {
		flex: 1;
		padding: 16px 0;
		display: flex;
		flex-direction: column;
		gap: 3px;
		font-size: 13px;
		line-height: 1.6;
	}

	.line-row {
		position: relative;
		display: grid;
		grid-template-columns: 48px 1fr;
		align-items: flex-start;
		padding: 0 18px;
	}

	.line-row__number {
		text-align: right;
		padding-right: 12px;
		font-size: 12px;
		color: #5c6773;
		font-family: 'JetBrains Mono', monospace;
		user-select: none;
	}

	.line-row--active {
		background: rgba(116, 218, 255, 0.06);
		border-left: 3px solid var(--accent-blue);
		border-radius: 6px;
	}

	.line-row--active .line-row__number {
		color: var(--accent-blue);
	}

	.line-row--active::before {
		content: '';
		position: absolute;
		left: 10px;
		top: 0.7em;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent-blue);
		box-shadow: 0 0 12px rgba(116, 218, 255, 0.5);
	}

	.line-row__body {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.code__text {
		flex: 1;
		color: var(--text);
		font-family: 'JetBrains Mono', monospace;
		white-space: pre;
	}

	.locals {
		margin: 0;
		padding: 4px 8px;
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		background: rgba(13, 19, 26, 0.9);
		border: 1px solid rgba(116, 218, 255, 0.25);
		border-radius: 8px;
		font-size: 11px;
		color: var(--muted);
	}

	.locals li span {
		color: var(--accent-green);
	}

	:global(.kw) {
		color: #7cd0ff;
	}

	:global(.builtin) {
		color: #9d7dff;
	}

	:global(.num) {
		color: #ffb86c;
	}

	@media (max-width: 900px) {
		.editor {
			border-radius: 12px;
		}
	}
</style>
