import { SvelteURLSearchParams } from 'svelte/reactivity';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { queryClient } = await parent();

	// Prefetch infinite query for new events
	await queryClient.prefetchInfiniteQuery({
		queryKey: ['events', 'new'],
		queryFn: async ({ pageParam = 0 }) => {
			const params = new SvelteURLSearchParams({
				active: 'true',
				archived: 'false',
				closed: 'false',
				order: 'startDate',
				ascending: 'false',
				limit: '20',
				offset: String(pageParam)
			});

			params.append('exclude_tag_id', '100639');
			params.append('exclude_tag_id', '102169');

			const response = await fetch(`/api/events?${params.toString()}`);
			if (!response.ok) {
				throw new Error('Failed to fetch new events');
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

	return {};
};
