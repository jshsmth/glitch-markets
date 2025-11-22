/**
 * SvelteKit server route for fetching user activity
 * GET /api/users/activity
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { UserDataService } from '$lib/server/services/user-data-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';
import { validateUserActivityParams } from '$lib/server/validation/input-validator.js';

const logger = new Logger({ component: 'ActivityRoute' });
const userDataService = new UserDataService();

/**
 * GET handler for /api/users/activity
 * Fetches complete activity history for a user
 */
export async function GET({ url }: RequestEvent) {
	const startTime = Date.now();

	try {
		const user = url.searchParams.get('user');

		const params: Record<string, unknown> = { user };

		const validated = validateUserActivityParams(params);

		logger.info('Fetching user activity', { user: validated.user });

		const activity = await userDataService.getUserActivity(validated.user);

		const duration = Date.now() - startTime;
		logger.info('User activity fetched successfully', {
			user: validated.user,
			count: activity.length,
			duration
		});

		return json(activity, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in activity route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in activity route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
