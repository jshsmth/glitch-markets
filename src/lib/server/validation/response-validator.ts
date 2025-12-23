/**
 * Response validation utilities for API responses
 */

import { ValidationError } from '../errors/api-errors.js';
import type {
	Market,
	Event,
	Tag,
	TagRelationship,
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
	Category,
	SearchTag,
	Profile,
	SearchPagination,
	SearchResults,
	BridgeToken,
	SupportedAsset,
	SupportedAssets,
	DepositAddresses,
	DepositAddressMap,
	Team,
	SportsMetadata,
	TraderLeaderboardEntry,
	BuilderLeaderboardEntry,
	BuilderVolumeEntry,
	PricePoint,
	PriceHistory
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
		} else if (outcomes !== undefined && isArray(outcomes) && !outcomes.every(isString)) {
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
		} else if (
			outcomePrices !== undefined &&
			isArray(outcomePrices) &&
			!outcomePrices.every(isString)
		) {
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
		'creationDate'
	];

	const optionalStringFields = [
		'endDate',
		'subtitle',
		'category',
		'subcategory',
		'resolutionSource',
		'image',
		'icon'
	];

	const missingFields: string[] = [];
	const invalidTypeFields: string[] = [];

	for (const field of requiredStringFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (data[field] !== null && !isString(data[field])) {
			invalidTypeFields.push(`${field} (expected string or null, got ${typeof data[field]})`);
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
		} else if (data[field] !== null && !isBoolean(data[field])) {
			invalidTypeFields.push(`${field} (expected boolean or null, got ${typeof data[field]})`);
		}
	}

	const requiredNumberFields = ['openInterest'];

	const optionalNumberFields = [
		'liquidity',
		'volume',
		'volume24hr',
		'volume1wk',
		'volume1mo',
		'volume1yr',
		'commentCount'
	];

	for (const field of requiredNumberFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (data[field] !== null && !isNumber(data[field])) {
			invalidTypeFields.push(`${field} (expected number or null, got ${typeof data[field]})`);
		}
	}

	for (const field of optionalNumberFields) {
		if (field in data && data[field] !== null && !isNumber(data[field])) {
			invalidTypeFields.push(`${field} (expected number or null, got ${typeof data[field]})`);
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
 * Validates a single tag relationship object
 */
export function validateTagRelationship(data: unknown): TagRelationship {
	if (!isObject(data)) {
		throw new ValidationError('TagRelationship data must be an object', { data });
	}

	// Required string field
	if (!('id' in data)) {
		throw new ValidationError('TagRelationship validation failed', {
			missingFields: ['id']
		});
	}

	if (!isString(data.id)) {
		throw new ValidationError('TagRelationship validation failed', {
			invalidTypes: ['id (expected string, got ' + typeof data.id + ')']
		});
	}

	// Optional nullable number fields - no validation needed if absent
	// TypeScript types allow null, so we only check if present and not null
	const optionalNumberFields = ['tagID', 'relatedTagID', 'rank'];
	const invalidTypeFields: string[] = [];

	for (const field of optionalNumberFields) {
		if (field in data && data[field] !== null && !isNumber(data[field])) {
			invalidTypeFields.push(`${field} (expected number or null, got ${typeof data[field]})`);
		}
	}

	if (invalidTypeFields.length > 0) {
		throw new ValidationError('TagRelationship validation failed', {
			invalidTypes: invalidTypeFields
		});
	}

	return data as unknown as TagRelationship;
}

/**
 * Validates an array of tag relationships
 */
export function validateTagRelationships(data: unknown): TagRelationship[] {
	if (!isArray(data)) {
		throw new ValidationError('TagRelationships data must be an array', { data });
	}

	return data.map((item, index) => {
		try {
			return validateTagRelationship(item);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(
					`TagRelationship at index ${index} is invalid: ${error.message}`,
					{
						index,
						originalError: error.details
					}
				);
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

	const proxyWallet = profile.proxyWallet ?? profile.proxyWalletAddress;
	if (proxyWallet !== null && proxyWallet !== undefined && typeof proxyWallet !== 'string') {
		throw new ValidationError('CommentProfile proxyWallet must be a string or null', {
			profile
		});
	}

	const baseAddress = profile.baseAddress ?? profile.walletAddress ?? '';
	if (baseAddress && typeof baseAddress !== 'string') {
		throw new ValidationError('CommentProfile baseAddress must be a string', { profile });
	}

	if (profile.isMod !== null && profile.isMod !== undefined && typeof profile.isMod !== 'boolean') {
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

	if (profile.profileImageOptimized !== null && profile.profileImageOptimized !== undefined) {
		validateCommentImageOptimized(profile.profileImageOptimized);
	}

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
		throw new ValidationError('Reaction id must be a number or numeric string', {
			reaction,
			index
		});
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

/**
 * Validates a SearchTag object
 */
export function validateSearchTag(data: unknown): SearchTag {
	if (!isObject(data)) {
		throw new ValidationError('SearchTag data must be an object', { data });
	}

	const tag = data as Record<string, unknown>;

	// id is required
	if (typeof tag.id !== 'string') {
		throw new ValidationError('SearchTag id must be a string', { tag });
	}

	// label is nullable
	if (tag.label !== null && tag.label !== undefined && typeof tag.label !== 'string') {
		throw new ValidationError('SearchTag label must be a string or null', { tag });
	}

	// slug is nullable
	if (tag.slug !== null && tag.slug !== undefined && typeof tag.slug !== 'string') {
		throw new ValidationError('SearchTag slug must be a string or null', { tag });
	}

	// eventCount is optional and nullable
	if (
		tag.eventCount !== null &&
		tag.eventCount !== undefined &&
		typeof tag.eventCount !== 'number'
	) {
		throw new ValidationError('SearchTag eventCount must be a number or null', { tag });
	}

	return {
		id: tag.id,
		label: tag.label ?? null,
		slug: tag.slug ?? null,
		eventCount: tag.eventCount ?? null
	} as unknown as SearchTag;
}

/**
 * Validates a Profile object
 */
export function validateProfile(data: unknown): Profile {
	if (!isObject(data)) {
		throw new ValidationError('Profile data must be an object', { data });
	}

	const profile = data as Record<string, unknown>;

	// id is optional
	if (profile.id !== undefined && profile.id !== null && typeof profile.id !== 'string') {
		throw new ValidationError('Profile id must be a string or null', { profile });
	}

	// All other fields are nullable
	const nullableStringFields = [
		'name',
		'pseudonym',
		'bio',
		'profileImage',
		'profileImageOptimized'
	];

	for (const field of nullableStringFields) {
		if (
			profile[field] !== null &&
			profile[field] !== undefined &&
			typeof profile[field] !== 'string'
		) {
			throw new ValidationError(`Profile ${field} must be a string or null`, { profile, field });
		}
	}

	// displayUsernamePublic is nullable boolean
	if (
		profile.displayUsernamePublic !== null &&
		profile.displayUsernamePublic !== undefined &&
		typeof profile.displayUsernamePublic !== 'boolean'
	) {
		throw new ValidationError('Profile displayUsernamePublic must be a boolean or null', {
			profile
		});
	}

	return {
		id: profile.id,
		name: profile.name ?? null,
		pseudonym: profile.pseudonym ?? null,
		bio: profile.bio ?? null,
		profileImage: profile.profileImage ?? null,
		profileImageOptimized: profile.profileImageOptimized ?? null,
		displayUsernamePublic: profile.displayUsernamePublic ?? null
	} as unknown as Profile;
}

/**
 * Validates SearchPagination object
 */
export function validateSearchPagination(data: unknown): SearchPagination {
	if (!isObject(data)) {
		throw new ValidationError('SearchPagination data must be an object', { data });
	}

	const pagination = data as Record<string, unknown>;

	// hasMore is required and must be boolean
	if (typeof pagination.hasMore !== 'boolean') {
		throw new ValidationError('SearchPagination hasMore must be a boolean', { pagination });
	}

	// totalResults is required and must be number
	if (typeof pagination.totalResults !== 'number') {
		throw new ValidationError('SearchPagination totalResults must be a number', { pagination });
	}

	return {
		hasMore: pagination.hasMore,
		totalResults: pagination.totalResults
	} as unknown as SearchPagination;
}

/**
 * Validates SearchResults object containing events, tags, profiles, and pagination
 */
export function validateSearchResults(data: unknown): SearchResults {
	if (!isObject(data)) {
		throw new ValidationError('SearchResults data must be an object', { data });
	}

	const results = data as Record<string, unknown>;

	if (!isArray(results.events)) {
		throw new ValidationError('SearchResults events must be an array', { results });
	}
	const events = validateEvents(results.events);

	// Validate tags array (can be missing, null, or array)
	let tags: SearchTag[] = [];
	if (results.tags === undefined || results.tags === null) {
		tags = [];
	} else if (!isArray(results.tags)) {
		throw new ValidationError('SearchResults tags must be an array or null', { results });
	} else {
		tags = results.tags.map((tag, index) => {
			try {
				return validateSearchTag(tag);
			} catch (error) {
				if (error instanceof ValidationError) {
					throw new ValidationError(`SearchTag at index ${index} is invalid: ${error.message}`, {
						index,
						originalError: error.details
					});
				}
				throw error;
			}
		});
	}

	// Validate profiles array (can be missing, null, or array)
	let profiles: Profile[] = [];
	if (results.profiles === undefined || results.profiles === null) {
		profiles = [];
	} else if (!isArray(results.profiles)) {
		throw new ValidationError('SearchResults profiles must be an array or null', { results });
	} else {
		profiles = results.profiles.map((profile, index) => {
			try {
				return validateProfile(profile);
			} catch (error) {
				if (error instanceof ValidationError) {
					throw new ValidationError(`Profile at index ${index} is invalid: ${error.message}`, {
						index,
						originalError: error.details
					});
				}
				throw error;
			}
		});
	}

	if (!isObject(results.pagination)) {
		throw new ValidationError('SearchResults pagination must be an object', { results });
	}
	const pagination = validateSearchPagination(results.pagination);

	return {
		events,
		tags,
		profiles,
		pagination
	} as unknown as SearchResults;
}

/**
 * Validates a BridgeToken object from the Bridge API
 */
function validateBridgeToken(token: unknown): BridgeToken {
	if (!isObject(token)) {
		throw new ValidationError('BridgeToken must be an object', { token });
	}

	if (!isString(token.name)) {
		throw new ValidationError('BridgeToken.name must be a string', { token });
	}

	if (!isString(token.symbol)) {
		throw new ValidationError('BridgeToken.symbol must be a string', { token });
	}

	if (!isString(token.address)) {
		throw new ValidationError('BridgeToken.address must be a string', { token });
	}

	if (!isNumber(token.decimals)) {
		throw new ValidationError('BridgeToken.decimals must be a number', { token });
	}

	return token as unknown as BridgeToken;
}

/**
 * Validates a SupportedAsset object from the Bridge API
 */
function validateSupportedAsset(asset: unknown): SupportedAsset {
	if (!isObject(asset)) {
		throw new ValidationError('SupportedAsset must be an object', { asset });
	}

	if (!isString(asset.chainId)) {
		throw new ValidationError('SupportedAsset.chainId must be a string', { asset });
	}

	if (!isString(asset.chainName)) {
		throw new ValidationError('SupportedAsset.chainName must be a string', { asset });
	}

	if (!isObject(asset.token)) {
		throw new ValidationError('SupportedAsset.token must be an object', { asset });
	}

	if (!isNumber(asset.minCheckoutUsd)) {
		throw new ValidationError('SupportedAsset.minCheckoutUsd must be a number', { asset });
	}

	const token = validateBridgeToken(asset.token);

	return {
		chainId: asset.chainId,
		chainName: asset.chainName,
		token,
		minCheckoutUsd: asset.minCheckoutUsd
	} as SupportedAsset;
}

/**
 * Validates the response from GET /supported-assets endpoint
 *
 * @param data - The response data to validate
 * @returns Validated SupportedAssets object
 * @throws {ValidationError} When the response structure is invalid
 *
 * @example
 * ```typescript
 * const data = await fetch('/supported-assets').then(r => r.json());
 * const validated = validateSupportedAssets(data);
 * ```
 */
export function validateSupportedAssets(data: unknown): SupportedAssets {
	if (!isObject(data)) {
		throw new ValidationError('SupportedAssets response must be an object', { data });
	}

	if (!Array.isArray(data.supportedAssets)) {
		throw new ValidationError('SupportedAssets.supportedAssets must be an array', { data });
	}

	const supportedAssets = data.supportedAssets.map((asset, index) => {
		try {
			return validateSupportedAsset(asset);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(`SupportedAsset at index ${index} is invalid: ${error.message}`, {
					index,
					originalError: error.details
				});
			}
			throw error;
		}
	});

	return { supportedAssets } as SupportedAssets;
}

/**
 * Validates a DepositAddressMap object from the Bridge API
 * The actual API returns addresses grouped by chain type (evm, svm, btc)
 */
function validateDepositAddressMap(addressMap: unknown): DepositAddressMap {
	if (!isObject(addressMap)) {
		throw new ValidationError('DepositAddressMap must be an object', { addressMap });
	}

	// At least one address type should be present
	const hasEvm = 'evm' in addressMap;
	const hasSvm = 'svm' in addressMap;
	const hasBtc = 'btc' in addressMap;

	if (!hasEvm && !hasSvm && !hasBtc) {
		throw new ValidationError(
			'DepositAddressMap must contain at least one address (evm, svm, or btc)',
			{ addressMap }
		);
	}

	if (hasEvm && !isString(addressMap.evm)) {
		throw new ValidationError('DepositAddressMap.evm must be a string', { addressMap });
	}

	if (hasSvm && !isString(addressMap.svm)) {
		throw new ValidationError('DepositAddressMap.svm must be a string', { addressMap });
	}

	if (hasBtc && !isString(addressMap.btc)) {
		throw new ValidationError('DepositAddressMap.btc must be a string', { addressMap });
	}

	return addressMap as unknown as DepositAddressMap;
}

/**
 * Validates the response from POST /deposit endpoint
 * Note: Actual API format differs from documentation
 *
 * @param data - The response data to validate
 * @returns Validated DepositAddresses object
 * @throws {ValidationError} When the response structure is invalid
 *
 * @example
 * ```typescript
 * const data = await fetch('/deposit', { method: 'POST', body: ... }).then(r => r.json());
 * const validated = validateDepositAddresses(data);
 * // Result: { address: { evm: "0x...", svm: "...", btc: "bc1..." }, note: "..." }
 * ```
 */
export function validateDepositAddresses(data: unknown): DepositAddresses {
	if (!isObject(data)) {
		throw new ValidationError('DepositAddresses response must be an object', { data });
	}

	if (!isObject(data.address)) {
		throw new ValidationError('DepositAddresses.address must be an object', { data });
	}

	const address = validateDepositAddressMap(data.address);

	// Note field is optional
	if ('note' in data && data.note !== undefined && !isString(data.note)) {
		throw new ValidationError('DepositAddresses.note must be a string if present', { data });
	}

	return {
		address,
		note: data.note as string | undefined
	} as DepositAddresses;
}

/**
 * Validates a single team object
 *
 * @param data - Raw API response data
 * @returns Validated Team object
 * @throws {ValidationError} When validation fails
 *
 * @example
 * ```typescript
 * const team = validateTeam(apiResponse);
 * // Result: { id: 123, name: "Lakers", league: "NBA", ... }
 * ```
 */
export function validateTeam(data: unknown): Team {
	if (!isObject(data)) {
		throw new ValidationError('Team data must be an object', { data });
	}

	// id is the only required field
	if (!('id' in data) || !isNumber(data.id)) {
		throw new ValidationError('Team.id must be a number', { data });
	}

	// All other fields are nullable strings
	const nullableStringFields = [
		'name',
		'league',
		'record',
		'logo',
		'abbreviation',
		'alias',
		'createdAt',
		'updatedAt'
	];

	for (const field of nullableStringFields) {
		if (
			field in data &&
			data[field] !== null &&
			data[field] !== undefined &&
			!isString(data[field])
		) {
			throw new ValidationError(`Team.${field} must be a string or null`, { data, field });
		}
	}

	return {
		id: data.id,
		name: (data.name as string) ?? null,
		league: (data.league as string) ?? null,
		record: (data.record as string) ?? null,
		logo: (data.logo as string) ?? null,
		abbreviation: (data.abbreviation as string) ?? null,
		alias: (data.alias as string) ?? null,
		createdAt: (data.createdAt as string) ?? null,
		updatedAt: (data.updatedAt as string) ?? null
	};
}

/**
 * Validates an array of teams
 *
 * @param data - Raw API response data
 * @returns Validated array of Team objects
 * @throws {ValidationError} When validation fails
 *
 * @example
 * ```typescript
 * const teams = validateTeams(apiResponse);
 * // Result: [{ id: 123, name: "Lakers", ... }, ...]
 * ```
 */
export function validateTeams(data: unknown): Team[] {
	if (!isArray(data)) {
		throw new ValidationError('Teams response must be an array', { data });
	}

	return data.map((item, index) => {
		try {
			return validateTeam(item);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(`Invalid team at index ${index}`, {
					index,
					originalError: error.message
				});
			}
			throw error;
		}
	});
}

/**
 * Validates a single sports metadata object
 *
 * @param data - Raw API response data
 * @returns Validated SportsMetadata object
 * @throws {ValidationError} When validation fails
 *
 * @example
 * ```typescript
 * const metadata = validateSportsMetadata(apiResponse);
 * // Result: { sport: "NFL", image: "...", resolution: "...", ... }
 * ```
 */
export function validateSportsMetadata(data: unknown): SportsMetadata {
	if (!isObject(data)) {
		throw new ValidationError('SportsMetadata data must be an object', { data });
	}

	// All fields are required strings
	const requiredFields = ['sport', 'image', 'resolution', 'ordering', 'tags', 'series'];

	for (const field of requiredFields) {
		if (!(field in data) || !isString(data[field])) {
			throw new ValidationError(`SportsMetadata.${field} must be a string`, { data, field });
		}
	}

	return {
		sport: data.sport as string,
		image: data.image as string,
		resolution: data.resolution as string,
		ordering: data.ordering as string,
		tags: data.tags as string,
		series: data.series as string
	};
}

/**
 * Validates an array of sports metadata objects
 *
 * @param data - Raw API response data
 * @returns Validated array of SportsMetadata objects
 * @throws {ValidationError} When validation fails
 *
 * @example
 * ```typescript
 * const metadata = validateSportsMetadataList(apiResponse);
 * // Result: [{ sport: "NFL", ... }, { sport: "NBA", ... }, ...]
 * ```
 */
export function validateSportsMetadataList(data: unknown): SportsMetadata[] {
	if (!isArray(data)) {
		throw new ValidationError('SportsMetadata response must be an array', { data });
	}

	return data.map((item, index) => {
		try {
			return validateSportsMetadata(item);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(`Invalid sports metadata at index ${index}`, {
					index,
					originalError: error.message
				});
			}
			throw error;
		}
	});
}

/**
 * Validates a single trader leaderboard entry
 * @param data - Raw data from API
 * @returns Validated TraderLeaderboardEntry
 * @throws {ValidationError} If validation fails
 */
export function validateTraderLeaderboardEntry(data: unknown): TraderLeaderboardEntry {
	if (!isObject(data)) {
		throw new ValidationError('TraderLeaderboardEntry must be an object', { data });
	}

	const entry = data as Record<string, unknown>;

	if (!isString(entry.rank)) {
		throw new ValidationError('rank must be a string', { rank: entry.rank });
	}

	if (!isString(entry.proxyWallet)) {
		throw new ValidationError('proxyWallet must be a string', { proxyWallet: entry.proxyWallet });
	}

	if (!isString(entry.userName)) {
		throw new ValidationError('userName must be a string', { userName: entry.userName });
	}

	if (!isString(entry.xUsername)) {
		throw new ValidationError('xUsername must be a string', { xUsername: entry.xUsername });
	}

	if (!isString(entry.profileImage)) {
		throw new ValidationError('profileImage must be a string', {
			profileImage: entry.profileImage
		});
	}

	if (!isBoolean(entry.verifiedBadge)) {
		throw new ValidationError('verifiedBadge must be a boolean', {
			verifiedBadge: entry.verifiedBadge
		});
	}

	if (!isNumber(entry.vol)) {
		throw new ValidationError('vol must be a number', { vol: entry.vol });
	}

	if (!isNumber(entry.pnl)) {
		throw new ValidationError('pnl must be a number', { pnl: entry.pnl });
	}

	return {
		rank: entry.rank,
		proxyWallet: entry.proxyWallet,
		userName: entry.userName,
		xUsername: entry.xUsername,
		verifiedBadge: entry.verifiedBadge,
		vol: entry.vol,
		pnl: entry.pnl,
		profileImage: entry.profileImage
	};
}

/**
 * Validates trader leaderboard response array
 * @param data - Raw data from API
 * @returns Validated array of TraderLeaderboardEntry
 * @throws {ValidationError} If validation fails
 */
export function validateTraderLeaderboard(data: unknown): TraderLeaderboardEntry[] {
	if (!isArray(data)) {
		throw new ValidationError('TraderLeaderboard response must be an array', { data });
	}

	return data.map((item, index) => {
		try {
			return validateTraderLeaderboardEntry(item);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(`Invalid trader leaderboard entry at index ${index}`, {
					index,
					originalError: error.message
				});
			}
			throw error;
		}
	});
}

/**
 * Validates a single builder leaderboard entry
 * @param data - Raw data from API
 * @returns Validated BuilderLeaderboardEntry
 * @throws {ValidationError} If validation fails
 */
export function validateBuilderLeaderboardEntry(data: unknown): BuilderLeaderboardEntry {
	if (!isObject(data)) {
		throw new ValidationError('BuilderLeaderboardEntry must be an object', { data });
	}

	const entry = data as Record<string, unknown>;

	if (!isString(entry.rank)) {
		throw new ValidationError('rank must be a string', { rank: entry.rank });
	}

	if (!isString(entry.builder)) {
		throw new ValidationError('builder must be a string', { builder: entry.builder });
	}

	if (!isString(entry.builderLogo)) {
		throw new ValidationError('builderLogo must be a string', { builderLogo: entry.builderLogo });
	}

	if (!isNumber(entry.volume)) {
		throw new ValidationError('volume must be a number', { volume: entry.volume });
	}

	if (!isNumber(entry.activeUsers)) {
		throw new ValidationError('activeUsers must be a number', { activeUsers: entry.activeUsers });
	}

	if (!isBoolean(entry.verified)) {
		throw new ValidationError('verified must be a boolean', { verified: entry.verified });
	}

	return {
		rank: entry.rank,
		builder: entry.builder,
		volume: entry.volume,
		activeUsers: entry.activeUsers,
		verified: entry.verified,
		builderLogo: entry.builderLogo
	};
}

/**
 * Validates builder leaderboard response array
 * @param data - Raw data from API
 * @returns Validated array of BuilderLeaderboardEntry
 * @throws {ValidationError} If validation fails
 */
export function validateBuilderLeaderboard(data: unknown): BuilderLeaderboardEntry[] {
	if (!isArray(data)) {
		throw new ValidationError('BuilderLeaderboard response must be an array', { data });
	}

	return data.map((item, index) => {
		try {
			return validateBuilderLeaderboardEntry(item);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(`Invalid builder leaderboard entry at index ${index}`, {
					index,
					originalError: error.message
				});
			}
			throw error;
		}
	});
}

/**
 * Validates a single builder volume entry
 * @param data - Raw data from API
 * @returns Validated BuilderVolumeEntry
 * @throws {ValidationError} If validation fails
 */
export function validateBuilderVolumeEntry(data: unknown): BuilderVolumeEntry {
	if (!isObject(data)) {
		throw new ValidationError('BuilderVolumeEntry must be an object', { data });
	}

	const entry = data as Record<string, unknown>;

	if (!isString(entry.dt)) {
		throw new ValidationError('dt must be a string', { dt: entry.dt });
	}

	if (!isString(entry.builder)) {
		throw new ValidationError('builder must be a string', { builder: entry.builder });
	}

	if (!isString(entry.builderLogo)) {
		throw new ValidationError('builderLogo must be a string', { builderLogo: entry.builderLogo });
	}

	if (!isString(entry.rank)) {
		throw new ValidationError('rank must be a string', { rank: entry.rank });
	}

	if (!isBoolean(entry.verified)) {
		throw new ValidationError('verified must be a boolean', { verified: entry.verified });
	}

	if (!isNumber(entry.volume)) {
		throw new ValidationError('volume must be a number', { volume: entry.volume });
	}

	if (!isNumber(entry.activeUsers)) {
		throw new ValidationError('activeUsers must be a number', { activeUsers: entry.activeUsers });
	}

	return {
		dt: entry.dt,
		builder: entry.builder,
		builderLogo: entry.builderLogo,
		verified: entry.verified,
		volume: entry.volume,
		activeUsers: entry.activeUsers,
		rank: entry.rank
	};
}

/**
 * Validates builder volume time-series response array
 * @param data - Raw data from API
 * @returns Validated array of BuilderVolumeEntry
 * @throws {ValidationError} If validation fails
 */
export function validateBuilderVolume(data: unknown): BuilderVolumeEntry[] {
	if (!isArray(data)) {
		throw new ValidationError('BuilderVolume response must be an array', { data });
	}

	return data.map((item, index) => {
		try {
			return validateBuilderVolumeEntry(item);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(`Invalid builder volume entry at index ${index}`, {
					index,
					originalError: error.message
				});
			}
			throw error;
		}
	});
}

/**
 * Validates a single price point from CLOB API
 * @param data - Raw price point data
 * @returns Validated PricePoint
 * @throws {ValidationError} If validation fails
 */
export function validatePricePoint(data: unknown): PricePoint {
	if (!isObject(data)) {
		throw new ValidationError('PricePoint must be an object', { data });
	}

	const point = data as Record<string, unknown>;

	if (!isNumber(point.t)) {
		throw new ValidationError('PricePoint.t (timestamp) must be a number', { point });
	}

	if (!isNumber(point.p)) {
		throw new ValidationError('PricePoint.p (price) must be a number', { point });
	}

	return {
		t: point.t,
		p: point.p
	};
}

/**
 * Validates price history response from CLOB API
 * @param data - Raw data from /prices-history endpoint
 * @returns Validated PriceHistory object
 * @throws {ValidationError} If validation fails
 *
 * @example
 * ```typescript
 * const data = await fetch('/prices-history?market=...').then(r => r.json());
 * const validated = validatePriceHistory(data);
 * // Result: { history: [{ t: 1697875200, p: 0.65 }, ...] }
 * ```
 */
export function validatePriceHistory(data: unknown): PriceHistory {
	if (!isObject(data)) {
		throw new ValidationError('PriceHistory response must be an object', { data });
	}

	if (!isArray(data.history)) {
		throw new ValidationError('PriceHistory.history must be an array', { data });
	}

	const history = data.history.map((item, index) => {
		try {
			return validatePricePoint(item);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(`Invalid price point at index ${index}`, {
					index,
					originalError: error.message
				});
			}
			throw error;
		}
	});

	return { history };
}
