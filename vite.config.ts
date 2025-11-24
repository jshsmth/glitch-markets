import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
	plugins: [sveltekit(), mkcert()],
	server: {
		https: true
	},
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
