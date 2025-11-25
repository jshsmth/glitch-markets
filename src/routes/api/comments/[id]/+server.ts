/**
 * SvelteKit server route for fetching a comment by ID
 * GET /api/comments/[id]
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { CommentService } from '$lib/server/services/comment-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';

const logger = new Logger({ component: 'CommentByIdRoute' });
const commentService = new CommentService();

/**
 * GET handler for /api/comments/[id]
 * Fetches a specific comment by its ID
 */
export async function GET({ params, url }: RequestEvent) {
	const startTime = Date.now();

	try {
		const { id } = params;

		if (!id) {
			logger.error('Missing comment ID', undefined, { id });
			return json(
				formatErrorResponse(new ApiError('Comment ID is required', 400, 'VALIDATION_ERROR')),
				{ status: 400 }
			);
		}

		const parsedId = parseInt(id, 10);
		if (isNaN(parsedId) || parsedId < 0) {
			logger.error('Invalid comment ID', undefined, { id });
			return json(
				formatErrorResponse(
					new ApiError('Comment ID must be a non-negative integer', 400, 'VALIDATION_ERROR')
				),
				{ status: 400 }
			);
		}

		// Parse get_positions query parameter
		const get_positions = url.searchParams.get('get_positions');
		let includePositions = false;

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
			includePositions = get_positions === 'true';
		}

		logger.info('Fetching comment by ID', { id: parsedId, includePositions });

		const comment = await commentService.getCommentById(parsedId, includePositions);

		if (!comment) {
			const duration = Date.now() - startTime;
			logger.info('Comment not found', { id: parsedId, duration });
			return json(formatErrorResponse(new ApiError('Comment not found', 404, 'NOT_FOUND')), {
				status: 404
			});
		}

		const duration = Date.now() - startTime;
		logger.info('Comment fetched successfully', { id: parsedId, duration });

		return json(comment, {
			headers: {
				'Cache-Control': 'public, max-age=30, s-maxage=30',
				'CDN-Cache-Control': 'public, max-age=30',
				'Vercel-CDN-Cache-Control': 'public, max-age=30'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in comment by ID route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in comment by ID route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
