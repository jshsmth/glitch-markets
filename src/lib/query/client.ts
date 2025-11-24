import { QueryClient } from '@tanstack/svelte-query';
import { browser } from '$app/environment';

/**
 * Creates a new QueryClient instance with SSR-safe defaults for SvelteKit.
 * Queries are disabled on the server to prevent async execution after HTML is sent.
 */
export function createQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser,
				staleTime: 60 * 1000,
				gcTime: 5 * 60 * 1000,
				retry: 1,
				refetchOnWindowFocus: false
			}
		}
	});
}

/** Query key factories for consistent cache keys across the app. */
export const queryKeys = {
	markets: {
		all: ['markets'] as const,
		list: (filters?: Record<string, unknown>) => ['markets', 'list', filters] as const,
		detail: (id: string) => ['markets', 'detail', id] as const
	},
	events: {
		all: ['events'] as const,
		detail: (slug: string) => ['events', 'detail', slug] as const
	}
};
