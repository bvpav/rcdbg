<script lang="ts">
	const steps = [
		{
			title: 'Install the extension',
			body: 'Open the VS Code Extensions tab, search “Agent Debugger”, and install into your active profile.'
		},
		{
			title: 'Authenticate your agent runtime',
			body: 'Expose AGENT_DEBUGGER_TOKEN to your orchestrator or hosted agent so each session is signed.'
		},
		{
			title: 'Approve workspace bridge',
			body: 'When prompted in VS Code, allow the extension to read files and stage patches for review.'
		},
		{
			title: 'Start the debug tunnel',
			body: 'Run `agent-debugger tunnel --project ./` from the workspace root to connect VS Code to your agent.'
		},
		{
			title: 'Hand off control',
			body: 'Trigger `debug.start` from your agent. The extension streams live stack, locals, and context to the prompt.'
		}
	];
</script>

<main class="page">
	<header>
		<p class="eyebrow">QUICKSTART</p>
		<h1>Five steps to agent-led debugging</h1>
		<p class="lede">
			This guide mirrors the interactive demo. Complete the steps once and you can replay the workflow across
			projects in under a minute.
		</p>
	</header>

	<ol class="steps">
		{#each steps as step, index}
			<li>
				<div class="badge">{index + 1}</div>
				<div>
					<h2>{step.title}</h2>
					<p>{step.body}</p>
				</div>
			</li>
		{/each}
	</ol>

	<section class="next">
		<p class="eyebrow">Next</p>
		<p>
			Read the <a href="/docs">docs overview</a> for API details or follow releases in the
			<a href="/changelog">changelog</a>.
		</p>
	</section>
</main>

<style>
	.page {
		max-width: 720px;
		margin: 0 auto;
		padding: 48px clamp(16px, 6vw, 32px);
		display: flex;
		flex-direction: column;
		gap: 36px;
	}

	.eyebrow {
		font-size: 11px;
		letter-spacing: 0.3em;
		color: var(--muted);
		text-transform: uppercase;
		margin: 0;
	}

	h1 {
		margin: 10px 0 12px;
		font-size: clamp(28px, 4vw, 38px);
	}

	.lede {
		margin: 0;
		color: var(--muted);
		line-height: 1.6;
	}

	.steps {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.steps li {
		display: flex;
		gap: 16px;
		padding: 16px 18px;
		border-radius: 14px;
		border: 1px solid var(--border);
		background: rgba(13, 17, 22, 0.9);
	}

	.badge {
		width: 32px;
		height: 32px;
		border-radius: 999px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		color: var(--text);
		background: rgba(116, 218, 255, 0.15);
		border: 1px solid rgba(116, 218, 255, 0.4);
	}

	h2 {
		margin: 0 0 6px;
		font-size: 18px;
	}

	p {
		margin: 0;
		color: var(--muted);
		line-height: 1.55;
	}

	.next {
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 18px;
		background: rgba(10, 14, 19, 0.9);
	}
</style>
