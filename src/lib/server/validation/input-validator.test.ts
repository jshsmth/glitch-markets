/**
 * Property-based tests for input validation
 * Feature: polymarket-api-integration
 * Feature: polymarket-events
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	validateNonEmptyString,
	validatePositiveNumber,
	validateBoolean,
	validateMarketQueryParams,
	validateMarketId,
	validateMarketSlug,
	validateEventQueryParams,
	validateEventId,
	validateEventSlug,
	validateProxyWallet,
	validateTagId,
	validateTagSlug,
	validateSeriesQueryParams,
	validateSeriesId,
	validateSeriesSlug,
	validateCommentId,
	validateParentEntityType,
	validateParentEntityId,
	validateOrderString,
	validateCommentsQueryParams,
	validateUserCommentsQueryParams
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

describe('Event Input Validation', () => {
	/**
	 * Property 12: Numeric parameters are validated
	 * Feature: polymarket-events, Property 12: Numeric parameters are validated
	 * Validates: Requirements 5.1, 5.2
	 *
	 * For any numeric parameter (limit, offset), the system should reject
	 * negative values and non-integer values with a validation error.
	 */
	test('Property 12: numeric parameters reject negative and non-numeric values', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					// Invalid limit (negative or non-number)
					fc.record({
						limit: fc.oneof(
							fc.integer({ max: -1 }),
							fc.string(),
							fc.constant(NaN),
							fc.constant(Infinity),
							fc.constant(-Infinity)
						)
					}),
					// Invalid offset (negative or non-number)
					fc.record({
						offset: fc.oneof(
							fc.integer({ max: -1 }),
							fc.string(),
							fc.constant(NaN),
							fc.constant(Infinity),
							fc.constant(-Infinity)
						)
					})
				),
				(invalidParams) => {
					expect(() => validateEventQueryParams(invalidParams)).toThrow(ValidationError);

					try {
						validateEventQueryParams(invalidParams);
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

	/**
	 * Property 13: Boolean parameters are validated
	 * Feature: polymarket-events, Property 13: Boolean parameters are validated
	 * Validates: Requirements 5.3
	 *
	 * For any boolean parameter (active, closed), the system should reject
	 * non-boolean values with a validation error.
	 */
	test('Property 13: boolean parameters reject non-boolean values', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					// Invalid active (non-boolean)
					fc.record({
						active: fc.oneof(
							fc.string(),
							fc.integer(),
							fc.constant('true'),
							fc.constant('false'),
							fc.constant(0),
							fc.constant(1),
							fc.constant(null),
							fc.constant(undefined)
						)
					}),
					// Invalid closed (non-boolean)
					fc.record({
						closed: fc.oneof(
							fc.string(),
							fc.integer(),
							fc.constant('true'),
							fc.constant('false'),
							fc.constant(0),
							fc.constant(1),
							fc.constant(null),
							fc.constant(undefined)
						)
					})
				),
				(invalidParams) => {
					expect(() =>
						validateEventQueryParams(invalidParams as Record<string, string | number | boolean>)
					).toThrow(ValidationError);

					try {
						validateEventQueryParams(invalidParams as Record<string, string | number | boolean>);
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

	/**
	 * Property 6: Invalid ID throws validation error
	 * Property 14: ID validation rejects empty strings
	 * Feature: polymarket-events, Property 6 & 14: Invalid ID throws validation error
	 * Validates: Requirements 2.2, 5.4
	 *
	 * For any event ID that is empty or whitespace-only, the system should
	 * throw a validation error.
	 */
	test('Property 6 & 14: invalid event IDs throw ValidationError', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					fc.constant(''),
					fc.constant('   '),
					fc.constant('\t'),
					fc.constant('\n'),
					fc.constant('  \t\n  '),
					fc.constant(null),
					fc.constant(undefined),
					fc.integer(),
					fc.boolean(),
					fc.object()
				),
				(invalidId) => {
					expect(() => validateEventId(invalidId)).toThrow(ValidationError);

					try {
						validateEventId(invalidId);
					} catch (error) {
						expect(error).toBeInstanceOf(ValidationError);
						if (error instanceof ValidationError) {
							expect(error.statusCode).toBe(400);
							expect(error.message).toContain('event ID');
						}
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * Property 8: Invalid slug throws validation error
	 * Property 15: Slug validation rejects invalid characters
	 * Feature: polymarket-events, Property 8 & 15: Invalid slug throws validation error
	 * Validates: Requirements 3.2, 5.5
	 *
	 * For any event slug with invalid URL characters, the system should
	 * throw a validation error.
	 */
	test('Property 8 & 15: invalid event slugs throw ValidationError', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					// Empty or whitespace
					fc.constant(''),
					fc.constant('   '),
					fc.constant('\t'),
					fc.constant('\n'),
					// Non-string types
					fc.constant(null),
					fc.constant(undefined),
					fc.integer(),
					fc.boolean(),
					fc.object(),
					// Invalid characters (spaces, special chars)
					fc.constant('hello world'),
					fc.constant('hello@world'),
					fc.constant('hello!world'),
					fc.constant('hello#world'),
					fc.constant('hello$world'),
					fc.constant('hello%world'),
					fc.constant('hello&world'),
					fc.constant('hello*world'),
					fc.constant('hello+world'),
					fc.constant('hello=world'),
					fc.constant('hello/world'),
					fc.constant('hello\\world'),
					fc.constant('hello.world'),
					fc.constant('hello,world'),
					fc.constant('hello;world'),
					fc.constant('hello:world'),
					fc.constant('hello?world'),
					fc.constant('hello[world]'),
					fc.constant('hello{world}'),
					fc.constant('hello|world'),
					fc.constant('hello~world'),
					fc.constant('hello`world'),
					fc.constant('hello"world'),
					fc.constant("hello'world")
				),
				(invalidSlug) => {
					expect(() => validateEventSlug(invalidSlug)).toThrow(ValidationError);

					try {
						validateEventSlug(invalidSlug);
					} catch (error) {
						expect(error).toBeInstanceOf(ValidationError);
						if (error instanceof ValidationError) {
							expect(error.statusCode).toBe(400);
							expect(error.message).toContain('event slug');
						}
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	test('valid event query parameters do not throw errors', () => {
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
					expect(() => validateEventQueryParams(cleanParams)).not.toThrow();

					// Validate the result
					const result = validateEventQueryParams(cleanParams);
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

	test('valid event IDs do not throw errors', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
				(validId) => {
					expect(() => validateEventId(validId)).not.toThrow();
					const result = validateEventId(validId);
					expect(result).toBeDefined();
					expect(typeof result).toBe('string');
				}
			),
			{ numRuns: 100 }
		);
	});

	test('valid event slugs do not throw errors', () => {
		fc.assert(
			fc.property(
				fc.stringMatching(/^[a-zA-Z0-9_-]+$/).filter((s) => s.length > 0 && s.trim().length > 0),
				(validSlug) => {
					expect(() => validateEventSlug(validSlug)).not.toThrow();
					const result = validateEventSlug(validSlug);
					expect(result).toBeDefined();
					expect(typeof result).toBe('string');
					expect(/^[a-zA-Z0-9_-]+$/.test(result)).toBe(true);
				}
			),
			{ numRuns: 100 }
		);
	});
});

describe('Tag Input Validation', () => {
	/**
	 * Property 3: Input validation rejection
	 * Feature: polymarket-tags-api, Property 3: Input validation rejection
	 * Validates: Requirements 2.1, 3.1
	 *
	 * For any invalid input (empty string, whitespace-only string, or non-string),
	 * the validation function should throw a ValidationError before making an API request.
	 */
	test('Property 3: invalid tag IDs throw ValidationError', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					fc.constant(''),
					fc.constant('   '),
					fc.constant('\t'),
					fc.constant('\n'),
					fc.constant('  \t\n  '),
					fc.constant(null),
					fc.constant(undefined),
					fc.integer(),
					fc.boolean(),
					fc.object(),
					fc.array(fc.anything())
				),
				(invalidId) => {
					expect(() => validateTagId(invalidId)).toThrow(ValidationError);

					try {
						validateTagId(invalidId);
					} catch (error) {
						expect(error).toBeInstanceOf(ValidationError);
						if (error instanceof ValidationError) {
							expect(error.statusCode).toBe(400);
							expect(error.message).toContain('tag ID');
						}
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Property 3: invalid tag slugs throw ValidationError', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					fc.constant(''),
					fc.constant('   '),
					fc.constant('\t'),
					fc.constant('\n'),
					fc.constant('  \t\n  '),
					fc.constant(null),
					fc.constant(undefined),
					fc.integer(),
					fc.boolean(),
					fc.object(),
					fc.array(fc.anything())
				),
				(invalidSlug) => {
					expect(() => validateTagSlug(invalidSlug)).toThrow(ValidationError);

					try {
						validateTagSlug(invalidSlug);
					} catch (error) {
						expect(error).toBeInstanceOf(ValidationError);
						if (error instanceof ValidationError) {
							expect(error.statusCode).toBe(400);
							expect(error.message).toContain('tag slug');
						}
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	test('valid tag IDs do not throw errors', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
				(validId) => {
					expect(() => validateTagId(validId)).not.toThrow();
					const result = validateTagId(validId);
					expect(result).toBeDefined();
					expect(typeof result).toBe('string');
				}
			),
			{ numRuns: 100 }
		);
	});

	test('valid tag slugs do not throw errors', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
				(validSlug) => {
					expect(() => validateTagSlug(validSlug)).not.toThrow();
					const result = validateTagSlug(validSlug);
					expect(result).toBeDefined();
					expect(typeof result).toBe('string');
				}
			),
			{ numRuns: 100 }
		);
	});
});

describe('User Data Input Validation', () => {
	/**
	 * Property 1: Wallet address validation rejects invalid formats
	 * Feature: polymarket-user-data, Property 1: Wallet address validation rejects invalid formats
	 * Validates: Requirements 1.5, 3.5, 5.5, 6.4
	 *
	 * For any string that does not match the format "0x" followed by exactly 40 hexadecimal
	 * characters, the validation function should reject it with a validation error.
	 */
	test('Property 1: wallet address validation rejects invalid formats', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					// Non-string types
					fc.constant(null),
					fc.constant(undefined),
					fc.integer(),
					fc.boolean(),
					fc.object(),
					fc.array(fc.anything()),
					// Empty or whitespace
					fc.constant(''),
					fc.constant('   '),
					fc.constant('\t'),
					fc.constant('\n'),
					// Missing 0x prefix (40 hex chars without prefix)
					fc
						.array(
							fc.constantFrom(
								'0',
								'1',
								'2',
								'3',
								'4',
								'5',
								'6',
								'7',
								'8',
								'9',
								'a',
								'b',
								'c',
								'd',
								'e',
								'f'
							),
							{
								minLength: 40,
								maxLength: 40
							}
						)
						.map((arr) => arr.join('')),
					// Wrong length (too short)
					fc
						.array(
							fc.constantFrom(
								'0',
								'1',
								'2',
								'3',
								'4',
								'5',
								'6',
								'7',
								'8',
								'9',
								'a',
								'b',
								'c',
								'd',
								'e',
								'f'
							),
							{
								minLength: 1,
								maxLength: 39
							}
						)
						.map((arr) => '0x' + arr.join('')),
					// Wrong length (too long)
					fc
						.array(
							fc.constantFrom(
								'0',
								'1',
								'2',
								'3',
								'4',
								'5',
								'6',
								'7',
								'8',
								'9',
								'a',
								'b',
								'c',
								'd',
								'e',
								'f'
							),
							{
								minLength: 41,
								maxLength: 100
							}
						)
						.map((arr) => '0x' + arr.join('')),
					// Invalid characters (not hex)
					fc.constant('0x' + 'g'.repeat(40)),
					fc.constant('0x' + 'z'.repeat(40)),
					fc.constant('0x' + ' '.repeat(40)),
					fc.constant('0x' + '!'.repeat(40)),
					// Mixed valid and invalid
					fc
						.tuple(
							fc.array(
								fc.constantFrom(
									'0',
									'1',
									'2',
									'3',
									'4',
									'5',
									'6',
									'7',
									'8',
									'9',
									'a',
									'b',
									'c',
									'd',
									'e',
									'f'
								),
								{
									minLength: 20,
									maxLength: 20
								}
							),
							fc.string({ minLength: 20, maxLength: 20 })
						)
						.map(
							([valid, invalid]) => '0x' + valid.join('') + invalid.replace(/[0-9a-fA-F]/g, 'g')
						),
					// Case variations with wrong format
					fc.constant('0X' + 'a'.repeat(40)), // uppercase X
					fc.constant('x' + 'a'.repeat(40)), // missing 0
					fc.constant('0' + 'a'.repeat(40)) // missing x
				),
				(invalidWallet) => {
					expect(() => validateProxyWallet(invalidWallet)).toThrow(ValidationError);

					try {
						validateProxyWallet(invalidWallet);
					} catch (error) {
						expect(error).toBeInstanceOf(ValidationError);
						if (error instanceof ValidationError) {
							expect(error.statusCode).toBe(400);
							expect(error.message).toContain('proxy wallet');
						}
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	test('valid wallet addresses do not throw errors', () => {
		fc.assert(
			fc.property(
				fc
					.array(
						fc.constantFrom(
							'0',
							'1',
							'2',
							'3',
							'4',
							'5',
							'6',
							'7',
							'8',
							'9',
							'a',
							'b',
							'c',
							'd',
							'e',
							'f',
							'A',
							'B',
							'C',
							'D',
							'E',
							'F'
						),
						{
							minLength: 40,
							maxLength: 40
						}
					)
					.map((arr) => '0x' + arr.join('')),
				(validWallet) => {
					expect(() => validateProxyWallet(validWallet)).not.toThrow();
					const result = validateProxyWallet(validWallet);
					expect(result).toBeDefined();
					expect(typeof result).toBe('string');
					expect(/^0x[0-9a-fA-F]{40}$/.test(result)).toBe(true);
				}
			),
			{ numRuns: 100 }
		);
	});
});

describe('Series Input Validation', () => {
	/**
	 * Property 1: Query parameter validation
	 * Feature: polymarket-series-api, Property 1: Query parameter validation
	 * Validates: Requirements 1.1, 9.1, 9.2, 9.3, 9.4
	 *
	 * For any query parameters object containing limit, offset, active, or closed fields,
	 * validation should accept valid values (non-negative integers for limit/offset,
	 * booleans for active/closed) and reject invalid values.
	 */
	test('Property 1: query parameter validation rejects invalid values', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					// Invalid limit (negative or non-number)
					fc.record({
						limit: fc.oneof(
							fc.integer({ max: -1 }),
							fc.string(),
							fc.constant(NaN),
							fc.constant(Infinity),
							fc.constant(-Infinity)
						)
					}),
					// Invalid offset (negative or non-number)
					fc.record({
						offset: fc.oneof(
							fc.integer({ max: -1 }),
							fc.string(),
							fc.constant(NaN),
							fc.constant(Infinity),
							fc.constant(-Infinity)
						)
					}),
					// Invalid active (non-boolean)
					fc.record({
						active: fc.oneof(
							fc.string(),
							fc.integer(),
							fc.constant('true'),
							fc.constant('false'),
							fc.constant(0),
							fc.constant(1),
							fc.constant(null),
							fc.constant(undefined)
						)
					}),
					// Invalid closed (non-boolean)
					fc.record({
						closed: fc.oneof(
							fc.string(),
							fc.integer(),
							fc.constant('true'),
							fc.constant('false'),
							fc.constant(0),
							fc.constant(1),
							fc.constant(null),
							fc.constant(undefined)
						)
					}),
					// Invalid category (empty string or non-string)
					fc.record({
						category: fc.oneof(fc.constant(''), fc.constant('   '), fc.integer(), fc.boolean())
					})
				),
				(invalidParams) => {
					expect(() =>
						validateSeriesQueryParams(invalidParams as Record<string, string | number | boolean>)
					).toThrow(ValidationError);

					try {
						validateSeriesQueryParams(invalidParams as Record<string, string | number | boolean>);
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

	test('Property 1: query parameter validation accepts valid values', () => {
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
					expect(() => validateSeriesQueryParams(cleanParams)).not.toThrow();

					// Validate the result
					const result = validateSeriesQueryParams(cleanParams);
					expect(result).toBeDefined();

					// Verify all input keys are in the result
					for (const key of Object.keys(cleanParams)) {
						expect(result).toHaveProperty(key);
					}

					// Verify types are preserved
					if (cleanParams.limit !== undefined) {
						expect(typeof result.limit).toBe('number');
						expect(result.limit).toBeGreaterThanOrEqual(0);
					}
					if (cleanParams.offset !== undefined) {
						expect(typeof result.offset).toBe('number');
						expect(result.offset).toBeGreaterThanOrEqual(0);
					}
					if (cleanParams.active !== undefined) {
						expect(typeof result.active).toBe('boolean');
					}
					if (cleanParams.closed !== undefined) {
						expect(typeof result.closed).toBe('boolean');
					}
					if (cleanParams.category !== undefined) {
						expect(typeof result.category).toBe('string');
						expect((result.category as string).trim().length).toBeGreaterThan(0);
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * Property 2: ID and slug validation
	 * Feature: polymarket-series-api, Property 2: ID and slug validation
	 * Validates: Requirements 2.1, 2.2, 9.5
	 *
	 * For any string value, validation should accept non-empty strings as valid IDs
	 * or slugs and reject empty strings.
	 */
	test('Property 2: ID validation rejects invalid values', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					fc.constant(''),
					fc.constant('   '),
					fc.constant('\t'),
					fc.constant('\n'),
					fc.constant('  \t\n  '),
					fc.constant(null),
					fc.constant(undefined),
					fc.integer(),
					fc.boolean(),
					fc.object(),
					fc.array(fc.anything())
				),
				(invalidId) => {
					expect(() => validateSeriesId(invalidId)).toThrow(ValidationError);

					try {
						validateSeriesId(invalidId);
					} catch (error) {
						expect(error).toBeInstanceOf(ValidationError);
						if (error instanceof ValidationError) {
							expect(error.statusCode).toBe(400);
							expect(error.message).toContain('series ID');
						}
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Property 2: slug validation rejects invalid values', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					fc.constant(''),
					fc.constant('   '),
					fc.constant('\t'),
					fc.constant('\n'),
					fc.constant('  \t\n  '),
					fc.constant(null),
					fc.constant(undefined),
					fc.integer(),
					fc.boolean(),
					fc.object(),
					fc.array(fc.anything())
				),
				(invalidSlug) => {
					expect(() => validateSeriesSlug(invalidSlug)).toThrow(ValidationError);

					try {
						validateSeriesSlug(invalidSlug);
					} catch (error) {
						expect(error).toBeInstanceOf(ValidationError);
						if (error instanceof ValidationError) {
							expect(error.statusCode).toBe(400);
							expect(error.message).toContain('series slug');
						}
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Property 2: ID validation accepts valid non-empty strings', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
				(validId) => {
					expect(() => validateSeriesId(validId)).not.toThrow();
					const result = validateSeriesId(validId);
					expect(result).toBeDefined();
					expect(typeof result).toBe('string');
					expect(result.trim().length).toBeGreaterThan(0);
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Property 2: slug validation accepts valid non-empty strings', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
				(validSlug) => {
					expect(() => validateSeriesSlug(validSlug)).not.toThrow();
					const result = validateSeriesSlug(validSlug);
					expect(result).toBeDefined();
					expect(typeof result).toBe('string');
					expect(result.trim().length).toBeGreaterThan(0);
				}
			),
			{ numRuns: 100 }
		);
	});

	// Comment validation tests
	describe('Comment ID validation', () => {
		test('accepts valid non-negative integers', () => {
			fc.assert(
				fc.property(fc.integer({ min: 0 }), (id) => {
					const result = validateCommentId(id);
					expect(result).toBe(id);
					expect(typeof result).toBe('number');
					expect(Number.isInteger(result)).toBe(true);
					expect(result).toBeGreaterThanOrEqual(0);
				}),
				{ numRuns: 100 }
			);
		});

		test('accepts valid string representations of non-negative integers', () => {
			fc.assert(
				fc.property(fc.integer({ min: 0 }), (id) => {
					const stringId = id.toString();
					const result = validateCommentId(stringId);
					expect(result).toBe(id);
					expect(typeof result).toBe('number');
					expect(Number.isInteger(result)).toBe(true);
					expect(result).toBeGreaterThanOrEqual(0);
				}),
				{ numRuns: 100 }
			);
		});

		test('rejects negative numbers', () => {
			fc.assert(
				fc.property(fc.integer({ max: -1 }), (id) => {
					expect(() => validateCommentId(id)).toThrow(ValidationError);
				}),
				{ numRuns: 100 }
			);
		});

		test('rejects non-integer values', () => {
			fc.assert(
				fc.property(
					fc.oneof(
						fc.constant(null),
						fc.constant(undefined),
						fc.boolean(),
						fc.object(),
						fc.array(fc.anything()),
						fc.double({ noNaN: true, noInteger: true })
					),
					(invalidValue) => {
						expect(() => validateCommentId(invalidValue)).toThrow(ValidationError);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	describe('Parent entity type validation', () => {
		test('accepts valid parent entity types', () => {
			const validTypes = ['Event', 'Series', 'market'] as const;
			for (const type of validTypes) {
				const result = validateParentEntityType(type);
				expect(result).toBe(type);
			}
		});

		test('rejects invalid parent entity types', () => {
			fc.assert(
				fc.property(
					fc.string().filter((s) => !['Event', 'Series', 'market'].includes(s)),
					(invalidType) => {
						expect(() => validateParentEntityType(invalidType)).toThrow(ValidationError);
					}
				),
				{ numRuns: 100 }
			);
		});

		test('rejects non-string values', () => {
			fc.assert(
				fc.property(
					fc.oneof(
						fc.constant(null),
						fc.constant(undefined),
						fc.integer(),
						fc.boolean(),
						fc.object(),
						fc.array(fc.anything())
					),
					(invalidValue) => {
						expect(() => validateParentEntityType(invalidValue)).toThrow(ValidationError);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	describe('Parent entity ID validation', () => {
		test('accepts valid non-negative integers', () => {
			fc.assert(
				fc.property(fc.integer({ min: 0 }), (id) => {
					const result = validateParentEntityId(id);
					expect(result).toBe(id);
					expect(typeof result).toBe('number');
					expect(Number.isInteger(result)).toBe(true);
					expect(result).toBeGreaterThanOrEqual(0);
				}),
				{ numRuns: 100 }
			);
		});

		test('rejects negative numbers', () => {
			fc.assert(
				fc.property(fc.integer({ max: -1 }), (id) => {
					expect(() => validateParentEntityId(id)).toThrow(ValidationError);
				}),
				{ numRuns: 100 }
			);
		});
	});

	describe('Order string validation', () => {
		test('accepts valid field names', () => {
			const validOrders = [
				'createdAt',
				'updatedAt',
				'id',
				'field_name',
				'_privateField',
				'createdAt,updatedAt',
				'id,createdAt,updatedAt'
			];

			for (const order of validOrders) {
				const result = validateOrderString(order);
				expect(result).toBe(order);
			}
		});

		test('rejects invalid field names', () => {
			const invalidOrders = [
				'123invalid', // starts with number
				'invalid-field', // contains hyphen
				'invalid field', // contains space
				'invalid.field', // contains dot
				'', // empty string
				'   ' // whitespace only
			];

			for (const order of invalidOrders) {
				expect(() => validateOrderString(order)).toThrow(ValidationError);
			}
		});

		test('rejects non-string values', () => {
			fc.assert(
				fc.property(
					fc.oneof(
						fc.constant(null),
						fc.constant(undefined),
						fc.integer(),
						fc.boolean(),
						fc.object(),
						fc.array(fc.anything())
					),
					(invalidValue) => {
						expect(() => validateOrderString(invalidValue)).toThrow(ValidationError);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	describe('Comments query params validation', () => {
		test('validates all parameters correctly', () => {
			const params = {
				limit: 10,
				offset: 0,
				parent_entity_id: 123,
				parent_entity_type: 'Event',
				ascending: true,
				get_positions: false,
				holders_only: true,
				order: 'createdAt,id'
			};

			const result = validateCommentsQueryParams(params);
			expect(result.limit).toBe(10);
			expect(result.offset).toBe(0);
			expect(result.parent_entity_id).toBe(123);
			expect(result.parent_entity_type).toBe('Event');
			expect(result.ascending).toBe(true);
			expect(result.get_positions).toBe(false);
			expect(result.holders_only).toBe(true);
			expect(result.order).toBe('createdAt,id');
		});

		test('passes through unknown parameters', () => {
			const params = {
				limit: 10,
				customParam: 'value'
			};

			const result = validateCommentsQueryParams(params);
			expect(result.limit).toBe(10);
			expect(result.customParam).toBe('value');
		});
	});

	describe('User comments query params validation', () => {
		test('validates all parameters correctly', () => {
			const params = {
				limit: 20,
				offset: 5,
				ascending: false,
				order: 'updatedAt'
			};

			const result = validateUserCommentsQueryParams(params);
			expect(result.limit).toBe(20);
			expect(result.offset).toBe(5);
			expect(result.ascending).toBe(false);
			expect(result.order).toBe('updatedAt');
		});

		test('passes through unknown parameters', () => {
			const params = {
				limit: 10,
				customParam: 'value'
			};

			const result = validateUserCommentsQueryParams(params);
			expect(result.limit).toBe(10);
			expect(result.customParam).toBe('value');
		});
	});
});
