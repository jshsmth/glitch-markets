import { QueryClient } from '@tanstack/svelte-query';
import { browser } from '$app/environment';

/**
 * Creates a new QueryClient instance with SSR-safe defaults for SvelteKit.
 *
 * Key configurations:
 * - Queries are disabled on the server to prevent async execution after HTML is sent
 * - Sensible defaults for stale time, cache time, and retry logic
 * - Optimized for production use with minimal refetching
 */
export function createQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				// Disable queries on server to prevent SSR issues
				enabled: browser,
				// Data is considered fresh for 1 minute
				staleTime: 60 * 1000,
				// Unused data is garbage collected after 5 minutes
				gcTime: 5 * 60 * 1000,
				// Retry failed requests once
				retry: 1,
				// Don't refetch on window focus (can be noisy)
				refetchOnWindowFocus: false
			}
		}
	});
}

/**
 * Query key factories for consistent cache keys across the app.
 * Using factories ensures type safety and prevents typos.
 */
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
