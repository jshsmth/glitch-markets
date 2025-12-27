/**
 * SvelteKit server route for fetching events list
 * GET /api/events
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { EventService } from '$lib/server/services/event-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/utils/logger';
import {
	parseInteger,
	parseBoolean,
	parseNumber,
	parseIntegerArray,
	validateNonNegative
} from '$lib/server/utils/query-params.js';

const logger = new Logger({ component: 'EventsRoute' });
const eventService = new EventService();

/**
 * GET handler for /api/events
 * Fetches a list of events with optional filtering and pagination
 */
export async function GET({ url }: RequestEvent) {
	const startTime = Date.now();

	try {
		const filters: {
			limit?: number;
			offset?: number;
			order?: string;
			ascending?: boolean;
			id?: number[];
			slug?: string[];
			tag_id?: number;
			tag_slug?: string;
			exclude_tag_id?: number[];
			related_tags?: boolean;
			active?: boolean;
			closed?: boolean;
			archived?: boolean;
			featured?: boolean;
			cyom?: boolean;
			liquidity_min?: number;
			liquidity_max?: number;
			volume_min?: number;
			volume_max?: number;
			start_date_min?: string;
			start_date_max?: string;
			end_date_min?: string;
			end_date_max?: string;
			recurrence?: string;
			include_chat?: boolean;
			include_template?: boolean;
		} = {};

		// Pagination
		const limit = parseInteger(url.searchParams.get('limit'), 'limit');
		validateNonNegative(limit, 'limit');
		if (limit !== null) filters.limit = limit;

		const offset = parseInteger(url.searchParams.get('offset'), 'offset');
		validateNonNegative(offset, 'offset');
		if (offset !== null) filters.offset = offset;

		const order = url.searchParams.get('order');
		if (order !== null) filters.order = order;

		const ascending = parseBoolean(url.searchParams.get('ascending'), 'ascending');
		if (ascending !== null) filters.ascending = ascending;

		// Identifiers
		const ids = url.searchParams.getAll('id');
		if (ids.length > 0) {
			filters.id = parseIntegerArray(ids, 'id');
		}

		const slugs = url.searchParams.getAll('slug');
		if (slugs.length > 0) filters.slug = slugs;

		// Tags
		const tag_id = parseInteger(url.searchParams.get('tag_id'), 'tag_id');
		if (tag_id !== null) filters.tag_id = tag_id;

		const tag_slug = url.searchParams.get('tag_slug');
		if (tag_slug !== null) filters.tag_slug = tag_slug;

		const exclude_tag_ids = url.searchParams.getAll('exclude_tag_id');
		if (exclude_tag_ids.length > 0) {
			filters.exclude_tag_id = parseIntegerArray(exclude_tag_ids, 'exclude_tag_id');
		}

		const related_tags = parseBoolean(url.searchParams.get('related_tags'), 'related_tags');
		if (related_tags !== null) filters.related_tags = related_tags;

		// Status
		const active = parseBoolean(url.searchParams.get('active'), 'active');
		if (active !== null) filters.active = active;

		const closed = parseBoolean(url.searchParams.get('closed'), 'closed');
		if (closed !== null) filters.closed = closed;

		const archived = parseBoolean(url.searchParams.get('archived'), 'archived');
		if (archived !== null) filters.archived = archived;

		const featured = parseBoolean(url.searchParams.get('featured'), 'featured');
		if (featured !== null) filters.featured = featured;

		const cyom = parseBoolean(url.searchParams.get('cyom'), 'cyom');
		if (cyom !== null) filters.cyom = cyom;

		// Metrics
		const liquidity_min = parseNumber(url.searchParams.get('liquidity_min'), 'liquidity_min');
		if (liquidity_min !== null) filters.liquidity_min = liquidity_min;

		const liquidity_max = parseNumber(url.searchParams.get('liquidity_max'), 'liquidity_max');
		if (liquidity_max !== null) filters.liquidity_max = liquidity_max;

		const volume_min = parseNumber(url.searchParams.get('volume_min'), 'volume_min');
		if (volume_min !== null) filters.volume_min = volume_min;

		const volume_max = parseNumber(url.searchParams.get('volume_max'), 'volume_max');
		if (volume_max !== null) filters.volume_max = volume_max;

		// Time
		const start_date_min = url.searchParams.get('start_date_min');
		if (start_date_min !== null) filters.start_date_min = start_date_min;

		const start_date_max = url.searchParams.get('start_date_max');
		if (start_date_max !== null) filters.start_date_max = start_date_max;

		const end_date_min = url.searchParams.get('end_date_min');
		if (end_date_min !== null) filters.end_date_min = end_date_min;

		const end_date_max = url.searchParams.get('end_date_max');
		if (end_date_max !== null) filters.end_date_max = end_date_max;

		// Attributes
		const recurrence = url.searchParams.get('recurrence');
		if (recurrence !== null) filters.recurrence = recurrence;

		const include_chat = parseBoolean(url.searchParams.get('include_chat'), 'include_chat');
		if (include_chat !== null) filters.include_chat = include_chat;

		const include_template = parseBoolean(
			url.searchParams.get('include_template'),
			'include_template'
		);
		if (include_template !== null) filters.include_template = include_template;

		logger.info('Fetching events', { filters });

		const events = await eventService.getEvents(filters);

		const duration = Date.now() - startTime;
		logger.info('Events fetched successfully', { count: events.length, duration });

		return json(events, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in events route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in events route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
