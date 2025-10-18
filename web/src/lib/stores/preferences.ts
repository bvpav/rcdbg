import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const initial = browser ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

export const prefersReducedMotion = writable(initial);

if (browser) {
	const media = window.matchMedia('(prefers-reduced-motion: reduce)');
	const handler = (event: MediaQueryListEvent) => prefersReducedMotion.set(event.matches);
	media.addEventListener('change', handler);
}
