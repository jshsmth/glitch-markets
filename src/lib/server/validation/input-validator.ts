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
	params: Record<string, string | number | boolean>
): Record<string, string | number | boolean> {
	const validated: Record<string, string | number | boolean> = {};

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
	params: Record<string, string | number | boolean>
): Record<string, string | number | boolean> {
	const validated: Record<string, string | number | boolean> = {};

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
