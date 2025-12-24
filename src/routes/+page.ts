import { queryKeys } from '$lib/query/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { queryClient, session } = await parent();

	// Prefetch infinite query for trending events
	await queryClient.prefetchInfiniteQuery({
		queryKey: ['events', 'trending'],
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
		getNextPageParam: (lastPage: any) => {
			if (lastPage.length < 20) return undefined;
			return undefined; // Only prefetch first page
		},
		initialPageParam: 0,
		pages: 1
	});

	if (session?.user) {
		await queryClient.prefetchQuery({
			queryKey: queryKeys.watchlist.all,
			queryFn: async () => {
				const response = await fetch('/api/watchlist');
				if (!response.ok) return [];
				return response.json();
			}
		});
	}

	return {};
};
