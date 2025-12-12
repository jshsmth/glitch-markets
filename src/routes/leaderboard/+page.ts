import { queryKeys } from '$lib/query/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { queryClient } = await parent();

	await queryClient.prefetchQuery({
		queryKey: queryKeys.traders.leaderboard('OVERALL', 'DAY', 'PNL', 50, 0),
		queryFn: async () => {
			const params = new URLSearchParams({
				category: 'OVERALL',
				timePeriod: 'DAY',
				orderBy: 'PNL',
				limit: '50',
				offset: '0'
			});

			const response = await fetch(`/api/traders/leaderboard?${params.toString()}`);
			if (!response.ok) {
				throw new Error('Failed to fetch trader leaderboard');
			}
			return response.json();
		}
	});

	await queryClient.prefetchQuery({
		queryKey: queryKeys.builders.leaderboard('DAY', 50, 0),
		queryFn: async () => {
			const params = new URLSearchParams({
				timePeriod: 'DAY',
				limit: '50',
				offset: '0'
			});

			const response = await fetch(`/api/builders/leaderboard?${params.toString()}`);
			if (!response.ok) {
				throw new Error('Failed to fetch builder leaderboard');
			}
			return response.json();
		}
	});

	return {};
};
