import type { PageServerLoad } from './$types';
import { Logger } from '$lib/server/utils/logger';
import { fetchWithTimeout } from '$lib/server/utils/fetch-with-timeout';

const logger = new Logger({ component: 'LeaderboardPage' });

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	setHeaders({
		'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600'
	});

	try {
		const tradersParams = new URLSearchParams({
			category: 'OVERALL',
			timePeriod: 'DAY',
			orderBy: 'PNL',
			limit: '50',
			offset: '0'
		});

		const buildersParams = new URLSearchParams({
			timePeriod: 'DAY',
			limit: '50',
			offset: '0'
		});

		const [tradersResponse, buildersResponse] = await Promise.all([
			fetchWithTimeout(`/api/traders/leaderboard?${tradersParams.toString()}`),
			fetchWithTimeout(`/api/builders/leaderboard?${buildersParams.toString()}`)
		]);

		const traders = tradersResponse.ok ? await tradersResponse.json() : [];
		const builders = buildersResponse.ok ? await buildersResponse.json() : [];

		return {
			initialTraders: traders,
			initialBuilders: builders
		};
	} catch (err) {
		logger.error('Error loading leaderboard', {
			error: err instanceof Error ? err.message : 'Unknown error'
		});
		return {
			initialTraders: [],
			initialBuilders: []
		};
	}
};
