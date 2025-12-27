/**
 * SvelteKit server route for fetching markets list
 * GET /api/markets
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { MarketService } from '$lib/server/services/market-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/utils/logger';
import {
	parseInteger,
	parseBoolean,
	parseNumber,
	parseIntegerArray,
	validateNonNegative
} from '$lib/server/utils/query-params.js';

const logger = new Logger({ component: 'MarketsRoute' });
const marketService = new MarketService();

/**
 * GET handler for /api/markets
 * Fetches a list of markets with optional filtering and pagination
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
			clob_token_ids?: string[];
			condition_ids?: string[];
			market_maker_address?: string[];
			question_ids?: string[];
			liquidity_num_min?: number;
			liquidity_num_max?: number;
			volume_num_min?: number;
			volume_num_max?: number;
			start_date_min?: string;
			start_date_max?: string;
			end_date_min?: string;
			end_date_max?: string;
			tag_id?: number;
			related_tags?: boolean;
			sports_market_types?: string[];
			uma_resolution_status?: string;
			game_id?: string;
			rewards_min_size?: number;
			cyom?: boolean;
			closed?: boolean;
			active?: boolean;
			include_tag?: boolean;
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

		const clob_token_ids = url.searchParams.getAll('clob_token_ids');
		if (clob_token_ids.length > 0) filters.clob_token_ids = clob_token_ids;

		const condition_ids = url.searchParams.getAll('condition_ids');
		if (condition_ids.length > 0) filters.condition_ids = condition_ids;

		const market_maker_address = url.searchParams.getAll('market_maker_address');
		if (market_maker_address.length > 0) filters.market_maker_address = market_maker_address;

		const question_ids = url.searchParams.getAll('question_ids');
		if (question_ids.length > 0) filters.question_ids = question_ids;

		// Metrics
		const liquidity_num_min = parseNumber(
			url.searchParams.get('liquidity_num_min'),
			'liquidity_num_min'
		);
		if (liquidity_num_min !== null) filters.liquidity_num_min = liquidity_num_min;

		const liquidity_num_max = parseNumber(
			url.searchParams.get('liquidity_num_max'),
			'liquidity_num_max'
		);
		if (liquidity_num_max !== null) filters.liquidity_num_max = liquidity_num_max;

		const volume_num_min = parseNumber(url.searchParams.get('volume_num_min'), 'volume_num_min');
		if (volume_num_min !== null) filters.volume_num_min = volume_num_min;

		const volume_num_max = parseNumber(url.searchParams.get('volume_num_max'), 'volume_num_max');
		if (volume_num_max !== null) filters.volume_num_max = volume_num_max;

		// Time
		const start_date_min = url.searchParams.get('start_date_min');
		if (start_date_min !== null) filters.start_date_min = start_date_min;

		const start_date_max = url.searchParams.get('start_date_max');
		if (start_date_max !== null) filters.start_date_max = start_date_max;

		const end_date_min = url.searchParams.get('end_date_min');
		if (end_date_min !== null) filters.end_date_min = end_date_min;

		const end_date_max = url.searchParams.get('end_date_max');
		if (end_date_max !== null) filters.end_date_max = end_date_max;

		// Categories & Tags
		const tag_id = parseInteger(url.searchParams.get('tag_id'), 'tag_id');
		if (tag_id !== null) filters.tag_id = tag_id;

		const related_tags = parseBoolean(url.searchParams.get('related_tags'), 'related_tags');
		if (related_tags !== null) filters.related_tags = related_tags;

		const sports_market_types = url.searchParams.getAll('sports_market_types');
		if (sports_market_types.length > 0) filters.sports_market_types = sports_market_types;

		// Status & Type
		const uma_resolution_status = url.searchParams.get('uma_resolution_status');
		if (uma_resolution_status !== null) filters.uma_resolution_status = uma_resolution_status;

		const game_id = url.searchParams.get('game_id');
		if (game_id !== null) filters.game_id = game_id;

		const rewards_min_size = parseNumber(
			url.searchParams.get('rewards_min_size'),
			'rewards_min_size'
		);
		if (rewards_min_size !== null) filters.rewards_min_size = rewards_min_size;

		const cyom = parseBoolean(url.searchParams.get('cyom'), 'cyom');
		if (cyom !== null) filters.cyom = cyom;

		const closed = parseBoolean(url.searchParams.get('closed'), 'closed');
		if (closed !== null) filters.closed = closed;

		const active = parseBoolean(url.searchParams.get('active'), 'active');
		if (active !== null) filters.active = active;

		const include_tag = parseBoolean(url.searchParams.get('include_tag'), 'include_tag');
		if (include_tag !== null) filters.include_tag = include_tag;

		logger.info('Fetching markets', { filters });

		const markets = await marketService.getMarkets(filters);

		const duration = Date.now() - startTime;
		logger.info('Markets fetched successfully', { count: markets.length, duration });

		return json(markets, {
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': 'public, max-age=60',
				'Vercel-CDN-Cache-Control': 'public, max-age=60'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in markets route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in markets route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
