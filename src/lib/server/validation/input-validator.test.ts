/**
 * Property-based tests for input validation
 * Feature: polymarket-api-integration
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	validateNonEmptyString,
	validatePositiveNumber,
	validateBoolean,
	validateMarketQueryParams,
	validateMarketId,
	validateMarketSlug
} from './input-validator.js';
import { ValidationError } from '../errors/api-errors.js';

describe('Input Validation', () => {
	/**
	 * Property 8: Input validation
	 * Validates: Requirements 4.4
	 *
	 * For any invalid request parameters, the server route should return
	 * a 400 error response with an appropriate error message.
	 */
	test('Property 8: invalid string parameters throw ValidationError with 400 status', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					fc.constant(null),
					fc.constant(undefined),
					fc.constant(''),
					fc.constant('   '),
					fc.integer(),
					fc.boolean(),
					fc.object(),
					fc.array(fc.anything())
				),
				fc.string({ minLength: 1 }),
				(invalidValue, paramName) => {
					expect(() => validateNonEmptyString(invalidValue, paramName)).toThrow(ValidationError);

					try {
						validateNonEmptyString(invalidValue, paramName);
					} catch (error) {
						expect(error).toBeInstanceOf(ValidationError);
						if (error instanceof ValidationError) {
							expect(error.statusCode).toBe(400);
							expect(error.message).toContain(paramName);
						}
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Property 8: invalid number parameters throw ValidationError with 400 status', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					fc.constant(null),
					fc.constant(undefined),
					fc.string(),
					fc.boolean(),
					fc.constant(NaN),
					fc.constant(Infinity),
					fc.constant(-Infinity),
					fc.double({ min: -1000, max: 0 }) // negative numbers for positive validation
				),
				fc.string({ minLength: 1 }),
				(invalidValue, paramName) => {
					expect(() => validatePositiveNumber(invalidValue, paramName)).toThrow(ValidationError);

					try {
						validatePositiveNumber(invalidValue, paramName);
					} catch (error) {
						expect(error).toBeInstanceOf(ValidationError);
						if (error instanceof ValidationError) {
							expect(error.statusCode).toBe(400);
							expect(error.message).toContain(paramName);
						}
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Property 8: invalid boolean parameters throw ValidationError with 400 status', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					fc.constant(null),
					fc.constant(undefined),
					fc.string(),
					fc.integer(),
					fc.constant(0),
					fc.constant(1),
					fc.constant('true'),
					fc.constant('false')
				),
				fc.string({ minLength: 1 }),
				(invalidValue, paramName) => {
					expect(() => validateBoolean(invalidValue, paramName)).toThrow(ValidationError);

					try {
						validateBoolean(invalidValue, paramName);
					} catch (error) {
						expect(error).toBeInstanceOf(ValidationError);
						if (error instanceof ValidationError) {
							expect(error.statusCode).toBe(400);
							expect(error.message).toContain(paramName);
						}
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Property 8: invalid market query parameters throw ValidationError with 400 status', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					// Invalid limit (negative or non-number)
					fc.record({
						limit: fc.oneof(fc.integer({ max: -1 }), fc.string(), fc.constant(NaN))
					}),
					// Invalid offset (negative or non-number)
					fc.record({
						offset: fc.oneof(fc.integer({ max: -1 }), fc.string(), fc.constant(NaN))
					}),
					// Invalid active (non-boolean)
					fc.record({
						active: fc.oneof(fc.string(), fc.integer(), fc.constant('true'))
					}),
					// Invalid closed (non-boolean)
					fc.record({
						closed: fc.oneof(fc.string(), fc.integer(), fc.constant('false'))
					}),
					// Invalid category (empty string or non-string)
					fc.record({
						category: fc.oneof(fc.constant(''), fc.constant('   '), fc.integer())
					})
				),
				(invalidParams) => {
					expect(() => validateMarketQueryParams(invalidParams)).toThrow(ValidationError);

					try {
						validateMarketQueryParams(invalidParams);
					} catch (error) {
						expect(error).toBeInstanceOf(ValidationError);
						if (error instanceof ValidationError) {
							expect(error.statusCode).toBe(400);
							expect(error.message.length).toBeGreaterThan(0);
						}
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Property 8: invalid market IDs throw ValidationError with 400 status', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					fc.constant(''),
					fc.constant('   '),
					fc.constant(null),
					fc.constant(undefined),
					fc.integer(),
					fc.boolean()
				),
				(invalidId) => {
					expect(() => validateMarketId(invalidId)).toThrow(ValidationError);

					try {
						validateMarketId(invalidId);
					} catch (error) {
						expect(error).toBeInstanceOf(ValidationError);
						if (error instanceof ValidationError) {
							expect(error.statusCode).toBe(400);
							expect(error.message).toContain('market ID');
						}
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Property 8: invalid market slugs throw ValidationError with 400 status', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					fc.constant(''),
					fc.constant('   '),
					fc.constant(null),
					fc.constant(undefined),
					fc.integer(),
					fc.boolean()
				),
				(invalidSlug) => {
					expect(() => validateMarketSlug(invalidSlug)).toThrow(ValidationError);

					try {
						validateMarketSlug(invalidSlug);
					} catch (error) {
						expect(error).toBeInstanceOf(ValidationError);
						if (error instanceof ValidationError) {
							expect(error.statusCode).toBe(400);
							expect(error.message).toContain('market slug');
						}
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Property 8: valid parameters do not throw errors', () => {
		fc.assert(
			fc.property(
				fc.record({
					limit: fc.option(fc.integer({ min: 0, max: 1000 })),
					offset: fc.option(fc.integer({ min: 0, max: 10000 })),
					active: fc.option(fc.boolean()),
					closed: fc.option(fc.boolean()),
					category: fc.option(fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0))
				}),
				(validParams) => {
					// Remove undefined values
					const cleanParams: Record<string, string | number | boolean> = {};
					for (const [key, value] of Object.entries(validParams)) {
						if (value !== undefined && value !== null) {
							cleanParams[key] = value;
						}
					}

					// Should not throw
					expect(() => validateMarketQueryParams(cleanParams)).not.toThrow();

					// Validate the result
					const result = validateMarketQueryParams(cleanParams);
					expect(result).toBeDefined();

					// Verify all input keys are in the result
					for (const key of Object.keys(cleanParams)) {
						expect(result).toHaveProperty(key);
					}
				}
			),
			{ numRuns: 100 }
		);
	});
});
