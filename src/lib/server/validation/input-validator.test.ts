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
	validateTagSlug
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
