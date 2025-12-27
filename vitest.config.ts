import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit(), svelte({ hot: !process.env.VITEST })],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/lib/tests/setup.ts'],
		clearMocks: true,
		restoreMocks: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			include: ['src/lib/**/*.ts', 'src/routes/**/*.ts'],
			exclude: [
				'node_modules/',
				'src/lib/tests/',
				'**/*.d.ts',
				'**/*.config.{js,ts}',
				'**/mockData',
				'**/*.{test,spec}.{js,ts}'
			]
		}
	}
});
