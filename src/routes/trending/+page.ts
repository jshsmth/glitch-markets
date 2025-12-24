import type { PageLoad } from './$types';
import type { Event } from '$lib/server/api/polymarket-client';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { queryClient } = await parent();

	await queryClient.prefetchInfiniteQuery({
		queryKey: ['events', 'trending', 'volume24hr'],
		queryFn: async ({ pageParam = 0 }) => {
			const params = new URLSearchParams({
				active: 'true',
				archived: 'false',
				closed: 'false',
				order: 'volume24hr',
				ascending: 'false',
				limit: '20',
				offset: String(pageParam)
			});

			const response = await fetch(`/api/events?${params.toString()}`);
			if (!response.ok) {
				throw new Error('Failed to fetch trending events');
			}
			return response.json();
		},
		getNextPageParam: (lastPage: Event[]) => {
			if (lastPage.length < 20) return undefined;
			return undefined;
		},
		initialPageParam: 0,
		pages: 1
	});

	return {};
};
