/**
 * Shared query parameter parsing utilities for API routes
 * Provides type-safe parsing with validation and error handling
 */

import { ApiError } from '$lib/server/errors/api-errors.js';

/**
 * Parses a query parameter as an integer
 * @param value - The query parameter value to parse
 * @param name - The parameter name (for error messages)
 * @returns The parsed integer, or null if value is null
 * @throws {ApiError} If the value cannot be parsed as a valid integer
 */
export function parseInteger(value: string | null, name: string): number | null {
	if (value === null) return null;
	const parsed = parseInt(value, 10);
	if (isNaN(parsed)) {
		throw new ApiError(`Invalid ${name} parameter`, 400, 'VALIDATION_ERROR');
	}
	return parsed;
}

/**
 * Parses a query parameter as a boolean
 * @param value - The query parameter value to parse
 * @param name - The parameter name (for error messages)
 * @returns The parsed boolean, or null if value is null
 * @throws {ApiError} If the value is not 'true' or 'false'
 */
export function parseBoolean(value: string | null, name: string): boolean | null {
	if (value === null) return null;
	if (value !== 'true' && value !== 'false') {
		throw new ApiError(`Invalid ${name} parameter`, 400, 'VALIDATION_ERROR');
	}
	return value === 'true';
}

/**
 * Parses a query parameter as a number (float)
 * @param value - The query parameter value to parse
 * @param name - The parameter name (for error messages)
 * @returns The parsed number, or null if value is null
 * @throws {ApiError} If the value cannot be parsed as a valid number
 */
export function parseNumber(value: string | null, name: string): number | null {
	if (value === null) return null;
	const parsed = parseFloat(value);
	if (isNaN(parsed)) {
		throw new ApiError(`Invalid ${name} parameter`, 400, 'VALIDATION_ERROR');
	}
	return parsed;
}

/**
 * Parses multiple query parameters as an array of integers
 * @param values - Array of query parameter values to parse
 * @param name - The parameter name (for error messages)
 * @returns Array of parsed integers, or empty array if no values
 * @throws {ApiError} If any value cannot be parsed as a valid integer
 */
export function parseIntegerArray(values: string[], name: string): number[] {
	if (values.length === 0) return [];

	return values.map((value) => {
		const parsed = parseInt(value, 10);
		if (isNaN(parsed)) {
			throw new ApiError(`Invalid ${name} parameter`, 400, 'VALIDATION_ERROR');
		}
		return parsed;
	});
}

/**
 * Validates that a value is non-negative
 * @param value - The value to validate
 * @param name - The parameter name (for error messages)
 * @throws {ApiError} If the value is negative
 */
export function validateNonNegative(value: number | null, name: string): void {
	if (value !== null && value < 0) {
		throw new ApiError(`Invalid ${name} parameter`, 400, 'VALIDATION_ERROR');
	}
}
