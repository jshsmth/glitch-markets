/**
 * SvelteKit server route for fetching top holders
 * GET /api/users/holders
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { UserDataService } from '$lib/server/services/user-data-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/utils/logger';
import { validateTopHoldersParams } from '$lib/server/validation/input-validator.js';

const logger = new Logger({ component: 'HoldersRoute' });
const userDataService = new UserDataService();

/**
 * GET handler for /api/users/holders
 * Fetches top holders for specified markets
 * Requires at least one market parameter
 */
export async function GET({ url }: RequestEvent) {
	const startTime = Date.now();

	try {
		const market = url.searchParams.getAll('market');

		const params: Record<string, unknown> = {};
		if (market.length > 0) {
			params.market = market;
		}

		const validated = validateTopHoldersParams(params);

		logger.info('Fetching top holders', { markets: validated.market });

		const holders = await userDataService.getTopHolders(validated.market);

		const duration = Date.now() - startTime;
		logger.info('Top holders fetched successfully', {
			markets: validated.market,
			count: holders.length,
			duration
		});

		return json(holders, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in holders route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in holders route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
