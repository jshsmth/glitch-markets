/**
 * Response validation utilities for API responses
 */

import { ValidationError } from '../errors/api-errors.js';
import type { Market, Event, Category, Tag } from '../api/polymarket-client.js';

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

	// Validate required string fields
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

	// Validate required array fields
	if (!('outcomes' in data)) {
		missingFields.push('outcomes');
	} else if (!isArray(data.outcomes)) {
		invalidTypeFields.push(`outcomes (expected array, got ${typeof data.outcomes})`);
	} else if (!data.outcomes.every(isString)) {
		invalidTypeFields.push('outcomes (array must contain only strings)');
	}

	if (!('outcomePrices' in data)) {
		missingFields.push('outcomePrices');
	} else if (!isArray(data.outcomePrices)) {
		invalidTypeFields.push(`outcomePrices (expected array, got ${typeof data.outcomePrices})`);
	} else if (!data.outcomePrices.every(isString)) {
		invalidTypeFields.push('outcomePrices (array must contain only strings)');
	}

	// Validate required boolean fields
	const requiredBooleanFields = ['active', 'closed'];
	for (const field of requiredBooleanFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isBoolean(data[field])) {
			invalidTypeFields.push(`${field} (expected boolean, got ${typeof data[field]})`);
		}
	}

	// Validate required number fields
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

	// Validate marketType enum
	if ('marketType' in data && data.marketType !== 'normal' && data.marketType !== 'scalar') {
		invalidTypeFields.push(`marketType (expected 'normal' or 'scalar', got '${data.marketType}')`);
	}

	// Throw validation error if any issues found
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

	// Type assertion is safe here because we've validated all fields
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

	// Validate required string fields
	const requiredStringFields = [
		'id',
		'ticker',
		'slug',
		'title',
		'subtitle',
		'description',
		'resolutionSource',
		'startDate',
		'creationDate',
		'endDate',
		'image',
		'icon',
		'category',
		'subcategory'
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

	// Validate required boolean fields
	const requiredBooleanFields = ['active', 'closed', 'archived', 'new', 'featured', 'restricted'];
	for (const field of requiredBooleanFields) {
		if (!(field in data)) {
			missingFields.push(field);
		} else if (!isBoolean(data[field])) {
			invalidTypeFields.push(`${field} (expected boolean, got ${typeof data[field]})`);
		}
	}

	// Validate required number fields
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

	// Validate required array fields
	if (!('markets' in data)) {
		missingFields.push('markets');
	} else if (!isArray(data.markets)) {
		invalidTypeFields.push(`markets (expected array, got ${typeof data.markets})`);
	}

	if (!('categories' in data)) {
		missingFields.push('categories');
	} else if (!isArray(data.categories)) {
		invalidTypeFields.push(`categories (expected array, got ${typeof data.categories})`);
	}

	if (!('tags' in data)) {
		missingFields.push('tags');
	} else if (!isArray(data.tags)) {
		invalidTypeFields.push(`tags (expected array, got ${typeof data.tags})`);
	}

	// Throw validation error if any issues found
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

	// Type assertion is safe here because we've validated all fields
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
