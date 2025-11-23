/**
 * SvelteKit server route for fetching related tags by ID
 * GET /api/tags/[id]/related
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { TagService } from '$lib/server/services/tag-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';

const logger = new Logger({ component: 'RelatedTagsByIdRoute' });
const tagService = new TagService();

/**
 * GET handler for /api/tags/[id]/related
 * Fetches full Tag objects related to a specific tag by its ID
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

		logger.info('Fetching related tags by ID', { id });

		// Fetch related tags from service
		const relatedTags = await tagService.getRelatedTagsById(id);

		const duration = Date.now() - startTime;
		logger.info('Related tags fetched successfully', { id, count: relatedTags.length, duration });

		// Return response with cache headers
		return json(relatedTags, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in related tags by ID route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		// Handle unexpected errors
		logger.error('Unexpected error in related tags by ID route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
