<script lang="ts">
	import '$styles/global.css';
import { onMount } from 'svelte';
import { prefersReducedMotion } from '$lib/stores/preferences';
import { browser } from '$app/environment';

	onMount(() => {
		if (!browser) return;
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const update = () => prefersReducedMotion.set(media.matches);
		update();
		media.addEventListener('change', update);

	return () => {
		media.removeEventListener('change', update);
	};
	});
</script>

<slot />
