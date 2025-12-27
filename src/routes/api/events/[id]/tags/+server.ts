/**
 * SvelteKit server route for fetching tags associated with an event
 * GET /api/events/[id]/tags
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { EventService } from '$lib/server/services/event-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/utils/logger';

const logger = new Logger({ component: 'EventTagsRoute' });
const eventService = new EventService();

/**
 * GET handler for /api/events/[id]/tags
 * Fetches tags associated with a specific event
 */
export async function GET({ params }: RequestEvent) {
	const startTime = Date.now();

	try {
		const { id } = params;

		if (!id || id.trim() === '') {
			logger.error('Missing or empty event ID', undefined, { id });
			return json(
				formatErrorResponse(new ApiError('Event ID is required', 400, 'VALIDATION_ERROR')),
				{ status: 400 }
			);
		}

		logger.info('Fetching tags for event', { id });

		const tags = await eventService.getEventTags(id);

		if (!tags) {
			const duration = Date.now() - startTime;
			logger.info('Event not found', { id, duration });
			return json(formatErrorResponse(new ApiError('Event not found', 404, 'NOT_FOUND')), {
				status: 404
			});
		}

		const duration = Date.now() - startTime;
		logger.info('Event tags fetched successfully', { id, tagCount: tags.length, duration });

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
			logger.error('API error in event tags route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in event tags route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
