<script lang="ts">
	const marketplaceUrl =
		'https://marketplace.visualstudio.com/items?itemName=agent-debugger.extension';
</script>

<section class="ext-card" aria-labelledby="ext-title">
	<div class="icon" aria-hidden="true">RC</div>
	<div class="meta">
		<h2 id="ext-title">RealityCheck</h2>
		<p class="publisher">RealityCheck Team</p>
		<div class="row">
			<span class="chip">v0.0.1</span>
			<span class="chip">Debugging</span>
		</div>
		<div class="row small" aria-hidden="true">
			<span>★ 5.0</span>
			<span>·</span>
			<span>5 installs</span>
		</div>
	</div>
	<div class="actions">
		<a class="btn" href="/quickstart">Details</a>
	</div>
</section>

<style>
	.ext-card {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 16px;
		align-items: center;
		padding: 16px 18px;
		border-radius: 12px;
		border: 1px solid var(--border);
		background: linear-gradient(140deg, rgba(13, 17, 22, 0.95), rgba(6, 9, 14, 0.95));
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.015);
	}

	.icon {
		width: 46px;
		height: 46px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 14px;
		letter-spacing: 1px;
		color: var(--text);
		background: linear-gradient(135deg, rgba(116, 218, 255, 0.4), rgba(52, 238, 137, 0.32));
		box-shadow: 0 0 12px rgba(116, 218, 255, 0.15);
	}

	.meta h2 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
	}

	.publisher {
		margin: 4px 0 8px;
		font-size: 13px;
		color: var(--muted);
	}

	.row {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 12px;
		color: var(--muted);
	}

	.row.small {
		margin-top: 6px;
		font-size: 11px;
		opacity: 0.8;
	}

	.chip {
		padding: 2px 10px;
		border-radius: 999px;
		background: rgba(116, 218, 255, 0.12);
		color: var(--accent-blue);
		border: 1px solid rgba(116, 218, 255, 0.25);
	}

	.actions {
		display: flex;
		gap: 8px;
	}

.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 8px 16px;
	border-radius: 8px;
	border: 1px solid rgba(28, 34, 43, 0.9);
	background: rgba(10, 14, 19, 0.9);
	color: var(--text);
	font-size: 13px;
	text-decoration: none;
	transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

	.btn:hover {
		border-color: rgba(116, 218, 255, 0.7);
		box-shadow: 0 0 0 6px var(--ring);
	}

	@media (max-width: 640px) {
		.ext-card {
			grid-template-columns: 1fr;
			text-align: center;
		}

		.actions {
			justify-content: center;
			flex-wrap: wrap;
		}
	}
</style>
