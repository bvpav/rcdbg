<main class="page">
	<header>
		<p class="eyebrow">CHANGELOG</p>
		<h1>Recent releases</h1>
		<p class="lede">
			Every release is documented on GitHub. Highlights are mirrored here so you can scan what changed at a
			glance.
		</p>
	</header>

	<section class="entry">
		<h2>v0.8.0 · February 2025</h2>
		<ul>
			<li>VS Code-style landing page with interactive debug-to-agent demo.</li>
			<li>Guarded prompt builder and copyable diff preview.</li>
			<li>Deterministic offline data powering the launch → fix replay.</li>
		</ul>
		<a href="https://github.com/agent-debugger/changelog" target="_blank" rel="noopener">
			View full changelog →
		</a>
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

	.entry {
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 20px;
		background: rgba(13, 17, 22, 0.92);
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	h2 {
		margin: 0;
		font-size: 20px;
	}

	ul {
		margin: 0;
		padding-left: 20px;
		color: var(--muted);
		line-height: 1.55;
	}

	a {
		color: var(--accent-blue);
		font-weight: 600;
	}
</style>
