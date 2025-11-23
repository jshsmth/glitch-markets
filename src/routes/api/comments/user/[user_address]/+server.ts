/**
 * SvelteKit server route for fetching comments by user address
 * GET /api/comments/user/[user_address]
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { CommentService } from '$lib/server/services/comment-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';
import type { UserCommentFilters } from '$lib/server/services/comment-service.js';

const logger = new Logger({ component: 'CommentsByUserRoute' });
const commentService = new CommentService();

/**
 * GET handler for /api/comments/user/[user_address]
 * Fetches all comments by a specific user
 */
export async function GET({ params, url }: RequestEvent) {
	const startTime = Date.now();

	try {
		const { user_address } = params;

		// Validate user address (Ethereum address format: 0x + 40 hex chars)
		if (!user_address || !/^0x[0-9a-fA-F]{40}$/.test(user_address)) {
			logger.error('Invalid user address', undefined, { user_address });
			return json(
				formatErrorResponse(
					new ApiError(
						'User address must be a valid Ethereum address (0x followed by 40 hexadecimal characters)',
						400,
						'VALIDATION_ERROR'
					)
				),
				{ status: 400 }
			);
		}

		// Parse query parameters
		const limit = url.searchParams.get('limit');
		const offset = url.searchParams.get('offset');
		const order = url.searchParams.get('order');
		const ascending = url.searchParams.get('ascending');

		// Build filters object with validation
		const filters: UserCommentFilters = {};

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

		if (order !== null) {
			filters.order = order;
		}

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

		logger.info('Fetching comments by user', { user_address, filters });

		// Fetch comments from service
		const comments = await commentService.getCommentsByUser(user_address, filters);

		const duration = Date.now() - startTime;
		logger.info('User comments fetched successfully', {
			user_address,
			count: comments.length,
			duration
		});

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
			logger.error('API error in comments by user route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		// Handle unexpected errors
		logger.error('Unexpected error in comments by user route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
