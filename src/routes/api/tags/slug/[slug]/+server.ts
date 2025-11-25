/**
 * SvelteKit server route for fetching a tag by slug
 * GET /api/tags/slug/[slug]
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { TagService } from '$lib/server/services/tag-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';

const logger = new Logger({ component: 'TagBySlugRoute' });
const tagService = new TagService();

/**
 * GET handler for /api/tags/slug/[slug]
 * Fetches a specific tag by its slug
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

		logger.info('Fetching tag by slug', { slug });

		const tag = await tagService.getTagBySlug(slug);

		if (!tag) {
			const duration = Date.now() - startTime;
			logger.info('Tag not found', { slug, duration });
			return json(formatErrorResponse(new ApiError('Tag not found', 404, 'NOT_FOUND')), {
				status: 404
			});
		}

		const duration = Date.now() - startTime;
		logger.info('Tag fetched successfully', { slug, duration });

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
			logger.error('API error in tag by slug route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in tag by slug route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
