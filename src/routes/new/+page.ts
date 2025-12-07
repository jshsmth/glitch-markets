import { queryKeys } from '$lib/query/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { queryClient } = await parent();

	await queryClient.prefetchQuery({
		queryKey: queryKeys.events.all,
		queryFn: async () => {
			const params = new URLSearchParams({
				limit: '20',
				active: 'true',
				archived: 'false',
				closed: 'false',
				order: 'startDate',
				ascending: 'false',
				offset: '0'
			});

			// Add exclude_tag_id parameters (100639 and 102169)
			params.append('exclude_tag_id', '100639');
			params.append('exclude_tag_id', '102169');

			const response = await fetch(`/api/events?${params.toString()}`);
			if (!response.ok) {
				throw new Error('Failed to fetch new events');
			}
			return response.json();
		}
	});

	return {};
};
