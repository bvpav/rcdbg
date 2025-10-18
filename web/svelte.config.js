import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

const config = {
	preprocess: preprocess({
		postcss: true
	}),
	compilerOptions: {
		runes: false
	},
	kit: {
		adapter: adapter(),
		alias: {
			$lib: 'src/lib',
			$data: 'src/lib/data',
			$components: 'src/lib/components',
			$styles: 'src/styles'
		}
	}
};

export default config;
