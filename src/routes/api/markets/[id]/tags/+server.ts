/**
 * SvelteKit server route for fetching tags associated with a market
 * GET /api/markets/[id]/tags
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { MarketService } from '$lib/server/services/market-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/utils/logger';

const logger = new Logger({ component: 'MarketTagsRoute' });
const marketService = new MarketService();

/**
 * GET handler for /api/markets/[id]/tags
 * Fetches tags associated with a specific market
 */
export async function GET({ params }: RequestEvent) {
	const startTime = Date.now();

	try {
		const { id } = params;

		if (!id || id.trim() === '') {
			logger.error('Missing or empty market ID', undefined, { id });
			return json(
				formatErrorResponse(new ApiError('Market ID is required', 400, 'VALIDATION_ERROR')),
				{ status: 400 }
			);
		}

		logger.info('Fetching tags for market', { id });

		const tags = await marketService.getMarketTags(id);

		if (!tags) {
			const duration = Date.now() - startTime;
			logger.info('Market not found', { id, duration });
			return json(formatErrorResponse(new ApiError('Market not found', 404, 'NOT_FOUND')), {
				status: 404
			});
		}

		const duration = Date.now() - startTime;
		logger.info('Market tags fetched successfully', { id, tagCount: tags.length, duration });

		return json(tags, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in market tags route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in market tags route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
