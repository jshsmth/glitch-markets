/**
 * SvelteKit server route for fetching a tag by ID
 * GET /api/tags/[id]
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { TagService } from '$lib/server/services/tag-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';

const logger = new Logger({ component: 'TagByIdRoute' });
const tagService = new TagService();

/**
 * GET handler for /api/tags/[id]
 * Fetches a specific tag by its ID
 */
export async function GET({ params }: RequestEvent) {
	const startTime = Date.now();

	try {
		const { id } = params;

		// Validate ID parameter
		if (!id || id.trim() === '') {
			logger.error('Missing or empty tag ID', undefined, { id });
			return json(
				formatErrorResponse(new ApiError('Tag ID is required', 400, 'VALIDATION_ERROR')),
				{ status: 400 }
			);
		}

		logger.info('Fetching tag by ID', { id });

		// Fetch tag from service
		const tag = await tagService.getTagById(id);

		// Handle not found
		if (!tag) {
			const duration = Date.now() - startTime;
			logger.info('Tag not found', { id, duration });
			return json(formatErrorResponse(new ApiError('Tag not found', 404, 'NOT_FOUND')), {
				status: 404
			});
		}

		const duration = Date.now() - startTime;
		logger.info('Tag fetched successfully', { id, duration });

		// Return response with cache headers
		return json(tag, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in tag by ID route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		// Handle unexpected errors
		logger.error('Unexpected error in tag by ID route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
