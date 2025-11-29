/**
 * SvelteKit server route for fetching builder volume time-series
 * GET /api/builders/volume
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { BuilderDataService } from '$lib/server/services/builder-data-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';
import { validateBuilderVolumeParams } from '$lib/server/validation/input-validator.js';

const logger = new Logger({ component: 'BuilderVolumeRoute' });
const builderService = new BuilderDataService();

/**
 * GET handler for /api/builders/volume
 * Fetches daily builder volume time-series data
 *
 * Query Parameters:
 * - timePeriod (optional): Time period for data (DAY, WEEK, MONTH, ALL) - default: DAY
 */
export async function GET({ url }: RequestEvent) {
	const startTime = Date.now();

	try {
		const timePeriod = url.searchParams.get('timePeriod') ?? 'DAY';

		const params: Record<string, unknown> = {
			timePeriod
		};

		const validated = validateBuilderVolumeParams(params);

		logger.info('Fetching builder volume time-series', { params: validated });

		const volume = await builderService.getVolumeTimeSeries(validated);

		const duration = Date.now() - startTime;
		logger.info('Builder volume time-series fetched successfully', {
			count: volume.length,
			duration
		});

		return json(volume, {
			headers: {
				'Cache-Control': 'public, max-age=600, s-maxage=600',
				'CDN-Cache-Control': 'public, max-age=600',
				'Vercel-CDN-Cache-Control': 'public, max-age=600'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in builder volume route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in builder volume route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
