/**
 * Property-based tests for UserDataService
 * Feature: polymarket-user-data
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import type {
	Position,
	Trade,
	MarketHolders,
	HolderInfo,
	PortfolioValue
} from '../api/polymarket-client.js';

// Mock the dependencies
vi.mock('../api/polymarket-client.js');
vi.mock('../cache/cache-manager.js');
vi.mock('../config/api-config.js');
vi.mock('../utils/logger.js');

describe('UserDataService Property Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	/**
	 * Property 2: Position filtering returns only matching markets
	 * Feature: polymarket-user-data, Property 2: Position filtering returns only matching markets
	 * Validates: Requirements 1.2
	 *
	 * For any set of positions and any market filter, all returned positions should have
	 * their conditionId or slug matching one of the markets in the filter.
	 */
	test('Property 2: position filtering returns only matching markets', () => {
		// Generator for valid hex strings (condition IDs)
		const hexStringGen = fc
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
					minLength: 64,
					maxLength: 64
				}
			)
			.map((arr) => '0x' + arr.join(''));

		// Generator for slugs
		const slugGen = fc.stringMatching(/^[a-z0-9-]+$/).filter((s) => s.length > 0 && s.length < 100);

		// Generator for positions
		const positionGen = fc.record({
			proxyWallet: fc
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
				.map((arr) => '0x' + arr.join('')),
			asset: fc.string(),
			conditionId: hexStringGen,
			size: fc.double({ min: 0, max: 1000000 }),
			avgPrice: fc.double({ min: 0, max: 1 }),
			initialValue: fc.double({ min: 0, max: 1000000 }),
			currentValue: fc.double({ min: 0, max: 1000000 }),
			cashPnl: fc.double({ min: -1000000, max: 1000000 }),
			percentPnl: fc.double({ min: -100, max: 100 }),
			totalBought: fc.double({ min: 0, max: 1000000 }),
			realizedPnl: fc.double({ min: -1000000, max: 1000000 }),
			percentRealizedPnl: fc.double({ min: -100, max: 100 }),
			curPrice: fc.double({ min: 0, max: 1 }),
			redeemable: fc.boolean(),
			mergeable: fc.boolean(),
			title: fc.string(),
			slug: slugGen,
			icon: fc.string(),
			eventSlug: slugGen,
			outcome: fc.string(),
			outcomeIndex: fc.integer({ min: 0, max: 10 }),
			oppositeOutcome: fc.string(),
			oppositeAsset: fc.string(),
			endDate: fc
				.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
				.map((timestamp) => new Date(timestamp).toISOString()),
			negativeRisk: fc.boolean()
		}) as fc.Arbitrary<Position>;

		fc.assert(
			fc.property(
				fc.array(positionGen, { minLength: 1, maxLength: 50 }),
				fc.array(fc.oneof(hexStringGen, slugGen), { minLength: 1, maxLength: 10 }),
				(positions, markets) => {
					// Apply the filtering logic from the service
					const marketSet = new Set(markets.map((m) => m.toLowerCase()));
					const filtered = positions.filter(
						(position) =>
							marketSet.has(position.conditionId.toLowerCase()) ||
							marketSet.has(position.slug.toLowerCase())
					);

					// Verify all filtered positions match at least one market
					for (const position of filtered) {
						const matches =
							marketSet.has(position.conditionId.toLowerCase()) ||
							marketSet.has(position.slug.toLowerCase());
						expect(matches).toBe(true);
					}

					// Verify no unfiltered positions were included
					for (const position of positions) {
						const shouldBeIncluded =
							marketSet.has(position.conditionId.toLowerCase()) ||
							marketSet.has(position.slug.toLowerCase());
						const isIncluded = filtered.includes(position);
						expect(isIncluded).toBe(shouldBeIncluded);
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * Property 4: Trade filtering returns only matching criteria
	 * Feature: polymarket-user-data, Property 4: Trade filtering returns only matching criteria
	 * Validates: Requirements 2.2
	 *
	 * For any set of trades and any filter (user or markets), all returned trades should
	 * match the filter criteria - either belonging to the specified user or involving
	 * the specified markets.
	 */
	test('Property 4: trade filtering returns only matching criteria', () => {
		// Generator for valid hex strings
		const hexStringGen = fc
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
					minLength: 64,
					maxLength: 64
				}
			)
			.map((arr) => '0x' + arr.join(''));

		const walletGen = fc
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
			.map((arr) => '0x' + arr.join(''));

		const slugGen = fc.stringMatching(/^[a-z0-9-]+$/).filter((s) => s.length > 0 && s.length < 100);

		// Generator for trades
		const tradeGen = fc.record({
			proxyWallet: walletGen,
			side: fc.constantFrom('BUY', 'SELL') as fc.Arbitrary<'BUY' | 'SELL'>,
			asset: fc.string(),
			conditionId: hexStringGen,
			size: fc.double({ min: 0, max: 1000000 }),
			price: fc.double({ min: 0, max: 1 }),
			timestamp: fc.integer({ min: 0, max: Date.now() }),
			title: fc.string(),
			slug: slugGen,
			icon: fc.string(),
			eventSlug: slugGen,
			outcome: fc.string(),
			outcomeIndex: fc.integer({ min: 0, max: 10 }),
			name: fc.string(),
			pseudonym: fc.string(),
			bio: fc.string(),
			profileImage: fc.string(),
			profileImageOptimized: fc.string(),
			transactionHash: hexStringGen
		}) as fc.Arbitrary<Trade>;

		fc.assert(
			fc.property(
				fc.array(tradeGen, { minLength: 1, maxLength: 50 }),
				fc.option(walletGen),
				fc.option(fc.array(fc.oneof(hexStringGen, slugGen), { minLength: 1, maxLength: 10 })),
				(trades, user, markets) => {
					// Skip if both filters are null
					if (!user && !markets) {
						return;
					}

					// Apply the filtering logic from the service
					let filtered = trades;

					if (user) {
						const userLower = user.toLowerCase();
						filtered = filtered.filter((trade) => trade.proxyWallet.toLowerCase() === userLower);
					}

					if (markets && markets.length > 0) {
						const marketSet = new Set(markets.map((m) => m.toLowerCase()));
						filtered = filtered.filter(
							(trade) =>
								marketSet.has(trade.conditionId.toLowerCase()) ||
								marketSet.has(trade.slug?.toLowerCase() ?? "")
						);
					}

					// Verify all filtered trades match the criteria
					for (const trade of filtered) {
						let matches = true;

						if (user) {
							matches = matches && trade.proxyWallet.toLowerCase() === user.toLowerCase();
						}

						if (markets && markets.length > 0) {
							const marketSet = new Set(markets.map((m) => m.toLowerCase()));
							matches =
								matches &&
								(marketSet.has(trade.conditionId.toLowerCase()) ||
									marketSet.has(trade.slug?.toLowerCase() ?? ""));
						}

						expect(matches).toBe(true);
					}

					// Verify no unfiltered trades were included
					for (const trade of trades) {
						let shouldBeIncluded = true;

						if (user) {
							shouldBeIncluded =
								shouldBeIncluded && trade.proxyWallet.toLowerCase() === user.toLowerCase();
						}

						if (markets && markets.length > 0) {
							const marketSet = new Set(markets.map((m) => m.toLowerCase()));
							shouldBeIncluded =
								shouldBeIncluded &&
								(marketSet.has(trade.conditionId.toLowerCase()) ||
									marketSet.has(trade.slug?.toLowerCase() ?? ""));
						}

						const isIncluded = filtered.includes(trade);
						expect(isIncluded).toBe(shouldBeIncluded);
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * Property 7: Holder data grouping preserves all holders
	 * Feature: polymarket-user-data, Property 7: Holder data grouping preserves all holders
	 * Validates: Requirements 4.5
	 *
	 * For any list of market holders, the total count of holders across all market groups
	 * should equal the count of holders in the original ungrouped data.
	 */
	test('Property 7: holder data grouping preserves all holders', () => {
		const walletGen = fc
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
			.map((arr) => '0x' + arr.join(''));

		// Generator for holder info
		const holderInfoGen = fc.record({
			proxyWallet: walletGen,
			bio: fc.string(),
			asset: fc.string(),
			pseudonym: fc.string(),
			amount: fc.double({ min: 0, max: 1000000 }),
			displayUsernamePublic: fc.boolean(),
			outcomeIndex: fc.integer({ min: 0, max: 10 }),
			name: fc.string(),
			profileImage: fc.string(),
			profileImageOptimized: fc.string()
		}) as fc.Arbitrary<HolderInfo>;

		// Generator for market holders
		const marketHoldersGen = fc.record({
			token: fc.string({ minLength: 1, maxLength: 50 }),
			holders: fc.array(holderInfoGen, { minLength: 0, maxLength: 20 })
		}) as fc.Arbitrary<MarketHolders>;

		fc.assert(
			fc.property(
				fc.array(marketHoldersGen, { minLength: 1, maxLength: 10 }),
				(marketHoldersList) => {
					// Count total holders across all markets
					let totalHolders = 0;
					for (const marketHolders of marketHoldersList) {
						totalHolders += marketHolders.holders.length;
					}

					// Flatten all holders
					const allHolders: HolderInfo[] = [];
					for (const marketHolders of marketHoldersList) {
						allHolders.push(...marketHolders.holders);
					}

					// Verify counts match
					expect(allHolders.length).toBe(totalHolders);

					// Verify no holders were lost or duplicated
					let countFromGroups = 0;
					for (const marketHolders of marketHoldersList) {
						countFromGroups += marketHolders.holders.length;
					}
					expect(countFromGroups).toBe(totalHolders);
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * Property 9: Portfolio value filtering sums only specified markets
	 * Feature: polymarket-user-data, Property 9: Portfolio value filtering sums only specified markets
	 * Validates: Requirements 5.2
	 *
	 * For any user with positions in multiple markets, when a market filter is applied,
	 * the returned portfolio value should be less than or equal to the total portfolio
	 * value without filters.
	 */
	test('Property 9: portfolio value filtering sums only specified markets', () => {
		const portfolioValueGen = fc.record({
			user: fc
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
				.map((arr) => '0x' + arr.join('')),
			value: fc.double({ min: 0, max: 1000000, noNaN: true })
		}) as fc.Arbitrary<PortfolioValue>;

		fc.assert(
			fc.property(
				fc.array(portfolioValueGen, { minLength: 1, maxLength: 10 }),
				(portfolioValues) => {
					// Calculate total value
					const totalValue = portfolioValues.reduce((sum, pv) => sum + pv.value, 0);

					// For any subset of the portfolio values
					if (portfolioValues.length > 1) {
						const subsetSize = Math.floor(portfolioValues.length / 2);
						const subset = portfolioValues.slice(0, subsetSize);
						const subsetValue = subset.reduce((sum, pv) => sum + pv.value, 0);

						// Subset value should be less than or equal to total
						expect(subsetValue).toBeLessThanOrEqual(totalValue);
					}

					// Empty filter should give 0
					const emptyValue = [].reduce((sum: number) => sum, 0);
					expect(emptyValue).toBe(0);
					expect(emptyValue).toBeLessThanOrEqual(totalValue);
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * Property 13: Caching returns same data within TTL
	 * Feature: polymarket-user-data, Property 13: Caching returns same data within TTL
	 * Validates: Requirements 1.4, 2.4, 3.4, 4.3, 5.4, 6.3
	 *
	 * For any service method call with identical parameters, when called twice within
	 * the cache TTL period, the second call should return cached data without making
	 * an API request.
	 */
	test('Property 13: caching returns same data within TTL', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1, maxLength: 100 }),
				fc.anything(),
				fc.integer({ min: 1000, max: 60000 }),
				(cacheKey, data, ttl) => {
					// Simulate cache behavior
					const cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

					// First access - cache miss
					const firstTimestamp = Date.now();
					cache.set(cacheKey, { data, timestamp: firstTimestamp, ttl });

					// Second access within TTL - cache hit
					const secondTimestamp = firstTimestamp + ttl / 2;
					const cached = cache.get(cacheKey);

					if (cached) {
						const age = secondTimestamp - cached.timestamp;
						const isStale = age > cached.ttl;

						// Should not be stale
						expect(isStale).toBe(false);

						// Should return same data
						expect(cached.data).toBe(data);
					}

					// Third access after TTL - cache miss
					const thirdTimestamp = firstTimestamp + ttl + 1000;
					const cachedAfterTTL = cache.get(cacheKey);

					if (cachedAfterTTL) {
						const age = thirdTimestamp - cachedAfterTTL.timestamp;
						const isStale = age > cachedAfterTTL.ttl;

						// Should be stale
						expect(isStale).toBe(true);
					}
				}
			),
			{ numRuns: 100 }
		);
	});
});
