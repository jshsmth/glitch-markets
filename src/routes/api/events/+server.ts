/**
 * SvelteKit server route for fetching events list
 * GET /api/events
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { EventService } from '$lib/server/services/event-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';

const logger = new Logger({ component: 'EventsRoute' });
const eventService = new EventService();

/**
 * GET handler for /api/events
 * Fetches a list of events with optional filtering and pagination
 */
export async function GET({ url }: RequestEvent) {
	const startTime = Date.now();

	try {
		// Parse query parameters
		const limit = url.searchParams.get('limit');
		const offset = url.searchParams.get('offset');
		const category = url.searchParams.get('category');
		const active = url.searchParams.get('active');
		const closed = url.searchParams.get('closed');

		// Build filters object
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

		logger.info('Fetching events', { filters });

		// Fetch events from service
		const events = await eventService.getEvents(filters);

		const duration = Date.now() - startTime;
		logger.info('Events fetched successfully', { count: events.length, duration });

		// Return response with cache headers
		return json(events, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in events route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		// Handle unexpected errors
		logger.error('Unexpected error in events route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
