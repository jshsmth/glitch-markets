/**
 * SvelteKit server route for searching markets, events, and profiles
 * GET /api/search
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { SearchService } from '$lib/server/services/search-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';

const logger = new Logger({ component: 'SearchRoute' });
const searchService = new SearchService();

/**
 * Parses a query parameter that can be a single string or an array of strings
 * Supports both ?tag=a&tag=b and ?tag=a,b formats
 */
function parseArrayParam(value: string | null): string[] | undefined {
	if (value === null) return undefined;

	// If it contains commas, split by comma
	if (value.includes(',')) {
		return value
			.split(',')
			.map((v) => v.trim())
			.filter((v) => v.length > 0);
	}

	// Otherwise return as single-element array
	return [value];
}

/**
 * Parses a query parameter that can be a single number or an array of numbers
 * Supports both ?id=1&id=2 and ?id=1,2 formats
 */
function parseIntArrayParam(value: string | null): number[] | undefined {
	if (value === null) return undefined;

	let values: string[];
	if (value.includes(',')) {
		values = value.split(',').map((v) => v.trim());
	} else {
		values = [value];
	}

	const parsed: number[] = [];
	for (const v of values) {
		const num = parseInt(v, 10);
		if (isNaN(num)) {
			throw new ApiError(`Invalid integer value: ${v}`, 400, 'VALIDATION_ERROR');
		}
		parsed.push(num);
	}

	return parsed.length > 0 ? parsed : undefined;
}

/**
 * GET handler for /api/search
 * Searches across markets, events, and user profiles
 */
export async function GET({ url }: RequestEvent) {
	const startTime = Date.now();

	try {
		// Parse query parameters
		const q = url.searchParams.get('q');
		const cache = url.searchParams.get('cache');
		const eventsStatus = url.searchParams.get('events_status');
		const limitPerType = url.searchParams.get('limit_per_type');
		const page = url.searchParams.get('page');
		const keepClosedMarkets = url.searchParams.get('keep_closed_markets');
		const sort = url.searchParams.get('sort');
		const ascending = url.searchParams.get('ascending');
		const searchTags = url.searchParams.get('search_tags');
		const searchProfiles = url.searchParams.get('search_profiles');
		const recurrence = url.searchParams.get('recurrence');
		const optimized = url.searchParams.get('optimized');

		// Handle array parameters - both ?tag=a&tag=b and ?tag=a,b formats
		const eventsTagsParam = url.searchParams.getAll('events_tag');
		const excludeTagIdParam = url.searchParams.getAll('exclude_tag_id');

		// Validate required parameter
		if (q === null || q.trim().length === 0) {
			logger.error('Missing or empty q parameter', undefined, { q });
			return json(
				formatErrorResponse(
					new ApiError('q parameter is required and cannot be empty', 400, 'VALIDATION_ERROR')
				),
				{ status: 400 }
			);
		}

		// Build search options object
		const options: {
			q: string;
			cache?: boolean;
			eventsStatus?: string;
			limitPerType?: number;
			page?: number;
			eventsTags?: string[];
			keepClosedMarkets?: number;
			sort?: string;
			ascending?: boolean;
			searchTags?: boolean;
			searchProfiles?: boolean;
			recurrence?: string;
			excludeTagIds?: number[];
			optimized?: boolean;
		} = { q };

		// Parse cache parameter
		if (cache !== null) {
			if (cache !== 'true' && cache !== 'false') {
				logger.error('Invalid cache parameter', undefined, { cache });
				return json(
					formatErrorResponse(new ApiError('Invalid cache parameter', 400, 'VALIDATION_ERROR')),
					{ status: 400 }
				);
			}
			options.cache = cache === 'true';
		}

		// Parse events_status
		if (eventsStatus !== null) {
			options.eventsStatus = eventsStatus;
		}

		// Parse and validate limit_per_type
		if (limitPerType !== null) {
			const parsedLimit = parseInt(limitPerType, 10);
			if (isNaN(parsedLimit) || parsedLimit < 0) {
				logger.error('Invalid limit_per_type parameter', undefined, { limitPerType });
				return json(
					formatErrorResponse(
						new ApiError('Invalid limit_per_type parameter', 400, 'VALIDATION_ERROR')
					),
					{ status: 400 }
				);
			}
			options.limitPerType = parsedLimit;
		}

		// Parse and validate page
		if (page !== null) {
			const parsedPage = parseInt(page, 10);
			if (isNaN(parsedPage) || parsedPage < 0) {
				logger.error('Invalid page parameter', undefined, { page });
				return json(
					formatErrorResponse(new ApiError('Invalid page parameter', 400, 'VALIDATION_ERROR')),
					{ status: 400 }
				);
			}
			options.page = parsedPage;
		}

		// Parse and validate keep_closed_markets
		if (keepClosedMarkets !== null) {
			const parsedKeep = parseInt(keepClosedMarkets, 10);
			if (isNaN(parsedKeep) || (parsedKeep !== 0 && parsedKeep !== 1)) {
				logger.error('Invalid keep_closed_markets parameter', undefined, { keepClosedMarkets });
				return json(
					formatErrorResponse(
						new ApiError('keep_closed_markets must be 0 or 1', 400, 'VALIDATION_ERROR')
					),
					{ status: 400 }
				);
			}
			options.keepClosedMarkets = parsedKeep;
		}

		// Parse sort
		if (sort !== null) {
			options.sort = sort;
		}

		// Parse and validate ascending
		if (ascending !== null) {
			if (ascending !== 'true' && ascending !== 'false') {
				logger.error('Invalid ascending parameter', undefined, { ascending });
				return json(
					formatErrorResponse(new ApiError('Invalid ascending parameter', 400, 'VALIDATION_ERROR')),
					{ status: 400 }
				);
			}
			options.ascending = ascending === 'true';
		}

		// Parse and validate search_tags
		if (searchTags !== null) {
			if (searchTags !== 'true' && searchTags !== 'false') {
				logger.error('Invalid search_tags parameter', undefined, { searchTags });
				return json(
					formatErrorResponse(
						new ApiError('Invalid search_tags parameter', 400, 'VALIDATION_ERROR')
					),
					{ status: 400 }
				);
			}
			options.searchTags = searchTags === 'true';
		}

		// Parse and validate search_profiles
		if (searchProfiles !== null) {
			if (searchProfiles !== 'true' && searchProfiles !== 'false') {
				logger.error('Invalid search_profiles parameter', undefined, { searchProfiles });
				return json(
					formatErrorResponse(
						new ApiError('Invalid search_profiles parameter', 400, 'VALIDATION_ERROR')
					),
					{ status: 400 }
				);
			}
			options.searchProfiles = searchProfiles === 'true';
		}

		// Parse recurrence
		if (recurrence !== null) {
			options.recurrence = recurrence;
		}

		// Parse and validate optimized
		if (optimized !== null) {
			if (optimized !== 'true' && optimized !== 'false') {
				logger.error('Invalid optimized parameter', undefined, { optimized });
				return json(
					formatErrorResponse(new ApiError('Invalid optimized parameter', 400, 'VALIDATION_ERROR')),
					{ status: 400 }
				);
			}
			options.optimized = optimized === 'true';
		}

		// Parse events_tag array parameter
		if (eventsTagsParam.length > 0) {
			// Support both ?tag=a&tag=b and ?tag=a,b formats
			const allTags: string[] = [];
			for (const param of eventsTagsParam) {
				const parsed = parseArrayParam(param);
				if (parsed) {
					allTags.push(...parsed);
				}
			}
			if (allTags.length > 0) {
				options.eventsTags = allTags;
			}
		}

		// Parse exclude_tag_id array parameter
		if (excludeTagIdParam.length > 0) {
			try {
				const allIds: number[] = [];
				for (const param of excludeTagIdParam) {
					const parsed = parseIntArrayParam(param);
					if (parsed) {
						allIds.push(...parsed);
					}
				}
				if (allIds.length > 0) {
					options.excludeTagIds = allIds;
				}
			} catch (error) {
				if (error instanceof ApiError) {
					logger.error('Invalid exclude_tag_id parameter', error, { excludeTagIdParam });
					return json(formatErrorResponse(error), { status: 400 });
				}
				throw error;
			}
		}

		logger.info('Searching', { options });

		// Perform search using service
		const results = await searchService.search(options);

		const duration = Date.now() - startTime;
		logger.info('Search completed successfully', {
			eventsCount: results.events.length,
			tagsCount: results.tags.length,
			profilesCount: results.profiles.length,
			totalResults: results.pagination.totalResults,
			duration
		});

		// Return response with cache headers
		return json(results, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in search route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		// Handle unexpected errors
		logger.error('Unexpected error in search route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
