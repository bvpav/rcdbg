<main class="page">
	<header>
		<p class="eyebrow">DOCS</p>
		<h1>Documentation pointers</h1>
		<p class="lede">
			The full reference lives in GitHub. Use these shortcuts to jump directly to the pieces you need.
		</p>
	</header>

	<section class="cards">
		<article>
			<h2>Quickstart notebook</h2>
			<p>
				Step-by-step walkthrough for running the Agent Debugger extension locally or in a remote container.
			</p>
			<a href="https://github.com/agent-debugger/docs#quickstart" target="_blank" rel="noopener">
				Read quickstart →
			</a>
		</article>
		<article>
			<h2>Agent API reference</h2>
			<p>
				REST and WebSocket surfaces for launching sessions, streaming frames, evaluating expressions, and
				applying patches.
			</p>
			<a href="https://github.com/agent-debugger/docs/api" target="_blank" rel="noopener">
				View API →
			</a>
		</article>
		<article>
			<h2>Examples</h2>
			<p>
				Python and TypeScript automations that demonstrate guarded prompt handoffs and diff validation flows.
			</p>
			<a href="https://github.com/agent-debugger/examples" target="_blank" rel="noopener">
				Browse examples →
			</a>
		</article>
	</section>

	<section class="support">
		<p class="eyebrow">Support</p>
		<p>
			Need help or want to suggest a feature? Open an issue in
			<a href="https://github.com/agent-debugger/agent-debugger/issues" target="_blank" rel="noopener">
				agent-debugger/issues
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
		gap: 32px;
	}

	.eyebrow {
		font-size: 11px;
		letter-spacing: 0.3em;
		color: var(--muted);
		text-transform: uppercase;
		margin: 0;
	}

	h1 {
		margin: 12px 0 10px;
		font-size: clamp(28px, 4vw, 36px);
	}

	.lede {
		margin: 0;
		color: var(--muted);
		line-height: 1.6;
	}

	.cards {
		display: grid;
		gap: 18px;
	}

	article {
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 20px;
		background: rgba(13, 17, 22, 0.92);
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	h2 {
		margin: 0;
		font-size: 18px;
	}

	p {
		margin: 0;
		color: var(--muted);
		line-height: 1.55;
	}

	a {
		color: var(--accent-blue);
		font-weight: 600;
	}

	.support {
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 18px;
		background: rgba(10, 14, 19, 0.9);
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
</style>
