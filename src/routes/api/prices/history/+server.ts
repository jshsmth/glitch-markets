/**
 * SvelteKit server route for fetching price history
 * GET /api/prices/history
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { PolymarketClient } from '$lib/server/api/polymarket-client.js';
import { loadConfig } from '$lib/server/config/api-config.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/utils/logger';

const logger = new Logger({ component: 'PriceHistoryRoute' });
const config = loadConfig();
const client = new PolymarketClient(config);

/**
 * GET handler for /api/prices/history
 * Fetches historical price data for a market token
 *
 * Query parameters:
 * - market (required): CLOB token ID
 * - startTs (optional): Start timestamp (Unix, UTC)
 * - endTs (optional): End timestamp (Unix, UTC)
 * - interval (optional): Time interval ('1m', '1w', '1d', '6h', '1h', 'max')
 * - fidelity (optional): Data resolution in minutes
 */
export async function GET({ url }: RequestEvent) {
	const startTime = Date.now();

	try {
		const market = url.searchParams.get('market');
		const startTs = url.searchParams.get('startTs');
		const endTs = url.searchParams.get('endTs');
		const interval = url.searchParams.get('interval');
		const fidelity = url.searchParams.get('fidelity');

		if (!market) {
			logger.error('Missing market parameter', undefined, { market });
			return json(
				formatErrorResponse(new ApiError('market parameter is required', 400, 'VALIDATION_ERROR')),
				{ status: 400 }
			);
		}

		const params: {
			market: string;
			startTs?: number;
			endTs?: number;
			interval?: '1m' | '1w' | '1d' | '6h' | '1h' | 'max';
			fidelity?: number;
		} = { market };

		if (startTs) {
			params.startTs = parseInt(startTs, 10);
			if (isNaN(params.startTs)) {
				return json(
					formatErrorResponse(
						new ApiError('startTs must be a valid number', 400, 'VALIDATION_ERROR')
					),
					{ status: 400 }
				);
			}
		}

		if (endTs) {
			params.endTs = parseInt(endTs, 10);
			if (isNaN(params.endTs)) {
				return json(
					formatErrorResponse(
						new ApiError('endTs must be a valid number', 400, 'VALIDATION_ERROR')
					),
					{ status: 400 }
				);
			}
		}

		if (interval) {
			params.interval = interval as '1m' | '1w' | '1d' | '6h' | '1h' | 'max';
		}

		if (fidelity) {
			params.fidelity = parseInt(fidelity, 10);
			if (isNaN(params.fidelity)) {
				return json(
					formatErrorResponse(
						new ApiError('fidelity must be a valid number', 400, 'VALIDATION_ERROR')
					),
					{ status: 400 }
				);
			}
		}

		logger.info('Fetching price history', { market, params });

		const priceHistory = await client.fetchPriceHistory(params);

		const duration = Date.now() - startTime;
		logger.info('Price history fetched successfully', {
			market,
			pointCount: priceHistory.history.length,
			duration
		});

		return json(priceHistory, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in price history route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in price history route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
