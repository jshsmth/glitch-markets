/**
 * Input validation utilities
 */

import { ValidationError } from '../errors/api-errors.js';

/**
 * Validates that a string parameter is not empty
 */
export function validateNonEmptyString(value: unknown, paramName: string): string {
	if (typeof value !== 'string') {
		throw new ValidationError(`${paramName} must be a string`, { paramName, value });
	}

	if (value.trim().length === 0) {
		throw new ValidationError(`${paramName} cannot be empty`, { paramName, value });
	}

	return value;
}

/**
 * Validates that a number parameter is positive
 */
export function validatePositiveNumber(value: unknown, paramName: string): number {
	if (typeof value !== 'number') {
		throw new ValidationError(`${paramName} must be a number`, { paramName, value });
	}

	if (!Number.isFinite(value)) {
		throw new ValidationError(`${paramName} must be a finite number`, { paramName, value });
	}

	if (value <= 0) {
		throw new ValidationError(`${paramName} must be positive`, { paramName, value });
	}

	return value;
}

/**
 * Validates that a number parameter is non-negative
 */
export function validateNonNegativeNumber(value: unknown, paramName: string): number {
	if (typeof value !== 'number') {
		throw new ValidationError(`${paramName} must be a number`, { paramName, value });
	}

	if (!Number.isFinite(value)) {
		throw new ValidationError(`${paramName} must be a finite number`, { paramName, value });
	}

	if (value < 0) {
		throw new ValidationError(`${paramName} must be non-negative`, { paramName, value });
	}

	return value;
}

/**
 * Validates that a boolean parameter is actually a boolean
 */
export function validateBoolean(value: unknown, paramName: string): boolean {
	if (typeof value !== 'boolean') {
		throw new ValidationError(`${paramName} must be a boolean`, { paramName, value });
	}

	return value;
}

/**
 * Validates query parameters for the markets endpoint
 */
export function validateMarketQueryParams(
	params: Record<string, string | number | boolean | string[]>
): Record<string, string | number | boolean | string[]> {
	const validated: Record<string, string | number | boolean | string[]> = {};

	for (const [key, value] of Object.entries(params)) {
		switch (key) {
			case 'limit':
			case 'offset':
				validated[key] = validateNonNegativeNumber(value, key);
				break;
			case 'active':
			case 'closed':
				validated[key] = validateBoolean(value, key);
				break;
			case 'category':
				validated[key] = validateNonEmptyString(value, key);
				break;
			default:
				validated[key] = value;
		}
	}

	return validated;
}

/**
 * Validates a market ID
 */
export function validateMarketId(id: unknown): string {
	return validateNonEmptyString(id, 'market ID');
}

/**
 * Validates a market slug
 */
export function validateMarketSlug(slug: unknown): string {
	return validateNonEmptyString(slug, 'market slug');
}

/**
 * Validates query parameters for the events endpoint
 */
export function validateEventQueryParams(
	params: Record<string, string | number | boolean | string[]>
): Record<string, string | number | boolean | string[]> {
	const validated: Record<string, string | number | boolean | string[]> = {};

	for (const [key, value] of Object.entries(params)) {
		switch (key) {
			case 'limit':
			case 'offset':
				validated[key] = validateNonNegativeNumber(value, key);
				break;
			case 'active':
			case 'closed':
			case 'archived':
			case 'ascending':
			case 'featured_order':
				validated[key] = validateBoolean(value, key);
				break;
			case 'category':
			case 'tag_slug':
			case 'order':
				validated[key] = validateNonEmptyString(value, key);
				break;
			case 'exclude_tag_id':
				if (Array.isArray(value)) {
					validated[key] = value.map((v) => validateNonEmptyString(v, 'exclude_tag_id'));
				} else {
					validated[key] = validateNonEmptyString(value, key);
				}
				break;
			default:
				validated[key] = value;
		}
	}

	return validated;
}

/**
 * Validates an event ID
 */
export function validateEventId(id: unknown): string {
	return validateNonEmptyString(id, 'event ID');
}

/**
 * Validates an event slug
 */
export function validateEventSlug(slug: unknown): string {
	const validated = validateNonEmptyString(slug, 'event slug');

	if (!/^[a-zA-Z0-9_-]+$/.test(validated)) {
		throw new ValidationError(
			'event slug must contain only alphanumeric characters, hyphens, and underscores',
			{
				slug: validated
			}
		);
	}

	return validated;
}

/**
 * Validates a tag ID
 */
export function validateTagId(id: unknown): string {
	return validateNonEmptyString(id, 'tag ID');
}

/**
 * Validates a tag slug
 */
export function validateTagSlug(slug: unknown): string {
	return validateNonEmptyString(slug, 'tag slug');
}

/**
 * Validates a proxy wallet address (0x + 40 hex chars)
 */
export function validateProxyWallet(wallet: unknown): string {
	const validated = validateNonEmptyString(wallet, 'proxy wallet');

	if (!/^0x[0-9a-fA-F]{40}$/.test(validated)) {
		throw new ValidationError(
			'proxy wallet must be a valid Ethereum address (0x followed by 40 hexadecimal characters)',
			{
				wallet: validated
			}
		);
	}

	return validated;
}

/**
 * Validates a condition ID (0x + 64 hex chars)
 */
export function validateConditionId(conditionId: unknown): string {
	const validated = validateNonEmptyString(conditionId, 'condition ID');

	if (!/^0x[0-9a-fA-F]{64}$/.test(validated)) {
		throw new ValidationError(
			'condition ID must be a valid format (0x followed by 64 hexadecimal characters)',
			{
				conditionId: validated
			}
		);
	}

	return validated;
}

/**
 * Validates an array of market token strings
 */
export function validateMarketTokens(tokens: unknown): string[] {
	if (!Array.isArray(tokens)) {
		throw new ValidationError('market tokens must be an array', { tokens });
	}

	if (tokens.length === 0) {
		throw new ValidationError('market tokens array cannot be empty', { tokens });
	}

	const validated: string[] = [];
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (typeof token !== 'string' || token.trim().length === 0) {
			throw new ValidationError(`market token at index ${i} must be a non-empty string`, {
				token,
				index: i
			});
		}
		validated.push(token);
	}

	return validated;
}

/**
 * Validates parameters for the user positions endpoint
 */
export function validateUserPositionsParams(params: Record<string, unknown>): {
	user: string;
	market?: string[];
} {
	const user = validateProxyWallet(params.user);

	const result: { user: string; market?: string[] } = { user };

	if (params.market !== undefined && params.market !== null) {
		const marketParam = Array.isArray(params.market) ? params.market : [params.market];
		result.market = validateMarketTokens(marketParam);
	}

	return result;
}

/**
 * Validates parameters for the trades endpoint
 * Requires at least one of user or market
 */
export function validateTradesParams(params: Record<string, unknown>): {
	user?: string;
	market?: string[];
} {
	const result: { user?: string; market?: string[] } = {};

	if (
		(params.user === undefined || params.user === null) &&
		(params.market === undefined || params.market === null)
	) {
		throw new ValidationError('trades endpoint requires at least one of: user or market', {
			params
		});
	}

	if (params.user !== undefined && params.user !== null) {
		result.user = validateProxyWallet(params.user);
	}

	if (params.market !== undefined && params.market !== null) {
		const marketParam = Array.isArray(params.market) ? params.market : [params.market];
		result.market = validateMarketTokens(marketParam);
	}

	return result;
}

/**
 * Validates parameters for the user activity endpoint
 */
export function validateUserActivityParams(params: Record<string, unknown>): {
	user: string;
} {
	const user = validateProxyWallet(params.user);
	return { user };
}

/**
 * Validates parameters for the top holders endpoint
 * Requires at least one market
 */
export function validateTopHoldersParams(params: Record<string, unknown>): {
	market: string[];
} {
	if (params.market === undefined || params.market === null) {
		throw new ValidationError('holders endpoint requires market parameter', { params });
	}

	const marketParam = Array.isArray(params.market) ? params.market : [params.market];
	const market = validateMarketTokens(marketParam);

	return { market };
}

/**
 * Validates parameters for the portfolio value endpoint
 */
export function validatePortfolioValueParams(params: Record<string, unknown>): {
	user: string;
	market?: string[];
} {
	const user = validateProxyWallet(params.user);

	const result: { user: string; market?: string[] } = { user };

	if (params.market !== undefined && params.market !== null) {
		const marketParam = Array.isArray(params.market) ? params.market : [params.market];
		result.market = validateMarketTokens(marketParam);
	}

	return result;
}

/**
 * Validates parameters for the closed positions endpoint
 */
export function validateClosedPositionsParams(params: Record<string, unknown>): {
	user: string;
} {
	const user = validateProxyWallet(params.user);
	return { user };
}

/**
 * Validates query parameters for the series endpoint
 */
export function validateSeriesQueryParams(
	params: Record<string, string | number | boolean | string[]>
): Record<string, string | number | boolean | string[]> {
	const validated: Record<string, string | number | boolean | string[]> = {};

	for (const [key, value] of Object.entries(params)) {
		switch (key) {
			case 'limit':
			case 'offset':
				validated[key] = validateNonNegativeNumber(value, key);
				break;
			case 'active':
			case 'closed':
				validated[key] = validateBoolean(value, key);
				break;
			case 'category':
				validated[key] = validateNonEmptyString(value, key);
				break;
			default:
				validated[key] = value;
		}
	}

	return validated;
}

/**
 * Validates a series ID
 */
export function validateSeriesId(id: unknown): string {
	return validateNonEmptyString(id, 'series ID');
}

/**
 * Validates a series slug
 */
export function validateSeriesSlug(slug: unknown): string {
	return validateNonEmptyString(slug, 'series slug');
}

/**
 * Validates a comment ID (non-negative integer)
 */
export function validateCommentId(id: unknown): number {
	if (typeof id !== 'number' && typeof id !== 'string') {
		throw new ValidationError('comment ID must be a number or string', { id });
	}

	const parsed = typeof id === 'string' ? parseInt(id, 10) : id;

	if (!Number.isInteger(parsed) || parsed < 0) {
		throw new ValidationError('comment ID must be a non-negative integer', { id, parsed });
	}

	return parsed;
}

/**
 * Validates parent entity type
 */
export function validateParentEntityType(type: unknown): 'Event' | 'Series' | 'market' {
	if (typeof type !== 'string') {
		throw new ValidationError('parent entity type must be a string', { type });
	}

	const validTypes = ['Event', 'Series', 'market'] as const;
	if (!validTypes.includes(type as 'Event' | 'Series' | 'market')) {
		throw new ValidationError(`parent entity type must be one of: ${validTypes.join(', ')}`, {
			type,
			validTypes
		});
	}

	return type as 'Event' | 'Series' | 'market';
}

/**
 * Validates parent entity ID (non-negative integer)
 */
export function validateParentEntityId(id: unknown): number {
	if (typeof id !== 'number' && typeof id !== 'string') {
		throw new ValidationError('parent entity ID must be a number or string', { id });
	}

	const parsed = typeof id === 'string' ? parseInt(id, 10) : id;

	if (!Number.isInteger(parsed) || parsed < 0) {
		throw new ValidationError('parent entity ID must be a non-negative integer', { id, parsed });
	}

	return parsed;
}

/**
 * Validates an order string (comma-separated field names)
 */
export function validateOrderString(order: unknown): string {
	if (typeof order !== 'string') {
		throw new ValidationError('order must be a string', { order });
	}

	if (order.trim().length === 0) {
		throw new ValidationError('order cannot be empty', { order });
	}

	const fields = order.split(',').map((f) => f.trim());
	for (const field of fields) {
		if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
			throw new ValidationError(`invalid field name in order: ${field}`, { order, field });
		}
	}

	return order;
}

/**
 * Validates query parameters for the comments list endpoint
 */
export function validateCommentsQueryParams(
	params: Record<string, string | number | boolean | string[]>
): Record<string, string | number | boolean | string[]> {
	const validated: Record<string, string | number | boolean | string[]> = {};

	for (const [key, value] of Object.entries(params)) {
		switch (key) {
			case 'limit':
			case 'offset':
			case 'parent_entity_id':
				validated[key] = validateNonNegativeNumber(value, key);
				break;
			case 'ascending':
			case 'get_positions':
			case 'holders_only':
				validated[key] = validateBoolean(value, key);
				break;
			case 'order':
				validated[key] = validateOrderString(value);
				break;
			case 'parent_entity_type':
				validated[key] = validateParentEntityType(value);
				break;
			default:
				validated[key] = value;
		}
	}

	return validated;
}

/**
 * Validates query parameters for the comments by user endpoint
 */
export function validateUserCommentsQueryParams(
	params: Record<string, string | number | boolean | string[]>
): Record<string, string | number | boolean | string[]> {
	const validated: Record<string, string | number | boolean | string[]> = {};

	for (const [key, value] of Object.entries(params)) {
		switch (key) {
			case 'limit':
			case 'offset':
				validated[key] = validateNonNegativeNumber(value, key);
				break;
			case 'ascending':
				validated[key] = validateBoolean(value, key);
				break;
			case 'order':
				validated[key] = validateOrderString(value);
				break;
			default:
				validated[key] = value;
		}
	}

	return validated;
}

/**
 * Validates query parameters for the search endpoint
 */
export function validateSearchQueryParams(
	params: Record<string, string | number | boolean | string[] | number[]>
): Record<string, string | number | boolean | string[] | number[]> {
	const validated: Record<string, string | number | boolean | string[] | number[]> = {};

	for (const [key, value] of Object.entries(params)) {
		switch (key) {
			case 'q':
				// Required parameter - must be non-empty string
				validated[key] = validateNonEmptyString(value, key);
				break;
			case 'limit_per_type':
			case 'page':
				// Numeric parameters - must be non-negative integers
				validated[key] = validateNonNegativeNumber(value, key);
				break;
			case 'keep_closed_markets':
				// Must be 0 or 1
				if (typeof value !== 'number' || (value !== 0 && value !== 1)) {
					throw new ValidationError('keep_closed_markets must be 0 or 1', {
						keep_closed_markets: value
					});
				}
				validated[key] = value;
				break;
			case 'cache':
			case 'ascending':
			case 'search_tags':
			case 'search_profiles':
			case 'optimized':
				// Boolean parameters
				validated[key] = validateBoolean(value, key);
				break;
			case 'events_status':
			case 'sort':
			case 'recurrence':
				// String parameters - can be empty
				if (typeof value !== 'string') {
					throw new ValidationError(`${key} must be a string`, { [key]: value });
				}
				validated[key] = value;
				break;
			case 'events_tag':
				// Array of strings
				if (!Array.isArray(value)) {
					throw new ValidationError('events_tag must be an array', { events_tag: value });
				}
				for (let i = 0; i < value.length; i++) {
					if (typeof value[i] !== 'string') {
						throw new ValidationError(`events_tag at index ${i} must be a string`, {
							events_tag: value,
							index: i
						});
					}
				}
				validated[key] = value;
				break;
			case 'exclude_tag_id':
				// Array of numbers
				if (!Array.isArray(value)) {
					throw new ValidationError('exclude_tag_id must be an array', { exclude_tag_id: value });
				}
				for (let i = 0; i < value.length; i++) {
					if (typeof value[i] !== 'number' || !Number.isInteger(value[i])) {
						throw new ValidationError(`exclude_tag_id at index ${i} must be an integer`, {
							exclude_tag_id: value,
							index: i
						});
					}
				}
				validated[key] = value;
				break;
			default:
				validated[key] = value;
		}
	}

	// Ensure required parameter 'q' is present
	if (!validated.q) {
		throw new ValidationError('q parameter is required', { params });
	}

	return validated;
}

/**
 * Validates an Ethereum wallet address
 * Ethereum addresses must be 0x followed by 40 hexadecimal characters
 *
 * @param address - The address to validate
 * @returns The validated address in lowercase
 * @throws {ValidationError} When the address is invalid
 *
 * @example
 * ```typescript
 * const address = validateEthereumAddress('0x56687bf447db6ffa42ffe2204a05edaa20f55839');
 * // Returns: '0x56687bf447db6ffa42ffe2204a05edaa20f55839'
 * ```
 */
export function validateEthereumAddress(address: unknown): string {
	if (typeof address !== 'string') {
		throw new ValidationError('address must be a string', { address });
	}

	const trimmed = address.trim();
	if (trimmed.length === 0) {
		throw new ValidationError('address cannot be empty', { address });
	}

	const pattern = /^0x[a-fA-F0-9]{40}$/;
	if (!pattern.test(trimmed)) {
		throw new ValidationError('Invalid Ethereum address format', {
			address,
			expected: '0x followed by 40 hexadecimal characters'
		});
	}

	return trimmed.toLowerCase();
}

/**
 * Validates query parameters for the teams endpoint
 *
 * @param params - Query parameters object
 * @returns Validated parameters
 * @throws {ValidationError} When validation fails
 *
 * @example
 * ```typescript
 * const params = validateTeamQueryParams({
 *   limit: 10,
 *   offset: 0,
 *   league: ['NBA', 'NFL']
 * });
 * ```
 */
export function validateTeamQueryParams(params: {
	limit: number;
	offset: number;
	order?: string;
	ascending?: boolean;
	league?: string[];
	name?: string[];
	abbreviation?: string[];
}): {
	limit: number;
	offset: number;
	order?: string;
	ascending?: boolean;
	league?: string[];
	name?: string[];
	abbreviation?: string[];
} {
	const limit = validateNonNegativeNumber(params.limit, 'limit');
	const offset = validateNonNegativeNumber(params.offset, 'offset');

	const validated: {
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

	if (params.order !== undefined) {
		validated.order = validateNonEmptyString(params.order, 'order');
	}

	if (params.ascending !== undefined) {
		validated.ascending = validateBoolean(params.ascending, 'ascending');
	}

	if (params.league !== undefined) {
		if (!Array.isArray(params.league)) {
			throw new ValidationError('league must be an array', { league: params.league });
		}
		if (params.league.length > 0) {
			validated.league = params.league.map((item, index) => {
				if (typeof item !== 'string' || item.trim().length === 0) {
					throw new ValidationError(`league[${index}] must be a non-empty string`, {
						league: params.league,
						index
					});
				}
				return item;
			});
		}
	}

	if (params.name !== undefined) {
		if (!Array.isArray(params.name)) {
			throw new ValidationError('name must be an array', { name: params.name });
		}
		if (params.name.length > 0) {
			validated.name = params.name.map((item, index) => {
				if (typeof item !== 'string' || item.trim().length === 0) {
					throw new ValidationError(`name[${index}] must be a non-empty string`, {
						name: params.name,
						index
					});
				}
				return item;
			});
		}
	}

	if (params.abbreviation !== undefined) {
		if (!Array.isArray(params.abbreviation)) {
			throw new ValidationError('abbreviation must be an array', {
				abbreviation: params.abbreviation
			});
		}
		if (params.abbreviation.length > 0) {
			validated.abbreviation = params.abbreviation.map((item, index) => {
				if (typeof item !== 'string' || item.trim().length === 0) {
					throw new ValidationError(`abbreviation[${index}] must be a non-empty string`, {
						abbreviation: params.abbreviation,
						index
					});
				}
				return item;
			});
		}
	}

	return validated;
}

/**
 * Validates builder leaderboard query parameters
 * @param params - Raw parameters object
 * @returns Validated BuilderLeaderboardParams object
 * @throws {ValidationError} If validation fails
 *
 * @example
 * ```typescript
 * const params = validateBuilderLeaderboardParams({
 *   timePeriod: 'WEEK',
 *   limit: 25,
 *   offset: 0
 * });
 * ```
 */
export function validateBuilderLeaderboardParams(params: Record<string, unknown>): {
	timePeriod: 'DAY' | 'WEEK' | 'MONTH' | 'ALL';
	limit?: number;
	offset?: number;
} {
	const validated: {
		timePeriod: 'DAY' | 'WEEK' | 'MONTH' | 'ALL';
		limit?: number;
		offset?: number;
	} = {
		timePeriod: 'DAY' // default
	};

	if (params.timePeriod !== undefined) {
		const validPeriods = ['DAY', 'WEEK', 'MONTH', 'ALL'];
		const timePeriod = params.timePeriod;

		if (typeof timePeriod !== 'string' || !validPeriods.includes(timePeriod)) {
			throw new ValidationError(`timePeriod must be one of: ${validPeriods.join(', ')}`, {
				timePeriod,
				validPeriods
			});
		}

		validated.timePeriod = timePeriod as 'DAY' | 'WEEK' | 'MONTH' | 'ALL';
	}

	if (params.limit !== undefined) {
		const limit = Number(params.limit);

		if (isNaN(limit)) {
			throw new ValidationError('limit must be a valid number', { limit: params.limit });
		}

		if (limit < 0 || limit > 50) {
			throw new ValidationError('limit must be between 0 and 50', { limit });
		}

		validated.limit = limit;
	}

	if (params.offset !== undefined) {
		const offset = Number(params.offset);

		if (isNaN(offset)) {
			throw new ValidationError('offset must be a valid number', { offset: params.offset });
		}

		if (offset < 0 || offset > 1000) {
			throw new ValidationError('offset must be between 0 and 1000', { offset });
		}

		validated.offset = offset;
	}

	return validated;
}

/**
 * Validates builder volume time-series query parameters
 * @param params - Raw parameters object
 * @returns Validated BuilderVolumeParams object
 * @throws {ValidationError} If validation fails
 *
 * @example
 * ```typescript
 * const params = validateBuilderVolumeParams({
 *   timePeriod: 'MONTH'
 * });
 * ```
 */
export function validateBuilderVolumeParams(params: Record<string, unknown>): {
	timePeriod: 'DAY' | 'WEEK' | 'MONTH' | 'ALL';
} {
	const validPeriods = ['DAY', 'WEEK', 'MONTH', 'ALL'];
	const timePeriod = params.timePeriod ?? 'DAY';

	if (typeof timePeriod !== 'string' || !validPeriods.includes(timePeriod)) {
		throw new ValidationError(`timePeriod must be one of: ${validPeriods.join(', ')}`, {
			timePeriod,
			validPeriods
		});
	}

	return {
		timePeriod: timePeriod as 'DAY' | 'WEEK' | 'MONTH' | 'ALL'
	};
}

/**
 * Validates a market token ID (CLOB token ID)
 */
export function validateTokenId(tokenId: unknown): string {
	return validateNonEmptyString(tokenId, 'market');
}

/**
 * Validates a Unix timestamp
 */
export function validateTimestamp(timestamp: unknown, paramName: string): number {
	if (typeof timestamp !== 'number' && typeof timestamp !== 'string') {
		throw new ValidationError(`${paramName} must be a number or string`, {
			[paramName]: timestamp
		});
	}

	const parsed = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;

	if (!Number.isInteger(parsed) || parsed < 0) {
		throw new ValidationError(`${paramName} must be a non-negative integer`, {
			[paramName]: timestamp,
			parsed
		});
	}

	return parsed;
}

/**
 * Validates price history interval parameter
 */
export function validateInterval(interval: unknown): '1m' | '1w' | '1d' | '6h' | '1h' | 'max' {
	if (typeof interval !== 'string') {
		throw new ValidationError('interval must be a string', { interval });
	}

	const validIntervals = ['1m', '1w', '1d', '6h', '1h', 'max'] as const;
	if (!validIntervals.includes(interval as '1m' | '1w' | '1d' | '6h' | '1h' | 'max')) {
		throw new ValidationError(`interval must be one of: ${validIntervals.join(', ')}`, {
			interval,
			validIntervals
		});
	}

	return interval as '1m' | '1w' | '1d' | '6h' | '1h' | 'max';
}

/**
 * Validates query parameters for the price history endpoint
 */
export function validatePriceHistoryParams(params: {
	market: string;
	startTs?: number;
	endTs?: number;
	interval?: string;
	fidelity?: number;
}): {
	market: string;
	startTs?: number;
	endTs?: number;
	interval?: '1m' | '1w' | '1d' | '6h' | '1h' | 'max';
	fidelity?: number;
} {
	const validated: {
		market: string;
		startTs?: number;
		endTs?: number;
		interval?: '1m' | '1w' | '1d' | '6h' | '1h' | 'max';
		fidelity?: number;
	} = {
		market: validateTokenId(params.market)
	};

	if (
		params.interval !== undefined &&
		(params.startTs !== undefined || params.endTs !== undefined)
	) {
		throw new ValidationError('interval parameter is mutually exclusive with startTs and endTs', {
			interval: params.interval,
			startTs: params.startTs,
			endTs: params.endTs
		});
	}

	if (params.startTs !== undefined) {
		validated.startTs = validateTimestamp(params.startTs, 'startTs');
	}

	if (params.endTs !== undefined) {
		validated.endTs = validateTimestamp(params.endTs, 'endTs');
	}

	if (params.interval !== undefined) {
		validated.interval = validateInterval(params.interval);
	}

	if (params.fidelity !== undefined) {
		validated.fidelity = validatePositiveNumber(params.fidelity, 'fidelity');
	}

	if (
		validated.startTs !== undefined &&
		validated.endTs !== undefined &&
		validated.startTs > validated.endTs
	) {
		throw new ValidationError('startTs must be less than or equal to endTs', {
			startTs: validated.startTs,
			endTs: validated.endTs
		});
	}

	return validated;
}
