/**
 * SvelteKit server route for fetching user portfolio value
 * GET /api/users/value
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { UserDataService } from '$lib/server/services/user-data-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';
import { validatePortfolioValueParams } from '$lib/server/validation/input-validator.js';

const logger = new Logger({ component: 'PortfolioValueRoute' });
const userDataService = new UserDataService();

/**
 * GET handler for /api/users/value
 * Fetches total portfolio value for a user with optional market filtering
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

		const validated = validatePortfolioValueParams(params);

		logger.info('Fetching portfolio value', { user: validated.user, markets: validated.market });

		const portfolioValue = await userDataService.getPortfolioValue(
			validated.user,
			validated.market
		);

		const duration = Date.now() - startTime;
		logger.info('Portfolio value fetched successfully', {
			user: validated.user,
			count: portfolioValue.length,
			duration
		});

		return json(portfolioValue, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in portfolio value route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in portfolio value route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
