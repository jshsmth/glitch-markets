/**
 * SvelteKit server route for fetching trades
 * GET /api/users/trades
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { UserDataService } from '$lib/server/services/user-data-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';
import { validateTradesParams } from '$lib/server/validation/input-validator.js';

const logger = new Logger({ component: 'TradesRoute' });
const userDataService = new UserDataService();

/**
 * GET handler for /api/users/trades
 * Fetches trades with optional user and market filtering
 * Requires at least one of: user or market parameter
 */
export async function GET({ url }: RequestEvent) {
	const startTime = Date.now();

	try {
		const user = url.searchParams.get('user');
		const market = url.searchParams.getAll('market');

		const params: Record<string, unknown> = {};
		if (user) {
			params.user = user;
		}
		if (market.length > 0) {
			params.market = market;
		}

		const validated = validateTradesParams(params);

		logger.info('Fetching trades', { user: validated.user, markets: validated.market });

		const trades = await userDataService.getTrades(validated.user, validated.market);

		const duration = Date.now() - startTime;
		logger.info('Trades fetched successfully', {
			user: validated.user,
			markets: validated.market,
			count: trades.length,
			duration
		});

		return json(trades, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in trades route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in trades route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
