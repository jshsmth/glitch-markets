/**
 * SvelteKit server route for fetching related tags by slug
 * GET /api/tags/slug/[slug]/related
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { TagService } from '$lib/server/services/tag-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';

const logger = new Logger({ component: 'RelatedTagsBySlugRoute' });
const tagService = new TagService();

/**
 * GET handler for /api/tags/slug/[slug]/related
 * Fetches full Tag objects related to a specific tag by its slug
 */
export async function GET({ params }: RequestEvent) {
	const startTime = Date.now();

	try {
		const { slug } = params;

		// Validate slug parameter
		if (!slug || slug.trim() === '') {
			logger.error('Missing or empty tag slug', undefined, { slug });
			return json(
				formatErrorResponse(new ApiError('Tag slug is required', 400, 'VALIDATION_ERROR')),
				{ status: 400 }
			);
		}

		logger.info('Fetching related tags by slug', { slug });

		// Fetch related tags from service
		const relatedTags = await tagService.getRelatedTagsBySlug(slug);

		const duration = Date.now() - startTime;
		logger.info('Related tags fetched successfully', { slug, count: relatedTags.length, duration });

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
			logger.error('API error in related tags by slug route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		// Handle unexpected errors
		logger.error('Unexpected error in related tags by slug route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
