/**
 * SvelteKit server route for searching markets
 * GET /api/markets/search
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { MarketService } from '$lib/server/services/market-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';

const logger = new Logger({ component: 'MarketsSearchRoute' });
const marketService = new MarketService();

/**
 * GET handler for /api/markets/search
 * Searches markets with optional filtering, sorting, and text query
 */
export async function GET({ url }: RequestEvent) {
	const startTime = Date.now();

	try {
		// Parse query parameters
		const query = url.searchParams.get('query');
		const sortBy = url.searchParams.get('sortBy');
		const sortOrder = url.searchParams.get('sortOrder');
		const limit = url.searchParams.get('limit');
		const offset = url.searchParams.get('offset');
		const category = url.searchParams.get('category');
		const active = url.searchParams.get('active');
		const closed = url.searchParams.get('closed');

		// Build search options object
		const options: {
			query?: string;
			sortBy?: 'volume' | 'liquidity' | 'createdAt';
			sortOrder?: 'asc' | 'desc';
			limit?: number;
			offset?: number;
			category?: string;
			active?: boolean;
			closed?: boolean;
		} = {};

		// Add query if provided
		if (query !== null) {
			options.query = query;
		}

		// Validate and add sortBy
		if (sortBy !== null) {
			if (sortBy !== 'volume' && sortBy !== 'liquidity' && sortBy !== 'createdAt') {
				logger.error('Invalid sortBy parameter', undefined, { sortBy });
				return json(
					formatErrorResponse(
						new ApiError(
							'Invalid sortBy parameter. Must be one of: volume, liquidity, createdAt',
							400,
							'VALIDATION_ERROR'
						)
					),
					{ status: 400 }
				);
			}
			options.sortBy = sortBy;
		}

		// Validate and add sortOrder
		if (sortOrder !== null) {
			if (sortOrder !== 'asc' && sortOrder !== 'desc') {
				logger.error('Invalid sortOrder parameter', undefined, { sortOrder });
				return json(
					formatErrorResponse(
						new ApiError(
							'Invalid sortOrder parameter. Must be one of: asc, desc',
							400,
							'VALIDATION_ERROR'
						)
					),
					{ status: 400 }
				);
			}
			options.sortOrder = sortOrder;
		}

		// Validate and add limit
		if (limit !== null) {
			const parsedLimit = parseInt(limit, 10);
			if (isNaN(parsedLimit) || parsedLimit < 0) {
				logger.error('Invalid limit parameter', undefined, { limit });
				return json(
					formatErrorResponse(new ApiError('Invalid limit parameter', 400, 'VALIDATION_ERROR')),
					{ status: 400 }
				);
			}
			options.limit = parsedLimit;
		}

		// Validate and add offset
		if (offset !== null) {
			const parsedOffset = parseInt(offset, 10);
			if (isNaN(parsedOffset) || parsedOffset < 0) {
				logger.error('Invalid offset parameter', undefined, { offset });
				return json(
					formatErrorResponse(new ApiError('Invalid offset parameter', 400, 'VALIDATION_ERROR')),
					{ status: 400 }
				);
			}
			options.offset = parsedOffset;
		}

		// Add category filter
		if (category !== null) {
			options.category = category;
		}

		// Validate and add active filter
		if (active !== null) {
			if (active !== 'true' && active !== 'false') {
				logger.error('Invalid active parameter', undefined, { active });
				return json(
					formatErrorResponse(new ApiError('Invalid active parameter', 400, 'VALIDATION_ERROR')),
					{ status: 400 }
				);
			}
			options.active = active === 'true';
		}

		// Validate and add closed filter
		if (closed !== null) {
			if (closed !== 'true' && closed !== 'false') {
				logger.error('Invalid closed parameter', undefined, { closed });
				return json(
					formatErrorResponse(new ApiError('Invalid closed parameter', 400, 'VALIDATION_ERROR')),
					{ status: 400 }
				);
			}
			options.closed = closed === 'true';
		}

		logger.info('Searching markets', { options });

		// Search markets using service
		const markets = await marketService.searchMarkets(options);

		const duration = Date.now() - startTime;
		logger.info('Markets search completed successfully', { count: markets.length, duration });

		// Return response with cache headers
		return json(markets, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in markets search route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		// Handle unexpected errors
		logger.error('Unexpected error in markets search route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
