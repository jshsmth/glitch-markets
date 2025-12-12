import { QueryClient } from '@tanstack/svelte-query';
import { browser } from '$app/environment';
import { QUERY_CACHE } from '$lib/config/constants';

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
					staleTime: QUERY_CACHE.STALE_TIME,
					gcTime: QUERY_CACHE.GC_TIME,
					retry: QUERY_CACHE.RETRY_COUNT,
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
					staleTime: QUERY_CACHE.STALE_TIME,
					gcTime: QUERY_CACHE.GC_TIME,
					retry: QUERY_CACHE.RETRY_COUNT,
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
		trending: (offset: number, sort: string) => ['events', 'trending', offset, sort] as const,
		new: (offset: number, sort: string) => ['events', 'new', offset, sort] as const,
		byCategory: (category: string, filters: Record<string, unknown>) =>
			['events', 'category', category, filters] as const,
		detail: (slug: string) => ['events', 'detail', slug] as const
	},
	traders: {
		all: ['traders'] as const,
		leaderboard: (
			category: string,
			timePeriod: string,
			orderBy: string,
			limit: number,
			offset: number
		) => ['traders', 'leaderboard', category, timePeriod, orderBy, limit, offset] as const
	},
	builders: {
		all: ['builders'] as const,
		leaderboard: (timePeriod: string, limit: number, offset: number) =>
			['builders', 'leaderboard', timePeriod, limit, offset] as const,
		volume: (timePeriod: string) => ['builders', 'volume', timePeriod] as const
	}
};
