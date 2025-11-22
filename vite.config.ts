import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/lib/tests/setup.ts']
	},
	resolve: process.env.VITEST
		? {
				conditions: ['browser']
			}
		: undefined
});
