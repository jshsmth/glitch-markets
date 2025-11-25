/**
 * SvelteKit server route for fetching a market by slug
 * GET /api/markets/slug/[slug]
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { MarketService } from '$lib/server/services/market-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';

const logger = new Logger({ component: 'MarketBySlugRoute' });
const marketService = new MarketService();

/**
 * GET handler for /api/markets/slug/[slug]
 * Fetches a specific market by its slug
 */
export async function GET({ params }: RequestEvent) {
	const startTime = Date.now();

	try {
		const slug = params.slug as string;

		if (!slug || slug.trim() === '') {
			logger.error('Missing or empty market slug', undefined, { slug });
			return json(
				formatErrorResponse(new ApiError('Market slug is required', 400, 'VALIDATION_ERROR')),
				{ status: 400 }
			);
		}

		logger.info('Fetching market by slug', { slug });

		const market = await marketService.getMarketBySlug(slug);

		if (!market) {
			const duration = Date.now() - startTime;
			logger.info('Market not found', { slug, duration });
			return json(formatErrorResponse(new ApiError('Market not found', 404, 'NOT_FOUND')), {
				status: 404
			});
		}

		const duration = Date.now() - startTime;
		logger.info('Market fetched successfully', { slug, duration });

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
			logger.error('API error in market by slug route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in market by slug route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
