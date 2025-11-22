/**
 * Response validation utilities for API responses
 */

import { ValidationError } from '../errors/api-errors.js';
import type {
	Market,
	Event,
	Tag,
	Position,
	Trade,
	Activity,
	HolderInfo,
	MarketHolders,
	PortfolioValue,
	ClosedPosition
} from '../api/polymarket-client.js';

/**
 * Validates that a value is a string
 */
function isString(value: unknown): value is string {
	return typeof value === 'string';
}

/**
 * Validates that a value is a number
 */
function isNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Validates that a value is a boolean
 */
function isBoolean(value: unknown): value is boolean {
	return typeof value === 'boolean';
}

/**
 * Validates that a value is an array
 */
function isArray(value: unknown): value is unknown[] {
	return Array.isArray(value);
}

/**
 * Validates that a value is an object
 */
function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates a single market object
 */
export function validateMarket(data: unknown): Market {
	if (!isObject(data)) {
		throw new ValidationError('Market data must be an object', { data });
	}

	const requiredStringFields = [
		'id',
		'question',
		'conditionId',
		'slug',
		'endDate',
		'category',
		'liquidity',
		'image',
		'icon',
		'description',
		'volume',
		'marketType'
	];

	const missingFields: string[] = [];
	const invalidTypeFields: string[] = [];

	for (const field of requiredStringFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isString(data[field])) {
			invalidTypeFields.push(`${field} (expected string, got ${typeof data[field]})`);
		}
	}

	if (!('outcomes' in data)) {
		missingFields.push('outcomes');
	} else {
		let outcomes: unknown;
		if (isString(data.outcomes)) {
			try {
				outcomes = JSON.parse(data.outcomes);
				(data as Record<string, unknown>).outcomes = outcomes;
			} catch {
				invalidTypeFields.push('outcomes (invalid JSON string)');
			}
		} else {
			outcomes = data.outcomes;
		}

		if (outcomes !== undefined && !isArray(outcomes)) {
			invalidTypeFields.push(
				`outcomes (expected array or JSON array string, got ${typeof data.outcomes})`
			);
		} else if (outcomes !== undefined && !outcomes.every(isString)) {
			invalidTypeFields.push('outcomes (array must contain only strings)');
		}
	}

	if (!('outcomePrices' in data)) {
		missingFields.push('outcomePrices');
	} else {
		let outcomePrices: unknown;
		if (isString(data.outcomePrices)) {
			try {
				outcomePrices = JSON.parse(data.outcomePrices);
				(data as Record<string, unknown>).outcomePrices = outcomePrices;
			} catch {
				invalidTypeFields.push('outcomePrices (invalid JSON string)');
			}
		} else {
			outcomePrices = data.outcomePrices;
		}

		if (outcomePrices !== undefined && !isArray(outcomePrices)) {
			invalidTypeFields.push(
				`outcomePrices (expected array or JSON array string, got ${typeof data.outcomePrices})`
			);
		} else if (outcomePrices !== undefined && !outcomePrices.every(isString)) {
			invalidTypeFields.push('outcomePrices (array must contain only strings)');
		}
	}

	const requiredBooleanFields = ['active', 'closed'];
	for (const field of requiredBooleanFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isBoolean(data[field])) {
			invalidTypeFields.push(`${field} (expected boolean, got ${typeof data[field]})`);
		}
	}

	const requiredNumberFields = [
		'volumeNum',
		'liquidityNum',
		'volume24hr',
		'volume1wk',
		'volume1mo',
		'lastTradePrice',
		'bestBid',
		'bestAsk'
	];

	for (const field of requiredNumberFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isNumber(data[field])) {
			invalidTypeFields.push(`${field} (expected number, got ${typeof data[field]})`);
		}
	}

	if ('marketType' in data && data.marketType !== 'normal' && data.marketType !== 'scalar') {
		invalidTypeFields.push(`marketType (expected 'normal' or 'scalar', got '${data.marketType}')`);
	}

	if (missingFields.length > 0 || invalidTypeFields.length > 0) {
		const errorDetails: { missingFields?: string[]; invalidTypes?: string[] } = {};
		if (missingFields.length > 0) {
			errorDetails.missingFields = missingFields;
		}
		if (invalidTypeFields.length > 0) {
			errorDetails.invalidTypes = invalidTypeFields;
		}

		throw new ValidationError('Market validation failed', errorDetails);
	}

	return data as unknown as Market;
}

/**
 * Validates an array of markets
 */
export function validateMarkets(data: unknown): Market[] {
	if (!isArray(data)) {
		throw new ValidationError('Markets data must be an array', { data });
	}

	return data.map((item, index) => {
		try {
			return validateMarket(item);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(`Market at index ${index} is invalid: ${error.message}`, {
					index,
					originalError: error.details
				});
			}
			throw error;
		}
	});
}

/**
 * Validates a single event object
 */
export function validateEvent(data: unknown): Event {
	if (!isObject(data)) {
		throw new ValidationError('Event data must be an object', { data });
	}

	const requiredStringFields = [
		'id',
		'ticker',
		'slug',
		'title',
		'description',
		'startDate',
		'creationDate',
		'endDate',
		'category'
	];

	const optionalStringFields = ['subtitle', 'subcategory', 'resolutionSource', 'image', 'icon'];

	const missingFields: string[] = [];
	const invalidTypeFields: string[] = [];

	for (const field of requiredStringFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isString(data[field])) {
			invalidTypeFields.push(`${field} (expected string, got ${typeof data[field]})`);
		}
	}

	for (const field of optionalStringFields) {
		if (field in data && data[field] !== null && !isString(data[field])) {
			invalidTypeFields.push(`${field} (expected string or null, got ${typeof data[field]})`);
		}
	}

	const requiredBooleanFields = ['active', 'closed', 'archived', 'new', 'featured', 'restricted'];
	for (const field of requiredBooleanFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isBoolean(data[field])) {
			invalidTypeFields.push(`${field} (expected boolean, got ${typeof data[field]})`);
		}
	}

	const requiredNumberFields = [
		'liquidity',
		'volume',
		'openInterest',
		'volume24hr',
		'volume1wk',
		'volume1mo',
		'volume1yr',
		'commentCount'
	];

	for (const field of requiredNumberFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isNumber(data[field])) {
			invalidTypeFields.push(`${field} (expected number, got ${typeof data[field]})`);
		}
	}

	if (!('markets' in data)) {
		missingFields.push('markets');
	} else if (!isArray(data.markets)) {
		invalidTypeFields.push(`markets (expected array, got ${typeof data.markets})`);
	}

	if ('categories' in data && data.categories !== null && !isArray(data.categories)) {
		invalidTypeFields.push(`categories (expected array or null, got ${typeof data.categories})`);
	}

	if (!('tags' in data)) {
		missingFields.push('tags');
	} else if (!isArray(data.tags)) {
		invalidTypeFields.push(`tags (expected array, got ${typeof data.tags})`);
	}

	if (missingFields.length > 0 || invalidTypeFields.length > 0) {
		const errorDetails: { missingFields?: string[]; invalidTypes?: string[] } = {};
		if (missingFields.length > 0) {
			errorDetails.missingFields = missingFields;
		}
		if (invalidTypeFields.length > 0) {
			errorDetails.invalidTypes = invalidTypeFields;
		}

		throw new ValidationError('Event validation failed', errorDetails);
	}

	return data as unknown as Event;
}

/**
 * Validates an array of events
 */
export function validateEvents(data: unknown): Event[] {
	if (!isArray(data)) {
		throw new ValidationError('Events data must be an array', { data });
	}

	return data.map((item, index) => {
		try {
			return validateEvent(item);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(`Event at index ${index} is invalid: ${error.message}`, {
					index,
					originalError: error.details
				});
			}
			throw error;
		}
	});
}

/**
 * Validates a single tag object
 */
export function validateTag(data: unknown): Tag {
	if (!isObject(data)) {
		throw new ValidationError('Tag data must be an object', { data });
	}

	const requiredStringFields = ['id', 'label', 'slug'];

	const missingFields: string[] = [];
	const invalidTypeFields: string[] = [];

	for (const field of requiredStringFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isString(data[field])) {
			invalidTypeFields.push(`${field} (expected string, got ${typeof data[field]})`);
		}
	}

	if (missingFields.length > 0 || invalidTypeFields.length > 0) {
		const errorDetails: { missingFields?: string[]; invalidTypes?: string[] } = {};
		if (missingFields.length > 0) {
			errorDetails.missingFields = missingFields;
		}
		if (invalidTypeFields.length > 0) {
			errorDetails.invalidTypes = invalidTypeFields;
		}

		throw new ValidationError('Tag validation failed', errorDetails);
	}

	return data as unknown as Tag;
}

/**
 * Validates an array of tags
 */
export function validateTags(data: unknown): Tag[] {
	if (!isArray(data)) {
		throw new ValidationError('Tags data must be an array', { data });
	}

	return data.map((item, index) => {
		try {
			return validateTag(item);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(`Tag at index ${index} is invalid: ${error.message}`, {
					index,
					originalError: error.details
				});
			}
			throw error;
		}
	});
}

/**
 * Validates a single position object
 */
export function validatePosition(data: unknown): Position {
	if (!isObject(data)) {
		throw new ValidationError('Position data must be an object', { data });
	}

	const requiredStringFields = [
		'proxyWallet',
		'asset',
		'conditionId',
		'title',
		'slug',
		'icon',
		'eventSlug',
		'outcome',
		'oppositeOutcome',
		'oppositeAsset',
		'endDate'
	];

	const requiredNumberFields = [
		'size',
		'avgPrice',
		'initialValue',
		'currentValue',
		'cashPnl',
		'percentPnl',
		'totalBought',
		'realizedPnl',
		'percentRealizedPnl',
		'curPrice',
		'outcomeIndex'
	];

	const requiredBooleanFields = ['redeemable', 'mergeable', 'negativeRisk'];

	const missingFields: string[] = [];
	const invalidTypeFields: string[] = [];

	for (const field of requiredStringFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isString(data[field])) {
			invalidTypeFields.push(`${field} (expected string, got ${typeof data[field]})`);
		}
	}

	for (const field of requiredNumberFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isNumber(data[field])) {
			invalidTypeFields.push(`${field} (expected number, got ${typeof data[field]})`);
		}
	}

	for (const field of requiredBooleanFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isBoolean(data[field])) {
			invalidTypeFields.push(`${field} (expected boolean, got ${typeof data[field]})`);
		}
	}

	if (missingFields.length > 0 || invalidTypeFields.length > 0) {
		const errorDetails: { missingFields?: string[]; invalidTypes?: string[] } = {};
		if (missingFields.length > 0) {
			errorDetails.missingFields = missingFields;
		}
		if (invalidTypeFields.length > 0) {
			errorDetails.invalidTypes = invalidTypeFields;
		}

		throw new ValidationError('Position validation failed', errorDetails);
	}

	return data as unknown as Position;
}

/**
 * Validates an array of positions
 */
export function validatePositions(data: unknown): Position[] {
	if (!isArray(data)) {
		throw new ValidationError('Positions data must be an array', { data });
	}

	return data.map((item, index) => {
		try {
			return validatePosition(item);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(`Position at index ${index} is invalid: ${error.message}`, {
					index,
					originalError: error.details
				});
			}
			throw error;
		}
	});
}

/**
 * Validates a single trade object
 */
export function validateTrade(data: unknown): Trade {
	if (!isObject(data)) {
		throw new ValidationError('Trade data must be an object', { data });
	}

	const requiredStringFields = [
		'proxyWallet',
		'asset',
		'conditionId',
		'title',
		'slug',
		'icon',
		'eventSlug',
		'outcome',
		'name',
		'pseudonym',
		'bio',
		'profileImage',
		'profileImageOptimized',
		'transactionHash'
	];

	const requiredNumberFields = ['size', 'price', 'timestamp', 'outcomeIndex'];

	const missingFields: string[] = [];
	const invalidTypeFields: string[] = [];

	for (const field of requiredStringFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isString(data[field])) {
			invalidTypeFields.push(`${field} (expected string, got ${typeof data[field]})`);
		}
	}

	for (const field of requiredNumberFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isNumber(data[field])) {
			invalidTypeFields.push(`${field} (expected number, got ${typeof data[field]})`);
		}
	}

	// Validate side enum
	if (!('side' in data)) {
		missingFields.push('side');
	} else if (data.side !== 'BUY' && data.side !== 'SELL') {
		invalidTypeFields.push(`side (expected 'BUY' or 'SELL', got '${data.side}')`);
	}

	if (missingFields.length > 0 || invalidTypeFields.length > 0) {
		const errorDetails: { missingFields?: string[]; invalidTypes?: string[] } = {};
		if (missingFields.length > 0) {
			errorDetails.missingFields = missingFields;
		}
		if (invalidTypeFields.length > 0) {
			errorDetails.invalidTypes = invalidTypeFields;
		}

		throw new ValidationError('Trade validation failed', errorDetails);
	}

	return data as unknown as Trade;
}

/**
 * Validates an array of trades
 */
export function validateTrades(data: unknown): Trade[] {
	if (!isArray(data)) {
		throw new ValidationError('Trades data must be an array', { data });
	}

	return data.map((item, index) => {
		try {
			return validateTrade(item);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(`Trade at index ${index} is invalid: ${error.message}`, {
					index,
					originalError: error.details
				});
			}
			throw error;
		}
	});
}

/**
 * Validates a single activity object
 */
export function validateActivity(data: unknown): Activity {
	if (!isObject(data)) {
		throw new ValidationError('Activity data must be an object', { data });
	}

	const requiredStringFields = [
		'proxyWallet',
		'conditionId',
		'transactionHash',
		'title',
		'slug',
		'icon',
		'eventSlug',
		'outcome',
		'name',
		'pseudonym',
		'bio',
		'profileImage',
		'profileImageOptimized'
	];

	const requiredNumberFields = ['timestamp', 'size', 'usdcSize'];

	const missingFields: string[] = [];
	const invalidTypeFields: string[] = [];

	for (const field of requiredStringFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isString(data[field])) {
			invalidTypeFields.push(`${field} (expected string, got ${typeof data[field]})`);
		}
	}

	for (const field of requiredNumberFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isNumber(data[field])) {
			invalidTypeFields.push(`${field} (expected number, got ${typeof data[field]})`);
		}
	}

	// Validate type enum
	if (!('type' in data)) {
		missingFields.push('type');
	} else if (
		data.type !== 'TRADE' &&
		data.type !== 'SPLIT' &&
		data.type !== 'MERGE' &&
		data.type !== 'REDEEM' &&
		data.type !== 'REWARD' &&
		data.type !== 'CONVERSION'
	) {
		invalidTypeFields.push(
			`type (expected 'TRADE', 'SPLIT', 'MERGE', 'REDEEM', 'REWARD', or 'CONVERSION', got '${data.type}')`
		);
	}

	if (data.type === 'TRADE') {
		const tradeFields = ['price', 'asset', 'outcomeIndex'];
		for (const field of tradeFields) {
			if (!(field in data)) {
				missingFields.push(`${field} (required when type is TRADE)`);
			} else if (field === 'asset' && !isString(data[field])) {
				invalidTypeFields.push(`${field} (expected string, got ${typeof data[field]})`);
			} else if ((field === 'price' || field === 'outcomeIndex') && !isNumber(data[field])) {
				invalidTypeFields.push(`${field} (expected number, got ${typeof data[field]})`);
			}
		}

		if (!('side' in data)) {
			missingFields.push('side (required when type is TRADE)');
		} else if (data.side !== 'BUY' && data.side !== 'SELL') {
			invalidTypeFields.push(`side (expected 'BUY' or 'SELL', got '${data.side}')`);
		}
	}

	if (missingFields.length > 0 || invalidTypeFields.length > 0) {
		const errorDetails: { missingFields?: string[]; invalidTypes?: string[] } = {};
		if (missingFields.length > 0) {
			errorDetails.missingFields = missingFields;
		}
		if (invalidTypeFields.length > 0) {
			errorDetails.invalidTypes = invalidTypeFields;
		}

		throw new ValidationError('Activity validation failed', errorDetails);
	}

	return data as unknown as Activity;
}

/**
 * Validates an array of activities
 */
export function validateActivities(data: unknown): Activity[] {
	if (!isArray(data)) {
		throw new ValidationError('Activities data must be an array', { data });
	}

	return data.map((item, index) => {
		try {
			return validateActivity(item);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(`Activity at index ${index} is invalid: ${error.message}`, {
					index,
					originalError: error.details
				});
			}
			throw error;
		}
	});
}

/**
 * Validates a single holder info object
 */
export function validateHolderInfo(data: unknown): HolderInfo {
	if (!isObject(data)) {
		throw new ValidationError('HolderInfo data must be an object', { data });
	}

	const requiredStringFields = [
		'proxyWallet',
		'bio',
		'asset',
		'pseudonym',
		'name',
		'profileImage',
		'profileImageOptimized'
	];

	const requiredNumberFields = ['amount', 'outcomeIndex'];

	const requiredBooleanFields = ['displayUsernamePublic'];

	const missingFields: string[] = [];
	const invalidTypeFields: string[] = [];

	for (const field of requiredStringFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isString(data[field])) {
			invalidTypeFields.push(`${field} (expected string, got ${typeof data[field]})`);
		}
	}

	for (const field of requiredNumberFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isNumber(data[field])) {
			invalidTypeFields.push(`${field} (expected number, got ${typeof data[field]})`);
		}
	}

	for (const field of requiredBooleanFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isBoolean(data[field])) {
			invalidTypeFields.push(`${field} (expected boolean, got ${typeof data[field]})`);
		}
	}

	if (missingFields.length > 0 || invalidTypeFields.length > 0) {
		const errorDetails: { missingFields?: string[]; invalidTypes?: string[] } = {};
		if (missingFields.length > 0) {
			errorDetails.missingFields = missingFields;
		}
		if (invalidTypeFields.length > 0) {
			errorDetails.invalidTypes = invalidTypeFields;
		}

		throw new ValidationError('HolderInfo validation failed', errorDetails);
	}

	return data as unknown as HolderInfo;
}

/**
 * Validates a single market holders object
 */
export function validateMarketHolders(data: unknown): MarketHolders {
	if (!isObject(data)) {
		throw new ValidationError('MarketHolders data must be an object', { data });
	}

	const missingFields: string[] = [];
	const invalidTypeFields: string[] = [];

	if (!('token' in data)) {
		missingFields.push('token');
	} else if (!isString(data.token)) {
		invalidTypeFields.push(`token (expected string, got ${typeof data.token})`);
	}

	if (!('holders' in data)) {
		missingFields.push('holders');
	} else if (!isArray(data.holders)) {
		invalidTypeFields.push(`holders (expected array, got ${typeof data.holders})`);
	} else {
		try {
			data.holders.forEach((holder, index) => {
				try {
					validateHolderInfo(holder);
				} catch (error) {
					if (error instanceof ValidationError) {
						throw new ValidationError(`Holder at index ${index} is invalid: ${error.message}`, {
							index,
							originalError: error.details
						});
					}
					throw error;
				}
			});
		} catch (error) {
			if (error instanceof ValidationError) {
				invalidTypeFields.push(`holders: ${error.message}`);
			}
		}
	}

	if (missingFields.length > 0 || invalidTypeFields.length > 0) {
		const errorDetails: { missingFields?: string[]; invalidTypes?: string[] } = {};
		if (missingFields.length > 0) {
			errorDetails.missingFields = missingFields;
		}
		if (invalidTypeFields.length > 0) {
			errorDetails.invalidTypes = invalidTypeFields;
		}

		throw new ValidationError('MarketHolders validation failed', errorDetails);
	}

	return data as unknown as MarketHolders;
}

/**
 * Validates an array of market holders
 */
export function validateMarketHoldersList(data: unknown): MarketHolders[] {
	if (!isArray(data)) {
		throw new ValidationError('MarketHolders list data must be an array', { data });
	}

	return data.map((item, index) => {
		try {
			return validateMarketHolders(item);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(`MarketHolders at index ${index} is invalid: ${error.message}`, {
					index,
					originalError: error.details
				});
			}
			throw error;
		}
	});
}

/**
 * Validates a single portfolio value object
 */
export function validatePortfolioValue(data: unknown): PortfolioValue {
	if (!isObject(data)) {
		throw new ValidationError('PortfolioValue data must be an object', { data });
	}

	const missingFields: string[] = [];
	const invalidTypeFields: string[] = [];

	if (!('user' in data)) {
		missingFields.push('user');
	} else if (!isString(data.user)) {
		invalidTypeFields.push(`user (expected string, got ${typeof data.user})`);
	}

	if (!('value' in data)) {
		missingFields.push('value');
	} else if (!isNumber(data.value)) {
		invalidTypeFields.push(`value (expected number, got ${typeof data.value})`);
	}

	if (missingFields.length > 0 || invalidTypeFields.length > 0) {
		const errorDetails: { missingFields?: string[]; invalidTypes?: string[] } = {};
		if (missingFields.length > 0) {
			errorDetails.missingFields = missingFields;
		}
		if (invalidTypeFields.length > 0) {
			errorDetails.invalidTypes = invalidTypeFields;
		}

		throw new ValidationError('PortfolioValue validation failed', errorDetails);
	}

	return data as unknown as PortfolioValue;
}

/**
 * Validates an array of portfolio values
 */
export function validatePortfolioValues(data: unknown): PortfolioValue[] {
	if (!isArray(data)) {
		throw new ValidationError('PortfolioValues data must be an array', { data });
	}

	return data.map((item, index) => {
		try {
			return validatePortfolioValue(item);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(`PortfolioValue at index ${index} is invalid: ${error.message}`, {
					index,
					originalError: error.details
				});
			}
			throw error;
		}
	});
}

/**
 * Validates a single closed position object
 */
export function validateClosedPosition(data: unknown): ClosedPosition {
	if (!isObject(data)) {
		throw new ValidationError('ClosedPosition data must be an object', { data });
	}

	const requiredStringFields = [
		'proxyWallet',
		'asset',
		'conditionId',
		'title',
		'slug',
		'icon',
		'eventSlug',
		'outcome',
		'oppositeOutcome',
		'oppositeAsset',
		'endDate'
	];

	const requiredNumberFields = [
		'avgPrice',
		'totalBought',
		'realizedPnl',
		'curPrice',
		'timestamp',
		'outcomeIndex'
	];

	const missingFields: string[] = [];
	const invalidTypeFields: string[] = [];

	for (const field of requiredStringFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isString(data[field])) {
			invalidTypeFields.push(`${field} (expected string, got ${typeof data[field]})`);
		}
	}

	for (const field of requiredNumberFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isNumber(data[field])) {
			invalidTypeFields.push(`${field} (expected number, got ${typeof data[field]})`);
		}
	}

	if ('timestamp' in data && isNumber(data.timestamp)) {
		if (data.timestamp < 0 || !Number.isInteger(data.timestamp)) {
			invalidTypeFields.push('timestamp (expected positive integer Unix timestamp)');
		}
	}

	if (missingFields.length > 0 || invalidTypeFields.length > 0) {
		const errorDetails: { missingFields?: string[]; invalidTypes?: string[] } = {};
		if (missingFields.length > 0) {
			errorDetails.missingFields = missingFields;
		}
		if (invalidTypeFields.length > 0) {
			errorDetails.invalidTypes = invalidTypeFields;
		}

		throw new ValidationError('ClosedPosition validation failed', errorDetails);
	}

	return data as unknown as ClosedPosition;
}

/**
 * Validates an array of closed positions
 */
export function validateClosedPositions(data: unknown): ClosedPosition[] {
	if (!isArray(data)) {
		throw new ValidationError('ClosedPositions data must be an array', { data });
	}

	return data.map((item, index) => {
		try {
			return validateClosedPosition(item);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(`ClosedPosition at index ${index} is invalid: ${error.message}`, {
					index,
					originalError: error.details
				});
			}
			throw error;
		}
	});
}
