<script lang="ts">
	const steps = [
		{
			title: 'Install the extension',
			body: 'Open the VS Code Extensions tab, search “RealityCheck”, install it, and reload once prompted.'
		},
		{
			title: 'Link the MCP server',
			body: 'Add the RealityCheck MCP server to your coding agent so it can request context, prompts, and patches.'
		},
		{
			title: 'Debug more efficiently',
			body: 'Use RealityCheck to stream events, inspect prompts, and apply minimal fixes without leaving your editor.'
		}
	];
</script>

<main class="page">
	<header>
		<p class="eyebrow">QUICKSTART</p>
		<h1>Three steps to RealityCheck readiness</h1>
		<p class="lede">
			Run through this short checklist to connect RealityCheck to your coding agent and keep every debugging session grounded.
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

</style>
