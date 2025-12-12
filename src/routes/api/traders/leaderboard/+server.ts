/**
 * SvelteKit server route for fetching trader leaderboard
 * GET /api/traders/leaderboard
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { PolymarketClient } from '$lib/server/api/polymarket-client.js';
import { loadConfig } from '$lib/server/config/api-config.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';
import { CACHE_TTL } from '$lib/config/constants.js';

const logger = new Logger({ component: 'TraderLeaderboardRoute' });

/**
 * GET handler for /api/traders/leaderboard
 * Fetches trader rankings with optional filtering and pagination
 *
 * Query Parameters:
 * - category (optional): Market category - default: OVERALL
 * - timePeriod (optional): Time period for aggregation (DAY, WEEK, MONTH, ALL) - default: DAY
 * - orderBy (optional): Sort criteria (PNL, VOL) - default: PNL
 * - limit (optional): Maximum results to return (1-50) - default: 25
 * - offset (optional): Pagination offset (0-1000) - default: 0
 * - user (optional): Filter by wallet address
 * - userName (optional): Filter by username
 */
export async function GET({ url }: RequestEvent) {
	const startTime = Date.now();

	try {
		const category = url.searchParams.get('category') ?? undefined;
		const timePeriod = url.searchParams.get('timePeriod') ?? undefined;
		const orderBy = url.searchParams.get('orderBy') ?? undefined;
		const limitParam = url.searchParams.get('limit');
		const offsetParam = url.searchParams.get('offset');
		const user = url.searchParams.get('user') ?? undefined;
		const userName = url.searchParams.get('userName') ?? undefined;

		const params: Record<string, unknown> = {};

		if (category) params.category = category;
		if (timePeriod) params.timePeriod = timePeriod;
		if (orderBy) params.orderBy = orderBy;
		if (user) params.user = user;
		if (userName) params.userName = userName;

		if (limitParam !== null) {
			params.limit = parseInt(limitParam, 10);
		}

		if (offsetParam !== null) {
			params.offset = parseInt(offsetParam, 10);
		}

		logger.info('Fetching trader leaderboard', { params });

		const config = loadConfig();
		const client = new PolymarketClient(config);
		const leaderboard = await client.fetchTraderLeaderboard(params);

		const duration = Date.now() - startTime;
		logger.info('Trader leaderboard fetched successfully', {
			count: leaderboard.length,
			duration
		});

		return json(leaderboard, {
			headers: {
				'Cache-Control': `public, max-age=${CACHE_TTL.TRADERS_LEADERBOARD / 1000}, s-maxage=${CACHE_TTL.TRADERS_LEADERBOARD / 1000}`,
				'CDN-Cache-Control': `public, max-age=${CACHE_TTL.TRADERS_LEADERBOARD / 1000}`,
				'Vercel-CDN-Cache-Control': `public, max-age=${CACHE_TTL.TRADERS_LEADERBOARD / 1000}`
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in trader leaderboard route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in trader leaderboard route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
