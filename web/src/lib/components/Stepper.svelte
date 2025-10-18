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
		<div class="stepper__group">
			<div class={`step ${index === activeIndex ? 'step--active' : ''}`}>
				<div class="step__badge" aria-hidden="true">{index + 1}</div>
				<div class="step__meta">
					<p class="step__label">{step.label}</p>
					<p class="step__desc">{step.description}</p>
				</div>
			</div>

			{#if index < steps.length - 1}
				<div class="step__arrow">
					<svg
							width="32"
							height="12"
							viewBox="0 0 32 12"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
					>
						<path
								d="M0 6h30M24 1l6 5-6 5"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
						/>
					</svg>
				</div>
			{/if}
		</div>
	{/each}
</nav>

<style>
	.stepper {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		flex-wrap: nowrap;
		padding: 10px 0;
		overflow-x: auto;
	}

	.stepper__group {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.step {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 10px 14px;
		border-radius: 12px;
		border: 1px solid var(--border);
		background: rgba(13, 17, 22, 0.75);
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
		min-width: 160px;
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
		flex-shrink: 0;
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

	.step__arrow {
		display: flex;
		align-items: center;
		color: var(--muted);
		opacity: 0.5;
		flex-shrink: 0;
	}

	@media (max-width: 800px) {
		.stepper {
			flex-wrap: wrap;
			gap: 10px;
		}
	}
</style>
