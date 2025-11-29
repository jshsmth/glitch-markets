import { QueryClient } from '@tanstack/svelte-query';
import { browser } from '$app/environment';

// Singleton QueryClient instance for client-side navigation
let browserQueryClient: QueryClient | undefined;

/**
 * Gets or creates a QueryClient instance with SSR-safe defaults for SvelteKit.
 * Uses a singleton pattern on the client to persist cache across navigations.
 * Queries are disabled on the server to prevent async execution after HTML is sent.
 */
export function createQueryClient(): QueryClient {
	// Server-side: always create a new instance
	if (!browser) {
		return new QueryClient({
			defaultOptions: {
				queries: {
					enabled: false,
					staleTime: 60 * 1000,
					gcTime: 5 * 60 * 1000,
					retry: 1,
					refetchOnWindowFocus: false
				}
			}
		});
	}

	// Client-side: reuse singleton to persist cache across navigations
	if (!browserQueryClient) {
		browserQueryClient = new QueryClient({
			defaultOptions: {
				queries: {
					enabled: true,
					staleTime: 60 * 1000,
					gcTime: 5 * 60 * 1000,
					retry: 1,
					refetchOnWindowFocus: false
				}
			}
		});
	}

	return browserQueryClient;
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
