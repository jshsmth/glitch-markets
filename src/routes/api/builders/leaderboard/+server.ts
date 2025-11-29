/**
 * SvelteKit server route for fetching builder leaderboard
 * GET /api/builders/leaderboard
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { BuilderDataService } from '$lib/server/services/builder-data-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';
import { validateBuilderLeaderboardParams } from '$lib/server/validation/input-validator.js';

const logger = new Logger({ component: 'BuilderLeaderboardRoute' });
const builderService = new BuilderDataService();

/**
 * GET handler for /api/builders/leaderboard
 * Fetches aggregated builder rankings with optional filtering and pagination
 *
 * Query Parameters:
 * - timePeriod (optional): Time period for aggregation (DAY, WEEK, MONTH, ALL) - default: DAY
 * - limit (optional): Maximum results to return (0-50) - default: 25
 * - offset (optional): Pagination offset (0-1000) - default: 0
 */
export async function GET({ url }: RequestEvent) {
	const startTime = Date.now();

	try {
		const timePeriod = url.searchParams.get('timePeriod') ?? 'DAY';
		const limitParam = url.searchParams.get('limit');
		const offsetParam = url.searchParams.get('offset');

		const params: Record<string, unknown> = {
			timePeriod
		};

		if (limitParam !== null) {
			params.limit = parseInt(limitParam, 10);
		}

		if (offsetParam !== null) {
			params.offset = parseInt(offsetParam, 10);
		}

		const validated = validateBuilderLeaderboardParams(params);

		logger.info('Fetching builder leaderboard', { params: validated });

		const leaderboard = await builderService.getLeaderboard(validated);

		const duration = Date.now() - startTime;
		logger.info('Builder leaderboard fetched successfully', {
			count: leaderboard.length,
			duration
		});

		return json(leaderboard, {
			headers: {
				'Cache-Control': 'public, max-age=300, s-maxage=300',
				'CDN-Cache-Control': 'public, max-age=300',
				'Vercel-CDN-Cache-Control': 'public, max-age=300'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in builder leaderboard route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in builder leaderboard route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
