/**
 * Shared fast-check arbitraries for common data types
 * Reduces duplication across test files and ensures consistency
 */

import * as fc from 'fast-check';

/**
 * Common string arbitraries
 */
export const arbitraries = {
	// Basic strings
	nonEmptyString: () => fc.string({ minLength: 1 }),
	shortString: () => fc.string({ minLength: 1, maxLength: 50 }),
	errorMessage: () => fc.string({ minLength: 1, maxLength: 100 }),

	// Numbers
	positiveInt: () => fc.integer({ min: 1 }),
	smallPositiveInt: () => fc.integer({ min: 1, max: 1000 }),
	id: () => fc.integer({ min: 1 }),

	// Pagination
	limit: () => fc.option(fc.integer({ min: 1, max: 100 })),
	offset: () => fc.option(fc.integer({ min: 0, max: 1000 })),

	// Time periods (used across multiple APIs)
	timePeriod: () =>
		fc.option(
			fc.oneof(fc.constant('DAY'), fc.constant('WEEK'), fc.constant('MONTH'), fc.constant('ALL'))
		),

	// Dates and timestamps
	futureDate: () =>
		fc
			.integer({ min: Date.parse('2020-01-01'), max: Date.parse('2030-12-31') })
			.map((ts) => new Date(ts).toISOString()),
	dateString: () =>
		fc
			.integer({ min: Date.parse('2020-01-01'), max: Date.parse('2030-12-31') })
			.map((ts) => new Date(ts).toISOString()),
	isoDateOnly: () =>
		fc
			.integer({ min: Date.parse('2020-01-01'), max: Date.parse('2030-12-31') })
			.map((ts) => new Date(ts).toISOString().split('T')[0]),

	// Financial
	volume: () => fc.float({ min: 0, max: 10000000, noNaN: true }),
	liquidity: () => fc.float({ min: 0, max: 1000000, noNaN: true }),
	price: () => fc.float({ min: 0, max: 1, noNaN: true }),

	// URLs
	imageUrl: () => fc.webUrl(),
	logoUrl: () => fc.webUrl(),

	// Entity types (common across APIs)
	entityType: () => fc.oneof(fc.constant('Event'), fc.constant('Series'), fc.constant('market')),

	// Boolean
	verified: () => fc.boolean(),

	// Ranks (as strings, common pattern)
	rankString: () => fc.integer({ min: 1, max: 1000 }).map(String),

	// Active users count
	activeUsers: () => fc.integer({ min: 0, max: 10000 })
};

/**
 * Pagination filters arbitrary (used across many endpoints)
 */
export const paginationFilters = () =>
	fc.record({
		limit: arbitraries.limit(),
		offset: arbitraries.offset()
	});

/**
 * Time period filters arbitrary (used in builders endpoints)
 */
export const timePeriodFilters = () =>
	fc.record({
		timePeriod: arbitraries.timePeriod(),
		limit: arbitraries.limit(),
		offset: arbitraries.offset()
	});

/**
 * Authentication arbitraries for auth endpoint testing
 */
export const authArbitraries = {
	/** Generates valid email addresses */
	email: () => fc.emailAddress(),

	/** Generates valid passwords (8-128 chars with complexity requirements) */
	password: () =>
		fc
			.string({ minLength: 8, maxLength: 128 })
			.filter((s) => /[A-Z]/.test(s) && /[a-z]/.test(s) && /[0-9]/.test(s)),

	/** Generates invalid email patterns for validation testing */
	invalidEmail: () =>
		fc.oneof(
			fc.constant(''),
			fc.constant('not-an-email'),
			fc.constant('missing@'),
			fc.constant('@nodomain.com'),
			fc.constant('no-at-sign.com'),
			fc.constant('multiple@@at.com')
		),

	/** Generates weak/invalid passwords for validation testing */
	weakPassword: () =>
		fc.oneof(
			fc.constant(''), // empty
			fc.constant('123'), // too short
			fc.constant('password'), // no numbers/uppercase
			fc.constant('12345678'), // too simple
			fc.constant('PASSWORD'), // no lowercase/numbers
			fc.constant('Pass123') // too short (< 8 chars)
		)
};

/**
 * Ethereum address arbitraries for blockchain-related testing
 */
export const ethereumArbitraries = {
	/** Generates valid Ethereum addresses (0x + 40 hex chars) */
	validAddress: () =>
		fc
			.array(fc.integer({ min: 0, max: 15 }), { minLength: 40, maxLength: 40 })
			.map((nums) => `0x${nums.map((n) => n.toString(16)).join('')}`),

	/** Generates invalid Ethereum address patterns for validation testing */
	invalidAddress: () =>
		fc.oneof(
			fc.constant(''), // empty
			fc.constant('0x123'), // too short
			fc.constant('not-an-address'), // not hex
			fc.constant('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG'), // invalid chars
			fc.constant('1234567890abcdef1234567890abcdef12345678') // missing 0x prefix
		)
};

/**
 * Bridge arbitraries for cross-chain bridge testing
 */
export const bridgeArbitraries = {
	/** Generates valid blockchain chain IDs */
	chainId: () =>
		fc.oneof(
			fc.constant('1'), // Ethereum
			fc.constant('137'), // Polygon
			fc.constant('42161'), // Arbitrum
			fc.constant('10'), // Optimism
			fc.constant('8453') // Base
		),

	/** Generates token symbols for supported assets */
	tokenSymbol: () =>
		fc.oneof(fc.constant('USDC'), fc.constant('USDT'), fc.constant('DAI'), fc.constant('ETH')),

	/** Generates chain names */
	chainName: () =>
		fc.oneof(
			fc.constant('Ethereum'),
			fc.constant('Polygon'),
			fc.constant('Arbitrum'),
			fc.constant('Optimism'),
			fc.constant('Base')
		)
};
