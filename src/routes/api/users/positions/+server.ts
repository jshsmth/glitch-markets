/**
 * SvelteKit server route for fetching user positions
 * GET /api/users/positions
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { UserDataService } from '$lib/server/services/user-data-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/utils/logger';
import { validateUserPositionsParams } from '$lib/server/validation/input-validator.js';

const logger = new Logger({ component: 'PositionsRoute' });
const userDataService = new UserDataService();

/**
 * GET handler for /api/users/positions
 * Fetches current positions for a user with optional market filtering
 */
export async function GET({ url }: RequestEvent) {
	const startTime = Date.now();

	try {
		const user = url.searchParams.get('user');
		const market = url.searchParams.getAll('market');

		const params: Record<string, unknown> = { user };
		if (market.length > 0) {
			params.market = market;
		}

		const validated = validateUserPositionsParams(params);

		logger.info('Fetching user positions', { user: validated.user, markets: validated.market });

		const positions = await userDataService.getCurrentPositions(validated.user, validated.market);

		const duration = Date.now() - startTime;
		logger.info('User positions fetched successfully', {
			user: validated.user,
			count: positions.length,
			duration
		});

		return json(positions, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in positions route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in positions route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
