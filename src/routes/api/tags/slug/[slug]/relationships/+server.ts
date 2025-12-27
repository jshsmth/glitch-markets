/**
 * SvelteKit server route for fetching tag relationships by slug
 * GET /api/tags/slug/[slug]/relationships
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { TagService } from '$lib/server/services/tag-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/utils/logger';

const logger = new Logger({ component: 'TagRelationshipsBySlugRoute' });
const tagService = new TagService();

/**
 * GET handler for /api/tags/slug/[slug]/relationships
 * Fetches tag relationships for a specific tag by its slug
 */
export async function GET({ params }: RequestEvent) {
	const startTime = Date.now();

	try {
		const { slug } = params;

		if (!slug || slug.trim() === '') {
			logger.error('Missing or empty tag slug', undefined, { slug });
			return json(
				formatErrorResponse(new ApiError('Tag slug is required', 400, 'VALIDATION_ERROR')),
				{ status: 400 }
			);
		}

		logger.info('Fetching tag relationships by slug', { slug });

		const relationships = await tagService.getTagRelationshipsBySlug(slug);

		const duration = Date.now() - startTime;
		logger.info('Tag relationships fetched successfully', {
			slug,
			count: relationships.length,
			duration
		});

		return json(relationships, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in tag relationships by slug route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in tag relationships by slug route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
