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
	ClosedPosition,
	Series,
	Collection,
	ImageOptimized,
	Chat,
	Comment,
	CommentProfile,
	Reaction,
	UserPosition,
	CommentImageOptimized,
	Category
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

/**
 * Validates a single ImageOptimized object
 */
function validateImageOptimized(data: unknown): ImageOptimized {
	if (!isObject(data)) {
		throw new ValidationError('ImageOptimized data must be an object', { data });
	}

	const requiredStringFields = [
		'id',
		'imageUrlSource',
		'imageUrlOptimized',
		'imageOptimizedLastUpdated',
		'field',
		'relname'
	];

	const requiredNumberFields = ['imageSizeKbSource', 'imageSizeKbOptimized', 'relID'];

	const requiredBooleanFields = ['imageOptimizedComplete'];

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

		throw new ValidationError('ImageOptimized validation failed', errorDetails);
	}

	return data as unknown as ImageOptimized;
}

/**
 * Validates a single Collection object
 */
export function validateCollection(data: unknown): Collection {
	if (!isObject(data)) {
		throw new ValidationError('Collection data must be an object', { data });
	}

	const requiredStringFields = [
		'id',
		'ticker',
		'slug',
		'title',
		'collectionType',
		'description',
		'tags',
		'layout',
		'templateVariables',
		'publishedAt',
		'createdBy',
		'updatedBy',
		'createdAt',
		'updatedAt'
	];

	const optionalStringFields = ['subtitle', 'image', 'icon', 'headerImage'];

	const requiredBooleanFields = [
		'active',
		'closed',
		'archived',
		'new',
		'featured',
		'restricted',
		'isTemplate',
		'commentsEnabled'
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

	for (const field of optionalStringFields) {
		if (field in data && data[field] !== null && !isString(data[field])) {
			invalidTypeFields.push(`${field} (expected string or null, got ${typeof data[field]})`);
		}
	}

	for (const field of requiredBooleanFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isBoolean(data[field])) {
			invalidTypeFields.push(`${field} (expected boolean, got ${typeof data[field]})`);
		}
	}

	// Validate optional ImageOptimized fields
	const imageOptimizedFields = ['imageOptimized', 'iconOptimized', 'headerImageOptimized'];
	for (const field of imageOptimizedFields) {
		if (field in data && data[field] !== null) {
			try {
				validateImageOptimized(data[field]);
			} catch (error) {
				if (error instanceof ValidationError) {
					invalidTypeFields.push(`${field}: ${error.message}`);
				}
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

		throw new ValidationError('Collection validation failed', errorDetails);
	}

	return data as unknown as Collection;
}

/**
 * Validates a single Chat object
 */
export function validateChat(data: unknown): Chat {
	if (!isObject(data)) {
		throw new ValidationError('Chat data must be an object', { data });
	}

	const requiredStringFields = ['id', 'channelId', 'channelName', 'startTime', 'endTime'];

	const optionalStringFields = ['channelImage'];

	const requiredBooleanFields = ['live'];

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

		throw new ValidationError('Chat validation failed', errorDetails);
	}

	return data as unknown as Chat;
}

/**
 * Validates a single Category object
 */
export function validateCategory(data: unknown): Category {
	if (!isObject(data)) {
		throw new ValidationError('Category data must be an object', { data });
	}

	const requiredStringFields = ['id', 'name'];

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

		throw new ValidationError('Category validation failed', errorDetails);
	}

	return data as unknown as Category;
}

/**
 * Validates a single series object
 */
export function validateSeries(data: unknown): Series {
	if (!isObject(data)) {
		throw new ValidationError('Series data must be an object', { data });
	}

	const requiredStringFields = ['id'];

	const optionalStringFields = [
		'ticker',
		'slug',
		'title',
		'subtitle',
		'seriesType',
		'recurrence',
		'description',
		'image',
		'icon',
		'layout',
		'publishedAt',
		'createdBy',
		'updatedBy',
		'createdAt',
		'updatedAt',
		'competitive',
		'startDate',
		'pythTokenID',
		'cgAssetName'
	];

	const optionalBooleanFields = [
		'active',
		'closed',
		'archived',
		'new',
		'featured',
		'restricted',
		'isTemplate',
		'templateVariables',
		'commentsEnabled'
	];

	const optionalNumberFields = ['volume24hr', 'volume', 'liquidity', 'score', 'commentCount'];

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

	for (const field of optionalBooleanFields) {
		if (field in data && data[field] !== null && !isBoolean(data[field])) {
			invalidTypeFields.push(`${field} (expected boolean or null, got ${typeof data[field]})`);
		}
	}

	for (const field of optionalNumberFields) {
		if (field in data && data[field] !== null && !isNumber(data[field])) {
			invalidTypeFields.push(`${field} (expected number or null, got ${typeof data[field]})`);
		}
	}

	if ('events' in data) {
		if (!isArray(data.events)) {
			invalidTypeFields.push(`events (expected array, got ${typeof data.events})`);
		}
	}

	if ('collections' in data) {
		if (!isArray(data.collections)) {
			invalidTypeFields.push(`collections (expected array, got ${typeof data.collections})`);
		}
	}

	if ('categories' in data) {
		if (!isArray(data.categories)) {
			invalidTypeFields.push(`categories (expected array, got ${typeof data.categories})`);
		}
	}

	if ('tags' in data) {
		if (!isArray(data.tags)) {
			invalidTypeFields.push(`tags (expected array, got ${typeof data.tags})`);
		}
	}

	if ('chats' in data) {
		if (!isArray(data.chats)) {
			invalidTypeFields.push(`chats (expected array, got ${typeof data.chats})`);
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

		throw new ValidationError('Series validation failed', errorDetails);
	}

	return data as unknown as Series;
}

/**
 * Validates an array of series
 */
export function validateSeriesList(data: unknown): Series[] {
	if (!isArray(data)) {
		throw new ValidationError('Series data must be an array', { data });
	}

	return data.map((item, index) => {
		try {
			return validateSeries(item);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(`Series at index ${index} is invalid: ${error.message}`, {
					index,
					originalError: error.details
				});
			}
			throw error;
		}
	});
}

/**
 * Validates a CommentImageOptimized object
 */
export function validateCommentImageOptimized(data: unknown): CommentImageOptimized {
	if (!isObject(data)) {
		throw new ValidationError('CommentImageOptimized data must be an object', { data });
	}

	const imageOpt = data as Record<string, unknown>;

	// All fields are nullable strings
	const fields = ['original', 'small', 'medium', 'large'];
	for (const field of fields) {
		if (imageOpt[field] !== null && typeof imageOpt[field] !== 'string') {
			throw new ValidationError(`CommentImageOptimized ${field} must be a string or null`, {
				imageOpt,
				field
			});
		}
	}

	return imageOpt as unknown as CommentImageOptimized;
}

/**
 * Validates a UserPosition object
 */
export function validateUserPosition(data: unknown, index?: number): UserPosition {
	if (!isObject(data)) {
		const message =
			index !== undefined
				? `UserPosition at index ${index} must be an object`
				: 'UserPosition must be an object';
		throw new ValidationError(message, { data, index });
	}

	const position = data as Record<string, unknown>;

	if (typeof position.tokenId !== 'string') {
		throw new ValidationError('UserPosition tokenId must be a string', { position, index });
	}

	if (typeof position.positionSize !== 'number') {
		throw new ValidationError('UserPosition positionSize must be a number', { position, index });
	}

	return position as unknown as UserPosition;
}

/**
 * Validates a CommentProfile object
 */
export function validateCommentProfile(data: unknown): CommentProfile {
	if (!isObject(data)) {
		throw new ValidationError('CommentProfile data must be an object', { data });
	}

	const profile = data as Record<string, unknown>;

	// Validate nullable string fields
	const nullableStringFields = ['name', 'pseudonym', 'bio', 'profileImage'];
	for (const field of nullableStringFields) {
		if (
			profile[field] !== null &&
			profile[field] !== undefined &&
			typeof profile[field] !== 'string'
		) {
			throw new ValidationError(`CommentProfile ${field} must be a string or null`, {
				profile,
				field
			});
		}
	}

	// Validate proxyWallet (maps to proxyWalletAddress)
	const proxyWallet = profile.proxyWallet ?? profile.proxyWalletAddress;
	if (proxyWallet !== null && proxyWallet !== undefined && typeof proxyWallet !== 'string') {
		throw new ValidationError('CommentProfile proxyWallet must be a string or null', {
			profile
		});
	}

	// Validate baseAddress (maps to walletAddress) - may be missing in some cases (e.g., reaction profiles)
	const baseAddress = profile.baseAddress ?? profile.walletAddress ?? '';
	if (baseAddress && typeof baseAddress !== 'string') {
		throw new ValidationError('CommentProfile baseAddress must be a string', { profile });
	}

	// Validate nullable boolean fields
	if (
		profile.isMod !== null &&
		profile.isMod !== undefined &&
		typeof profile.isMod !== 'boolean'
	) {
		throw new ValidationError('CommentProfile isMod must be a boolean or null', {
			profile,
			field: 'isMod'
		});
	}
	if (
		profile.isCreator !== null &&
		profile.isCreator !== undefined &&
		typeof profile.isCreator !== 'boolean'
	) {
		throw new ValidationError('CommentProfile isCreator must be a boolean or null', {
			profile,
			field: 'isCreator'
		});
	}

	const isMod = profile.isMod ?? null;
	const isCreator = profile.isCreator ?? null;

	// Validate nullable profileImageOptimized (optional)
	if (
		profile.profileImageOptimized !== null &&
		profile.profileImageOptimized !== undefined
	) {
		validateCommentImageOptimized(profile.profileImageOptimized);
	}

	// Validate positions array (optional, may not be present)
	const positions: UserPosition[] = [];
	if (profile.positions !== null && profile.positions !== undefined) {
		if (!isArray(profile.positions)) {
			throw new ValidationError('CommentProfile positions must be an array', { profile });
		}
		(profile.positions as unknown[]).forEach((position, index) => {
			positions.push(validateUserPosition(position, index));
		});
	}

	return {
		name: profile.name ?? null,
		pseudonym: profile.pseudonym ?? null,
		bio: profile.bio ?? null,
		isMod,
		isCreator,
		walletAddress: baseAddress as string,
		proxyWalletAddress: (proxyWallet as string) ?? null,
		profileImage: profile.profileImage ?? null,
		profileImageOptimized: profile.profileImageOptimized
			? (profile.profileImageOptimized as CommentImageOptimized)
			: null,
		positions
	} as unknown as CommentProfile;
}

/**
 * Validates a Reaction object
 */
export function validateReaction(data: unknown, index?: number): Reaction {
	if (!isObject(data)) {
		const message =
			index !== undefined
				? `Reaction at index ${index} must be an object`
				: 'Reaction must be an object';
		throw new ValidationError(message, { data, index });
	}

	const reaction = data as Record<string, unknown>;

	// Convert string ID to number if needed
	let id: number;
	if (typeof reaction.id === 'string') {
		id = parseInt(reaction.id, 10);
		if (isNaN(id)) {
			throw new ValidationError('Reaction id must be a valid number', { reaction, index });
		}
	} else if (typeof reaction.id === 'number') {
		id = reaction.id;
	} else {
		throw new ValidationError('Reaction id must be a number or numeric string', { reaction, index });
	}

	// Convert string commentID to number if needed
	let commentID: number;
	if (typeof reaction.commentID === 'string') {
		commentID = parseInt(reaction.commentID, 10);
		if (isNaN(commentID)) {
			throw new ValidationError('Reaction commentID must be a valid number', { reaction, index });
		}
	} else if (typeof reaction.commentID === 'number') {
		commentID = reaction.commentID;
	} else {
		throw new ValidationError('Reaction commentID must be a number or numeric string', {
			reaction,
			index
		});
	}

	if (typeof reaction.reactionType !== 'string') {
		throw new ValidationError('Reaction reactionType must be a string', { reaction, index });
	}

	// icon is optional
	if (reaction.icon !== null && reaction.icon !== undefined && typeof reaction.icon !== 'string') {
		throw new ValidationError('Reaction icon must be a string or null', { reaction, index });
	}

	if (typeof reaction.userAddress !== 'string') {
		throw new ValidationError('Reaction userAddress must be a string', { reaction, index });
	}

	// createdAt is optional
	if (
		reaction.createdAt !== null &&
		reaction.createdAt !== undefined &&
		typeof reaction.createdAt !== 'string'
	) {
		throw new ValidationError('Reaction createdAt must be a string or null', { reaction, index });
	}

	// Validate nested profile
	validateCommentProfile(reaction.profile);

	return {
		...reaction,
		id,
		commentID,
		icon: reaction.icon ?? null,
		createdAt: reaction.createdAt ?? null
	} as unknown as Reaction;
}

/**
 * Validates a Comment object
 */
export function validateComment(data: unknown): Comment {
	if (!isObject(data)) {
		throw new ValidationError('Comment data must be an object', { data });
	}

	const comment = data as Record<string, unknown>;

	// Validate required fields
	// Convert string ID to number if needed
	let id: number;
	if (typeof comment.id === 'string') {
		id = parseInt(comment.id, 10);
		if (isNaN(id)) {
			throw new ValidationError('Comment id must be a valid number', { comment });
		}
	} else if (typeof comment.id === 'number') {
		id = comment.id;
	} else {
		throw new ValidationError('Comment id must be a number or numeric string', { comment });
	}

	if (typeof comment.body !== 'string') {
		throw new ValidationError('Comment body must be a string', { comment });
	}

	if (!['Event', 'Series', 'market'].includes(comment.parentEntityType as string)) {
		throw new ValidationError('Comment parentEntityType must be Event, Series, or market', {
			comment
		});
	}

	if (typeof comment.parentEntityID !== 'number') {
		throw new ValidationError('Comment parentEntityID must be a number', { comment });
	}

	// parentCommentID is optional and may not be present in the response, or may be a string
	let parentCommentID: number | null = null;
	if (comment.parentCommentID !== undefined && comment.parentCommentID !== null) {
		if (typeof comment.parentCommentID === 'string') {
			const parsed = parseInt(comment.parentCommentID, 10);
			if (isNaN(parsed)) {
				throw new ValidationError('Comment parentCommentID must be a valid number', { comment });
			}
			parentCommentID = parsed;
		} else if (typeof comment.parentCommentID === 'number') {
			parentCommentID = comment.parentCommentID;
		} else {
			throw new ValidationError('Comment parentCommentID must be a number or null', { comment });
		}
	}

	if (typeof comment.userAddress !== 'string') {
		throw new ValidationError('Comment userAddress must be a string', { comment });
	}

	// replyAddress is optional and may not be present in the response
	if (
		comment.replyAddress !== undefined &&
		comment.replyAddress !== null &&
		typeof comment.replyAddress !== 'string'
	) {
		throw new ValidationError('Comment replyAddress must be a string or null', { comment });
	}

	if (typeof comment.createdAt !== 'string') {
		throw new ValidationError('Comment createdAt must be a string', { comment });
	}

	// updatedAt is optional and may be null
	if (
		comment.updatedAt !== null &&
		comment.updatedAt !== undefined &&
		typeof comment.updatedAt !== 'string'
	) {
		throw new ValidationError('Comment updatedAt must be a string or null', { comment });
	}

	if (typeof comment.reportCount !== 'number') {
		throw new ValidationError('Comment reportCount must be a number', { comment });
	}

	if (typeof comment.reactionCount !== 'number') {
		throw new ValidationError('Comment reactionCount must be a number', { comment });
	}

	// Validate nested profile - may be null in user comments endpoint
	if (comment.profile !== null && comment.profile !== undefined) {
		validateCommentProfile(comment.profile);
	}

	// Validate reactions array - can be null or an array
	const reactions: unknown[] = [];
	if (comment.reactions !== null && comment.reactions !== undefined) {
		if (!isArray(comment.reactions)) {
			throw new ValidationError('Comment reactions must be an array or null', { comment });
		}
		(comment.reactions as unknown[]).forEach((reaction, index) => {
			validateReaction(reaction, index);
		});
		reactions.push(...(comment.reactions as unknown[]));
	}

	return {
		...comment,
		id,
		parentCommentID,
		replyAddress: comment.replyAddress ?? null,
		updatedAt: comment.updatedAt ?? null,
		reactions
	} as unknown as Comment;
}

/**
 * Validates an array of Comment objects
 */
export function validateComments(data: unknown): Comment[] {
	if (!isArray(data)) {
		throw new ValidationError('Comments data must be an array', { data });
	}

	return data.map((comment, index) => {
		try {
			return validateComment(comment);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(`Comment at index ${index} is invalid: ${error.message}`, {
					index,
					originalError: error.details
				});
			}
			throw error;
		}
	});
}
