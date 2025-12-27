/**
 * SvelteKit server route for fetching sports metadata
 * GET /api/sports/metadata
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SportsService } from '$lib/server/services/sports-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/utils/logger';

const logger = new Logger({ component: 'SportsMetadataRoute' });
const sportsService = new SportsService();

/**
 * GET handler for /api/sports/metadata
 * Fetches sports metadata for all sports
 */
export const GET: RequestHandler = async () => {
	const startTime = Date.now();

	try {
		logger.info('Fetching sports metadata');

		const metadata = await sportsService.getSportsMetadata();

		const duration = Date.now() - startTime;
		logger.info('Sports metadata fetched successfully', { count: metadata.length, duration });

		return json(metadata, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in sports metadata route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in sports metadata route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
};
