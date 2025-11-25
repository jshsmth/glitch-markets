/**
 * SvelteKit server route for fetching tags list
 * GET /api/tags
 */

import { json } from '@sveltejs/kit';
import { TagService } from '$lib/server/services/tag-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';

const logger = new Logger({ component: 'TagsRoute' });
const tagService = new TagService();

/**
 * GET handler for /api/tags
 * Fetches a list of all tags
 */
export async function GET() {
	const startTime = Date.now();

	try {
		logger.info('Fetching tags');

		const tags = await tagService.getTags();

		const duration = Date.now() - startTime;
		logger.info('Tags fetched successfully', { count: tags.length, duration });

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
			logger.error('API error in tags route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in tags route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
