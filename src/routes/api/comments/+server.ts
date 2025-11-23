/**
 * SvelteKit server route for fetching comments list
 * GET /api/comments
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { CommentService } from '$lib/server/services/comment-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';
import type { CommentFilters } from '$lib/server/services/comment-service.js';

const logger = new Logger({ component: 'CommentsRoute' });
const commentService = new CommentService();

/**
 * GET handler for /api/comments
 * Fetches a list of comments with optional filtering and pagination
 */
export async function GET({ url }: RequestEvent) {
	const startTime = Date.now();

	try {
		// Parse query parameters
		const limit = url.searchParams.get('limit');
		const offset = url.searchParams.get('offset');
		const order = url.searchParams.get('order');
		const ascending = url.searchParams.get('ascending');
		const parent_entity_type = url.searchParams.get('parent_entity_type');
		const parent_entity_id = url.searchParams.get('parent_entity_id');
		const get_positions = url.searchParams.get('get_positions');
		const holders_only = url.searchParams.get('holders_only');

		// Build filters object with validation
		const filters: CommentFilters = {};

		// Validate and parse numeric parameters
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

		if (parent_entity_id !== null) {
			const parsedId = parseInt(parent_entity_id, 10);
			if (isNaN(parsedId) || parsedId < 0) {
				logger.error('Invalid parent_entity_id parameter', undefined, { parent_entity_id });
				return json(
					formatErrorResponse(
						new ApiError('Invalid parent_entity_id parameter', 400, 'VALIDATION_ERROR')
					),
					{ status: 400 }
				);
			}
			filters.parent_entity_id = parsedId;
		}

		// Validate string parameters
		if (order !== null) {
			filters.order = order;
		}

		if (parent_entity_type !== null) {
			const validTypes = ['Event', 'Series', 'market'];
			if (!validTypes.includes(parent_entity_type)) {
				logger.error('Invalid parent_entity_type parameter', undefined, { parent_entity_type });
				return json(
					formatErrorResponse(
						new ApiError(
							`Invalid parent_entity_type. Must be one of: ${validTypes.join(', ')}`,
							400,
							'VALIDATION_ERROR'
						)
					),
					{ status: 400 }
				);
			}
			filters.parent_entity_type = parent_entity_type as 'Event' | 'Series' | 'market';
		}

		// Validate boolean parameters
		if (ascending !== null) {
			if (ascending !== 'true' && ascending !== 'false') {
				logger.error('Invalid ascending parameter', undefined, { ascending });
				return json(
					formatErrorResponse(new ApiError('Invalid ascending parameter', 400, 'VALIDATION_ERROR')),
					{ status: 400 }
				);
			}
			filters.ascending = ascending === 'true';
		}

		if (get_positions !== null) {
			if (get_positions !== 'true' && get_positions !== 'false') {
				logger.error('Invalid get_positions parameter', undefined, { get_positions });
				return json(
					formatErrorResponse(
						new ApiError('Invalid get_positions parameter', 400, 'VALIDATION_ERROR')
					),
					{ status: 400 }
				);
			}
			filters.get_positions = get_positions === 'true';
		}

		if (holders_only !== null) {
			if (holders_only !== 'true' && holders_only !== 'false') {
				logger.error('Invalid holders_only parameter', undefined, { holders_only });
				return json(
					formatErrorResponse(
						new ApiError('Invalid holders_only parameter', 400, 'VALIDATION_ERROR')
					),
					{ status: 400 }
				);
			}
			filters.holders_only = holders_only === 'true';
		}

		logger.info('Fetching comments', { filters });

		// Fetch comments from service
		const comments = await commentService.getComments(filters);

		const duration = Date.now() - startTime;
		logger.info('Comments fetched successfully', { count: comments.length, duration });

		// Return response with cache headers
		return json(comments, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in comments route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		// Handle unexpected errors
		logger.error('Unexpected error in comments route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
