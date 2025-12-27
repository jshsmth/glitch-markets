/**
 * SvelteKit server route for fetching an event by slug
 * GET /api/events/slug/[slug]
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { EventService } from '$lib/server/services/event-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/utils/logger';

const logger = new Logger({ component: 'EventBySlugRoute' });
const eventService = new EventService();

/**
 * GET handler for /api/events/slug/[slug]
 * Fetches a specific event by its slug
 */
export async function GET({ params }: RequestEvent) {
	const startTime = Date.now();

	try {
		const slug = params.slug as string;

		if (!slug || slug.trim() === '') {
			logger.error('Missing or empty event slug', undefined, { slug });
			return json(
				formatErrorResponse(new ApiError('Event slug is required', 400, 'VALIDATION_ERROR')),
				{ status: 400 }
			);
		}

		logger.info('Fetching event by slug', { slug });

		const event = await eventService.getEventBySlug(slug);

		if (!event) {
			const duration = Date.now() - startTime;
			logger.info('Event not found', { slug, duration });
			return json(formatErrorResponse(new ApiError('Event not found', 404, 'NOT_FOUND')), {
				status: 404
			});
		}

		const duration = Date.now() - startTime;
		logger.info('Event fetched successfully', { slug, duration });

		return json(event, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in event by slug route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in event by slug route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
