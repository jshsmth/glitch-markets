import { queryKeys } from '$lib/query/client';
import type { PageLoad } from './$types';

/**
 * Example page load function demonstrating SSR prefetching with TanStack Query.
 *
 * This approach:
 * - Prefetches data on the server before rendering
 * - Populates the QueryClient cache
 * - Prevents loading states on initial page load
 * - Preserves query metadata (timestamps, staleness)
 */
export const load: PageLoad = async ({ parent, fetch }) => {
	const { queryClient } = await parent();

	// Example: Prefetch a list of markets
	await queryClient.prefetchQuery({
		queryKey: queryKeys.markets.list({ limit: 10 }),
		queryFn: async () => {
			const response = await fetch('/api/markets?limit=10');
			if (!response.ok) {
				throw new Error('Failed to fetch markets');
			}
			return response.json();
		}
	});

	// Example: Prefetch a specific market (commented out)
	// await queryClient.prefetchQuery({
	//   queryKey: queryKeys.markets.detail('market-id'),
	//   queryFn: async () => {
	//     const response = await fetch('/api/markets/market-id');
	//     if (!response.ok) throw new Error('Failed to fetch market');
	//     return response.json();
	//   }
	// });

	return {};
};
