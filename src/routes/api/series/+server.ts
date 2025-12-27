/**
 * SvelteKit server route for fetching series list
 * GET /api/series
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { SeriesService } from '$lib/server/services/series-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/utils/logger';

const logger = new Logger({ component: 'SeriesRoute' });
const seriesService = new SeriesService();

/**
 * GET handler for /api/series
 * Fetches a list of series with optional filtering and pagination
 */
export async function GET({ url }: RequestEvent) {
	const startTime = Date.now();

	try {
		const limit = url.searchParams.get('limit');
		const offset = url.searchParams.get('offset');
		const category = url.searchParams.get('category');
		const active = url.searchParams.get('active');
		const closed = url.searchParams.get('closed');

		const filters: {
			limit?: number;
			offset?: number;
			category?: string;
			active?: boolean;
			closed?: boolean;
		} = {};

		if (limit !== null) {
			const parsedLimit = parseInt(limit, 10);
			if (isNaN(parsedLimit) || parsedLimit < 0) {
				logger.error('Invalid limit parameter', undefined, { limit });
				return json(
					formatErrorResponse(new ApiError('Invalid limit parameter', 400, 'VALIDATION_ERROR')),
					{ status: 400 }
				);
			}
			filters.limit = parsedLimit;
		}

		if (offset !== null) {
			const parsedOffset = parseInt(offset, 10);
			if (isNaN(parsedOffset) || parsedOffset < 0) {
				logger.error('Invalid offset parameter', undefined, { offset });
				return json(
					formatErrorResponse(new ApiError('Invalid offset parameter', 400, 'VALIDATION_ERROR')),
					{ status: 400 }
				);
			}
			filters.offset = parsedOffset;
		}

		if (category !== null) {
			filters.category = category;
		}

		if (active !== null) {
			if (active !== 'true' && active !== 'false') {
				logger.error('Invalid active parameter', undefined, { active });
				return json(
					formatErrorResponse(new ApiError('Invalid active parameter', 400, 'VALIDATION_ERROR')),
					{ status: 400 }
				);
			}
			filters.active = active === 'true';
		}

		if (closed !== null) {
			if (closed !== 'true' && closed !== 'false') {
				logger.error('Invalid closed parameter', undefined, { closed });
				return json(
					formatErrorResponse(new ApiError('Invalid closed parameter', 400, 'VALIDATION_ERROR')),
					{ status: 400 }
				);
			}
			filters.closed = closed === 'true';
		}

		logger.info('Fetching series', { filters });

		const series = await seriesService.getSeries(filters);

		const duration = Date.now() - startTime;
		logger.info('Series fetched successfully', { count: series.length, duration });

		return json(series, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in series route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in series route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
