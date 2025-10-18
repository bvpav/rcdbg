<script module lang="ts">
	export type Step = {
		id: string;
		label: string;
		description: string;
	};
</script>

<script lang="ts">
	export let steps: Step[] = [];
	export let activeIndex = 0;
</script>

<nav class="stepper" aria-label="Demo steps">
	{#each steps as step, index (step.id)}
		<div class={`step ${index === activeIndex ? 'step--active' : ''}`}>
			<div class="step__badge" aria-hidden="true">{index + 1}</div>
			<div class="step__meta">
				<p class="step__label">{step.label}</p>
				<p class="step__desc">{step.description}</p>
			</div>
		</div>
	{/each}
</nav>

<style>
	.stepper {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 12px;
	}

	.step {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 10px 12px;
		border-radius: 12px;
		border: 1px solid var(--border);
		background: rgba(13, 17, 22, 0.75);
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.step--active {
		border-color: rgba(116, 218, 255, 0.8);
		box-shadow: 0 0 0 6px rgba(116, 218, 255, 0.08);
	}

	.step__badge {
		width: 28px;
		height: 28px;
		border-radius: 999px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		font-weight: 600;
		color: var(--text);
		background: rgba(116, 218, 255, 0.15);
		border: 1px solid rgba(116, 218, 255, 0.4);
	}

	.step__meta {
		display: flex;
		flex-direction: column;
	}

	.step__label {
		margin: 0;
		font-size: 13px;
		font-weight: 600;
		color: var(--text);
	}

	.step__desc {
		margin: 4px 0 0;
		font-size: 12px;
		color: var(--muted);
	}
</style>
