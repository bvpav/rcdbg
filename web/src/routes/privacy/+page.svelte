<main class="page">
	<header>
		<p class="eyebrow">PRIVACY</p>
		<h1>How Agent Debugger handles data</h1>
		<p class="lede">
			The interactive demo is fully offline. The extension sends debugging context only to your configured agent
			endpoint—never to us.
		</p>
	</header>

	<section class="card">
		<ul>
			<li>No source code leaves your machine unless your agent relays it.</li>
			<li>Plausible analytics is optional, cookie-free, and aggregates page views only.</li>
			<li>The homepage demo uses bundled JSON and diff files with zero network calls.</li>
		</ul>
	</section>

	<section class="card">
		<p>
			Questions? Email <a href="mailto:privacy@agent-debugger.dev">privacy@agent-debugger.dev</a> or open an issue
			in
			<a href="https://github.com/agent-debugger/agent-debugger/issues" target="_blank" rel="noopener">
				GitHub
			</a>.
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
		gap: 28px;
	}

	.eyebrow {
		font-size: 11px;
		letter-spacing: 0.3em;
		color: var(--muted);
		text-transform: uppercase;
		margin: 0;
	}

	h1 {
		margin: 12px 0 8px;
		font-size: clamp(28px, 4vw, 36px);
	}

	.lede {
		margin: 0;
		color: var(--muted);
		line-height: 1.6;
	}

	.card {
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 20px;
		background: rgba(13, 17, 22, 0.92);
		color: var(--muted);
		line-height: 1.6;
	}

	ul {
		margin: 0;
		padding-left: 20px;
	}
</style>
