/**
 * SvelteKit server route for fetching user closed positions
 * GET /api/users/closed-positions
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { UserDataService } from '$lib/server/services/user-data-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/utils/logger';
import { validateClosedPositionsParams } from '$lib/server/validation/input-validator.js';

const logger = new Logger({ component: 'ClosedPositionsRoute' });
const userDataService = new UserDataService();

/**
 * GET handler for /api/users/closed-positions
 * Fetches closed positions for a user
 */
export async function GET({ url }: RequestEvent) {
	const startTime = Date.now();

	try {
		const user = url.searchParams.get('user');

		const params: Record<string, unknown> = { user };

		const validated = validateClosedPositionsParams(params);

		logger.info('Fetching closed positions', { user: validated.user });

		const closedPositions = await userDataService.getClosedPositions(validated.user);

		const duration = Date.now() - startTime;
		logger.info('Closed positions fetched successfully', {
			user: validated.user,
			count: closedPositions.length,
			duration
		});

		return json(closedPositions, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in closed positions route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in closed positions route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
