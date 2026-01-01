import type { PageServerLoad } from './$types';
import { Logger } from '$lib/utils/logger';

const logger = new Logger({ component: 'LeaderboardPage' });

export const load: PageServerLoad = async ({ setHeaders, fetch }) => {
	setHeaders({
		'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600'
	});

	try {
		const tradersParams = new URLSearchParams({
			category: 'OVERALL',
			timePeriod: 'ALL',
			orderBy: 'PNL',
			limit: '10',
			offset: '0'
		});

		const buildersParams = new URLSearchParams({
			timePeriod: 'ALL',
			limit: '10',
			offset: '0'
		});

		const [tradersResponse, buildersResponse] = await Promise.all([
			fetch(`/api/traders/leaderboard?${tradersParams.toString()}`),
			fetch(`/api/builders/leaderboard?${buildersParams.toString()}`)
		]);

		const traders = tradersResponse.ok ? await tradersResponse.json() : [];
		const builders = buildersResponse.ok ? await buildersResponse.json() : [];

		logger.info('Loaded leaderboard data', {
			tradersCount: traders.length,
			buildersCount: builders.length
		});

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
