import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { MarketService } from './market-service';
import type { Market } from '../api/polymarket-client';
import { loadConfig } from '../config/api-config';
import { Logger } from '../utils/logger';

// Mock the dependencies
vi.mock('../api/polymarket-client');
vi.mock('../cache/cache-manager');
vi.mock('../config/api-config');
vi.mock('../utils/logger');

describe('MarketService', () => {
	let service: MarketService;

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Mock loadConfig
		vi.mocked(loadConfig).mockReturnValue({
			baseUrl: 'https://test-api.com',
			dataApiUrl: 'https://data-api.polymarket.com',
			bridgeApiUrl: 'https://bridge.polymarket.com',
			timeout: 5000,
			cacheTtl: 60,
			enableCache: true
		});

		// Mock Logger constructor
		vi.mocked(Logger).mockImplementation(function (this: unknown) {
			return {
				info: vi.fn(),
				error: vi.fn(),
				warn: vi.fn(),
				debug: vi.fn()
			} as never;
		} as never);

		service = new MarketService();
	});

	/**
	 * Feature: polymarket-api-integration, Property 7: Filter application correctness
	 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
	 */
	describe('Property 7: Filter application correctness', () => {
		it('for any combination of filter parameters, all returned markets should satisfy all provided filter criteria', async () => {
			// Generator for market data
			const marketArb = fc.record({
				id: fc.string({ minLength: 1 }),
				question: fc.string({ minLength: 1 }),
				conditionId: fc.string(),
				slug: fc.string({ minLength: 1 }),
				endDate: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				category: fc.oneof(
					fc.constant('crypto'),
					fc.constant('sports'),
					fc.constant('politics'),
					fc.constant('entertainment')
				),
				liquidity: fc.float({ min: 0, max: 10000, noNaN: true }).map(String),
				image: fc.webUrl(),
				icon: fc.webUrl(),
				description: fc.string(),
				outcomes: fc.array(fc.string(), { minLength: 2, maxLength: 2 }),
				outcomePrices: fc.array(fc.float({ min: 0, max: 1, noNaN: true }).map(String), {
					minLength: 2,
					maxLength: 2
				}),
				volume: fc.float({ min: 0, max: 10000, noNaN: true }).map(String),
				active: fc.boolean(),
				marketType: fc.oneof(fc.constant('normal' as const), fc.constant('scalar' as const)),
				closed: fc.boolean(),
				volumeNum: fc.float({ min: 0, max: 10000, noNaN: true }),
				liquidityNum: fc.float({ min: 0, max: 10000, noNaN: true }),
				volume24hr: fc.float({ min: 0, max: 10000, noNaN: true }),
				volume1wk: fc.float({ min: 0, max: 10000, noNaN: true }),
				volume1mo: fc.float({ min: 0, max: 10000, noNaN: true }),
				lastTradePrice: fc.float({ min: 0, max: 1, noNaN: true }),
				bestBid: fc.float({ min: 0, max: 1, noNaN: true }),
				bestAsk: fc.float({ min: 0, max: 1, noNaN: true })
			});

			// Generator for filter parameters
			const filtersArb = fc.record({
				category: fc.option(
					fc.oneof(
						fc.constant('crypto'),
						fc.constant('sports'),
						fc.constant('politics'),
						fc.constant('entertainment')
					),
					{ nil: undefined }
				),
				active: fc.option(fc.boolean(), { nil: undefined }),
				closed: fc.option(fc.boolean(), { nil: undefined }),
				limit: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
				offset: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined })
			});

			await fc.assert(
				fc.asyncProperty(
					fc.array(marketArb, { minLength: 0, maxLength: 50 }),
					filtersArb,
					async (markets, filters) => {
						// Get the mocked instances
						const mockClientInstance = vi.mocked(service['client']);
						const mockCacheInstance = vi.mocked(service['cache']);

						// Setup: Mock cache miss and API response
						mockCacheInstance.get = vi.fn().mockReturnValue(null);
						mockClientInstance.fetchMarkets = vi.fn().mockResolvedValue(markets);

						// Execute: Get markets with filters
						const result = await service.getMarkets(filters);

						// Verify: All returned markets satisfy the filter criteria
						for (const market of result) {
							// Check category filter
							if (filters.category !== undefined) {
								expect(market.category).toBe(filters.category);
							}

							// Check active filter
							if (filters.active !== undefined) {
								expect(market.active).toBe(filters.active);
							}

							// Check closed filter
							if (filters.closed !== undefined) {
								expect(market.closed).toBe(filters.closed);
							}
						}

						// Verify: All markets that match the filters are included
						const expectedMarkets = markets.filter((market) => {
							if (filters.category !== undefined && market.category !== filters.category) {
								return false;
							}
							if (filters.active !== undefined && market.active !== filters.active) {
								return false;
							}
							if (filters.closed !== undefined && market.closed !== filters.closed) {
								return false;
							}
							return true;
						});

						expect(result).toHaveLength(expectedMarkets.length);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	describe('getMarketById', () => {
		it('should return market from cache if available', async () => {
			const mockMarket: Market = {
				id: '123',
				question: 'Test question?',
				conditionId: 'cond123',
				slug: 'test-question',
				endDate: '2024-12-31T00:00:00Z',
				category: 'crypto',
				liquidity: '1000',
				image: 'https://example.com/image.png',
				icon: 'https://example.com/icon.png',
				description: 'Test description',
				outcomes: ['Yes', 'No'],
				outcomePrices: ['0.5', '0.5'],
				volume: '5000',
				active: true,
				marketType: 'normal',
				closed: false,
				volumeNum: 5000,
				liquidityNum: 1000,
				volume24hr: 100,
				volume1wk: 500,
				volume1mo: 2000,
				lastTradePrice: 0.5,
				bestBid: 0.49,
				bestAsk: 0.51
			};

			const mockCacheInstance = vi.mocked(service['cache']);
			const mockClientInstance = vi.mocked(service['client']);

			mockCacheInstance.get = vi.fn().mockReturnValue(mockMarket);

			const result = await service.getMarketById('123');

			expect(result).toEqual(mockMarket);
			expect(mockClientInstance.fetchMarketById).not.toHaveBeenCalled();
		});

		it('should fetch from API on cache miss', async () => {
			const mockMarket: Market = {
				id: '123',
				question: 'Test question?',
				conditionId: 'cond123',
				slug: 'test-question',
				endDate: '2024-12-31T00:00:00Z',
				category: 'crypto',
				liquidity: '1000',
				image: 'https://example.com/image.png',
				icon: 'https://example.com/icon.png',
				description: 'Test description',
				outcomes: ['Yes', 'No'],
				outcomePrices: ['0.5', '0.5'],
				volume: '5000',
				active: true,
				marketType: 'normal',
				closed: false,
				volumeNum: 5000,
				liquidityNum: 1000,
				volume24hr: 100,
				volume1wk: 500,
				volume1mo: 2000,
				lastTradePrice: 0.5,
				bestBid: 0.49,
				bestAsk: 0.51
			};

			const mockCacheInstance = vi.mocked(service['cache']);
			const mockClientInstance = vi.mocked(service['client']);

			mockCacheInstance.get = vi.fn().mockReturnValue(null);
			mockCacheInstance.set = vi.fn();
			mockClientInstance.fetchMarketById = vi.fn().mockResolvedValue(mockMarket);

			const result = await service.getMarketById('123');

			expect(result).toEqual(mockMarket);
			expect(mockClientInstance.fetchMarketById).toHaveBeenCalledWith('123');
			expect(mockCacheInstance.set).toHaveBeenCalled();
		});

		it('should return null for 404 errors', async () => {
			const mockCacheInstance = vi.mocked(service['cache']);
			const mockClientInstance = vi.mocked(service['client']);

			mockCacheInstance.get = vi.fn().mockReturnValue(null);
			mockClientInstance.fetchMarketById = vi.fn().mockRejectedValue({ statusCode: 404 });

			const result = await service.getMarketById('nonexistent');

			expect(result).toBeNull();
		});
	});

	/**
	 * Feature: polymarket-api-integration, Property 13: Search result accuracy
	 * Validates: Requirements 6.1, 6.2, 6.4, 6.5
	 */
	describe('Property 13: Search result accuracy', () => {
		it('for any search query, all returned markets should contain the query text (case-insensitive) and all matching markets should be returned', async () => {
			// Generator for market data
			const marketArb = fc.record({
				id: fc.string({ minLength: 1 }),
				question: fc.string({ minLength: 1 }),
				conditionId: fc.string(),
				slug: fc.string({ minLength: 1 }),
				endDate: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				category: fc.oneof(
					fc.constant('crypto'),
					fc.constant('sports'),
					fc.constant('politics'),
					fc.constant('entertainment')
				),
				liquidity: fc.float({ min: 0 }).map(String),
				image: fc.webUrl(),
				icon: fc.webUrl(),
				description: fc.string(),
				outcomes: fc.array(fc.string(), { minLength: 2, maxLength: 2 }),
				outcomePrices: fc.array(fc.float({ min: 0, max: 1 }).map(String), {
					minLength: 2,
					maxLength: 2
				}),
				volume: fc.float({ min: 0 }).map(String),
				active: fc.boolean(),
				marketType: fc.oneof(fc.constant('normal' as const), fc.constant('scalar' as const)),
				closed: fc.boolean(),
				volumeNum: fc.float({ min: 0 }),
				liquidityNum: fc.float({ min: 0 }),
				volume24hr: fc.float({ min: 0 }),
				volume1wk: fc.float({ min: 0 }),
				volume1mo: fc.float({ min: 0 }),
				lastTradePrice: fc.float({ min: 0, max: 1 }),
				bestBid: fc.float({ min: 0, max: 1 }),
				bestAsk: fc.float({ min: 0, max: 1 })
			});

			// Generator for search query - use a word that might appear in questions
			const searchQueryArb = fc.oneof(
				fc.constant('bitcoin'),
				fc.constant('election'),
				fc.constant('will'),
				fc.constant('price'),
				fc.constant('win'),
				fc.string({ minLength: 1, maxLength: 10 })
			);

			await fc.assert(
				fc.asyncProperty(
					fc.array(marketArb, { minLength: 0, maxLength: 50 }),
					searchQueryArb,
					async (markets, query) => {
						// Get the mocked instances
						const mockClientInstance = vi.mocked(service['client']);
						const mockCacheInstance = vi.mocked(service['cache']);

						// Setup: Mock cache miss and API response
						mockCacheInstance.get = vi.fn().mockReturnValue(null);
						mockClientInstance.fetchMarkets = vi.fn().mockResolvedValue(markets);

						// Execute: Search markets with query
						const result = await service.searchMarkets({ query });

						// Verify: All returned markets contain the query text (case-insensitive)
						const queryLower = query.toLowerCase();
						for (const market of result) {
							expect(market.question?.toLowerCase()).toContain(queryLower);
						}

						// Verify: All markets that match the query are included
						const expectedMatches = markets.filter((market) =>
							market.question?.toLowerCase().includes(queryLower)
						);

						expect(result).toHaveLength(expectedMatches.length);

						// Verify: The results contain the same markets as expected
						const resultIds = result.map((m) => m.id).sort();
						const expectedIds = expectedMatches.map((m) => m.id).sort();
						expect(resultIds).toEqual(expectedIds);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: polymarket-api-integration, Property 14: Sort order correctness
	 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
	 */
	describe('Property 14: Sort order correctness', () => {
		it('for any sort parameter and sort order, the returned markets should be sorted correctly by the specified field in the specified direction', async () => {
			// Generator for market data
			const marketArb = fc.record({
				id: fc.string({ minLength: 1 }),
				question: fc.string({ minLength: 1 }),
				conditionId: fc.string(),
				slug: fc.string({ minLength: 1 }),
				endDate: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				category: fc.oneof(
					fc.constant('crypto'),
					fc.constant('sports'),
					fc.constant('politics'),
					fc.constant('entertainment')
				),
				liquidity: fc.float({ min: 0, max: 10000, noNaN: true }).map(String),
				image: fc.webUrl(),
				icon: fc.webUrl(),
				description: fc.string(),
				outcomes: fc.array(fc.string(), { minLength: 2, maxLength: 2 }),
				outcomePrices: fc.array(fc.float({ min: 0, max: 1, noNaN: true }).map(String), {
					minLength: 2,
					maxLength: 2
				}),
				volume: fc.float({ min: 0, max: 10000, noNaN: true }).map(String),
				active: fc.boolean(),
				marketType: fc.oneof(fc.constant('normal' as const), fc.constant('scalar' as const)),
				closed: fc.boolean(),
				volumeNum: fc.float({ min: 0, max: 10000, noNaN: true }),
				liquidityNum: fc.float({ min: 0, max: 10000, noNaN: true }),
				volume24hr: fc.float({ min: 0, max: 10000, noNaN: true }),
				volume1wk: fc.float({ min: 0, max: 10000, noNaN: true }),
				volume1mo: fc.float({ min: 0, max: 10000, noNaN: true }),
				lastTradePrice: fc.float({ min: 0, max: 1, noNaN: true }),
				bestBid: fc.float({ min: 0, max: 1, noNaN: true }),
				bestAsk: fc.float({ min: 0, max: 1, noNaN: true })
			});

			// Generator for sort options
			const sortByArb = fc.oneof(
				fc.constant('volume' as const),
				fc.constant('liquidity' as const),
				fc.constant('createdAt' as const)
			);

			const sortOrderArb = fc.oneof(fc.constant('asc' as const), fc.constant('desc' as const));

			await fc.assert(
				fc.asyncProperty(
					fc.array(marketArb, { minLength: 2, maxLength: 50 }),
					sortByArb,
					sortOrderArb,
					async (markets, sortBy, sortOrder) => {
						// Get the mocked instances
						const mockClientInstance = vi.mocked(service['client']);
						const mockCacheInstance = vi.mocked(service['cache']);

						// Setup: Mock cache miss and API response
						mockCacheInstance.get = vi.fn().mockReturnValue(null);
						mockClientInstance.fetchMarkets = vi.fn().mockResolvedValue(markets);

						// Execute: Search markets with sorting
						const result = await service.searchMarkets({ sortBy, sortOrder });

						// Verify: Results are sorted correctly
						for (let i = 0; i < result.length - 1; i++) {
							const current = result[i];
							const next = result[i + 1];

							let currentValue: number;
							let nextValue: number;

							switch (sortBy) {
								case 'volume':
									currentValue = current.volumeNum ?? 0;
									nextValue = next.volumeNum ?? 0;
									break;
								case 'liquidity':
									currentValue = current.liquidityNum ?? 0;
									nextValue = next.liquidityNum ?? 0;
									break;
								case 'createdAt':
									currentValue = current.endDate ? new Date(current.endDate).getTime() : 0;
									nextValue = next.endDate ? new Date(next.endDate).getTime() : 0;
									break;
							}

							if (sortOrder === 'asc') {
								// For ascending order, current should be <= next
								expect(currentValue).toBeLessThanOrEqual(nextValue);
							} else {
								// For descending order, current should be >= next
								expect(currentValue).toBeGreaterThanOrEqual(nextValue);
							}
						}
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	describe('getMarketBySlug', () => {
		it('should return market from cache if available', async () => {
			const mockMarket: Market = {
				id: '123',
				question: 'Test question?',
				conditionId: 'cond123',
				slug: 'test-question',
				endDate: '2024-12-31T00:00:00Z',
				category: 'crypto',
				liquidity: '1000',
				image: 'https://example.com/image.png',
				icon: 'https://example.com/icon.png',
				description: 'Test description',
				outcomes: ['Yes', 'No'],
				outcomePrices: ['0.5', '0.5'],
				volume: '5000',
				active: true,
				marketType: 'normal',
				closed: false,
				volumeNum: 5000,
				liquidityNum: 1000,
				volume24hr: 100,
				volume1wk: 500,
				volume1mo: 2000,
				lastTradePrice: 0.5,
				bestBid: 0.49,
				bestAsk: 0.51
			};

			const mockCacheInstance = vi.mocked(service['cache']);
			const mockClientInstance = vi.mocked(service['client']);

			mockCacheInstance.get = vi.fn().mockReturnValue(mockMarket);

			const result = await service.getMarketBySlug('test-question');

			expect(result).toEqual(mockMarket);
			expect(mockClientInstance.fetchMarketBySlug).not.toHaveBeenCalled();
		});

		it('should fetch from API on cache miss', async () => {
			const mockMarket: Market = {
				id: '123',
				question: 'Test question?',
				conditionId: 'cond123',
				slug: 'test-question',
				endDate: '2024-12-31T00:00:00Z',
				category: 'crypto',
				liquidity: '1000',
				image: 'https://example.com/image.png',
				icon: 'https://example.com/icon.png',
				description: 'Test description',
				outcomes: ['Yes', 'No'],
				outcomePrices: ['0.5', '0.5'],
				volume: '5000',
				active: true,
				marketType: 'normal',
				closed: false,
				volumeNum: 5000,
				liquidityNum: 1000,
				volume24hr: 100,
				volume1wk: 500,
				volume1mo: 2000,
				lastTradePrice: 0.5,
				bestBid: 0.49,
				bestAsk: 0.51
			};

			const mockCacheInstance = vi.mocked(service['cache']);
			const mockClientInstance = vi.mocked(service['client']);

			mockCacheInstance.get = vi.fn().mockReturnValue(null);
			mockCacheInstance.set = vi.fn();
			mockClientInstance.fetchMarketBySlug = vi.fn().mockResolvedValue(mockMarket);

			const result = await service.getMarketBySlug('test-question');

			expect(result).toEqual(mockMarket);
			expect(mockClientInstance.fetchMarketBySlug).toHaveBeenCalledWith('test-question');
			expect(mockCacheInstance.set).toHaveBeenCalled();
		});

		it('should return null for 404 errors', async () => {
			const mockCacheInstance = vi.mocked(service['cache']);
			const mockClientInstance = vi.mocked(service['client']);

			mockCacheInstance.get = vi.fn().mockReturnValue(null);
			mockClientInstance.fetchMarketBySlug = vi.fn().mockRejectedValue({ statusCode: 404 });

			const result = await service.getMarketBySlug('nonexistent');

			expect(result).toBeNull();
		});
	});
});
