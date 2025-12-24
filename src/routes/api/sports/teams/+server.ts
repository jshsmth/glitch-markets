/**
 * SvelteKit server route for fetching teams list
 * GET /api/sports/teams
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SportsService } from '$lib/server/services/sports-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';

const logger = new Logger({ component: 'SportsTeamsRoute' });
const sportsService = new SportsService();

/**
 * GET handler for /api/sports/teams
 * Fetches a list of teams with optional filtering and pagination
 *
 * Query Parameters:
 * - limit (required): Number of results to return (>= 0)
 * - offset (required): Number of results to skip (>= 0)
 * - order (optional): Comma-separated fields for sorting
 * - ascending (optional): Sort direction (true/false)
 * - league (optional): Filter by league(s) - can be specified multiple times
 * - name (optional): Filter by name(s) - can be specified multiple times
 * - abbreviation (optional): Filter by abbreviation(s) - can be specified multiple times
 */
export const GET: RequestHandler = async ({ url }) => {
	const startTime = Date.now();

	try {
		const limitParam = url.searchParams.get('limit');
		const offsetParam = url.searchParams.get('offset');

		if (limitParam === null) {
			return json(
				formatErrorResponse(
					new ApiError('limit query parameter is required', 400, 'VALIDATION_ERROR')
				),
				{ status: 400 }
			);
		}

		if (offsetParam === null) {
			return json(
				formatErrorResponse(
					new ApiError('offset query parameter is required', 400, 'VALIDATION_ERROR')
				),
				{ status: 400 }
			);
		}

		const limit = parseInt(limitParam, 10);
		const offset = parseInt(offsetParam, 10);

		if (isNaN(limit) || isNaN(offset)) {
			return json(
				formatErrorResponse(
					new ApiError('limit and offset must be valid numbers', 400, 'VALIDATION_ERROR')
				),
				{ status: 400 }
			);
		}

		const params: {
			limit: number;
			offset: number;
			order?: string;
			ascending?: boolean;
			league?: string[];
			name?: string[];
			abbreviation?: string[];
		} = {
			limit,
			offset
		};

		const order = url.searchParams.get('order');
		if (order !== null) {
			params.order = order;
		}

		const ascendingParam = url.searchParams.get('ascending');
		if (ascendingParam !== null) {
			params.ascending = ascendingParam === 'true';
		}

		const leagues = url.searchParams.getAll('league');
		if (leagues.length > 0) {
			params.league = leagues;
		}

		const names = url.searchParams.getAll('name');
		if (names.length > 0) {
			params.name = names;
		}

		const abbreviations = url.searchParams.getAll('abbreviation');
		if (abbreviations.length > 0) {
			params.abbreviation = abbreviations;
		}

		logger.info('Fetching teams', { params });

		const teams = await sportsService.getTeams(params);

		const duration = Date.now() - startTime;
		logger.info('Teams fetched successfully', { count: teams.length, duration });

		return json(teams, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in teams route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in teams route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
};
