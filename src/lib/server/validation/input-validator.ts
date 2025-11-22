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
				// Allow other parameters to pass through
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
