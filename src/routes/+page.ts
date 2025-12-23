import { queryKeys } from '$lib/query/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { queryClient, session } = await parent();

	await queryClient.prefetchQuery({
		queryKey: queryKeys.events.all,
		queryFn: async () => {
			const params = new URLSearchParams({
				limit: '20',
				active: 'true',
				archived: 'false',
				closed: 'false',
				order: 'volume24hr',
				ascending: 'false',
				offset: '0'
			});

			const response = await fetch(`/api/events?${params.toString()}`);
			if (!response.ok) {
				throw new Error('Failed to fetch trending events');
			}
			return response.json();
		}
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
