import { queryKeys } from '$lib/query/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { queryClient } = await parent();

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

	return {};
};
