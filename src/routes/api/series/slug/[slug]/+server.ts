/**
 * SvelteKit server route for fetching a series by slug
 * GET /api/series/slug/[slug]
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { SeriesService } from '$lib/server/services/series-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';

const logger = new Logger({ component: 'SeriesBySlugRoute' });
const seriesService = new SeriesService();

/**
 * GET handler for /api/series/slug/[slug]
 * Fetches a specific series by its slug
 */
export async function GET({ params }: RequestEvent) {
	const startTime = Date.now();

	try {
		const { slug } = params;

		if (!slug || slug.trim() === '') {
			logger.error('Missing or empty series slug', undefined, { slug });
			return json(
				formatErrorResponse(new ApiError('Series slug is required', 400, 'VALIDATION_ERROR')),
				{ status: 400 }
			);
		}

		logger.info('Fetching series by slug', { slug });

		const series = await seriesService.getSeriesBySlug(slug);

		if (!series) {
			const duration = Date.now() - startTime;
			logger.info('Series not found', { slug, duration });
			return json(formatErrorResponse(new ApiError('Series not found', 404, 'NOT_FOUND')), {
				status: 404
			});
		}

		const duration = Date.now() - startTime;
		logger.info('Series fetched successfully', { slug, duration });

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
			logger.error('API error in series by slug route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in series by slug route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
