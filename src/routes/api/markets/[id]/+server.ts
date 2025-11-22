/**
 * SvelteKit server route for fetching a market by ID
 * GET /api/markets/[id]
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { MarketService } from '$lib/server/services/market-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';

const logger = new Logger({ component: 'MarketByIdRoute' });
const marketService = new MarketService();

/**
 * GET handler for /api/markets/[id]
 * Fetches a specific market by its ID
 */
export async function GET({ params }: RequestEvent) {
	const startTime = Date.now();

	try {
		const { id } = params;

		// Validate ID parameter
		if (!id || id.trim() === '') {
			logger.error('Missing or empty market ID', undefined, { id });
			return json(
				formatErrorResponse(new ApiError('Market ID is required', 400, 'VALIDATION_ERROR')),
				{ status: 400 }
			);
		}

		logger.info('Fetching market by ID', { id });

		// Fetch market from service
		const market = await marketService.getMarketById(id);

		// Handle not found
		if (!market) {
			const duration = Date.now() - startTime;
			logger.info('Market not found', { id, duration });
			return json(formatErrorResponse(new ApiError('Market not found', 404, 'NOT_FOUND')), {
				status: 404
			});
		}

		const duration = Date.now() - startTime;
		logger.info('Market fetched successfully', { id, duration });

		// Return response with cache headers
		return json(market, {
			headers: {
				'Cache-Control': 'public, max-age=30, s-maxage=30',
				'CDN-Cache-Control': 'public, max-age=30',
				'Vercel-CDN-Cache-Control': 'public, max-age=30'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in market by ID route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		// Handle unexpected errors
		logger.error('Unexpected error in market by ID route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
