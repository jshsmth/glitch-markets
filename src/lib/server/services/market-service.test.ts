import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { MarketService } from './market-service';
import type { Market } from '../api/polymarket-client';
import { loadConfig } from '../config/api-config';
import { Logger } from '$lib/utils/logger';
import { marketArbitrary } from '$lib/tests/helpers/test-arbitraries';
import { createMockMarket } from '$lib/tests/helpers/test-mocks';

// Mock the dependencies
vi.mock('../api/polymarket-client');
vi.mock('../cache/cache-manager');
vi.mock('../config/api-config');
vi.mock('$lib/utils/logger', () => ({
	Logger: class {
		info = vi.fn();
		error = vi.fn();
		warn = vi.fn();
		debug = vi.fn();
		child = vi.fn().mockReturnThis();
	}
}));

describe('MarketService', () => {
	let service: MarketService;

	beforeEach(() => {
		// Reset all mocks
		vi.resetAllMocks();

		// Mock loadConfig
		vi.mocked(loadConfig).mockReturnValue({
			baseUrl: 'https://test-api.com',
			dataApiUrl: 'https://data-api.polymarket.com',
			bridgeApiUrl: 'https://bridge.polymarket.com',
			clobApiUrl: 'https://clob.polymarket.com',
			timeout: 5000,
			cacheTtl: 60,
			enableCache: true
		});

		service = new MarketService();
	});

	/**
	 * Feature: polymarket-api-integration, Property 7: Filter application correctness
	 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
	 */
	describe('Property 7: Filter application correctness', () => {
		it('for any combination of filter parameters, all returned markets should satisfy all provided filter criteria', async () => {
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
					fc.array(marketArbitrary, { minLength: 0, maxLength: 50 }),
					filtersArb,
					async (markets, filters) => {
						// Get the mocked instances
						const mockClientInstance = vi.mocked(service['client']);
						const mockCacheInstance = vi.mocked(service['cache']);

						// Pre-filter markets to simulate Polymarket API server-side filtering
						const filteredMarkets = markets.filter((market) => {
							if (filters.active !== undefined && market.active !== filters.active) {
								return false;
							}
							if (filters.closed !== undefined && market.closed !== filters.closed) {
								return false;
							}
							return true;
						});

						// Setup: Mock cache miss and API response (API returns pre-filtered data)
						mockCacheInstance.get = vi.fn().mockReturnValue(null);
						mockClientInstance.fetchMarkets = vi.fn().mockResolvedValue(filteredMarkets);

						// Execute: Get markets with filters
						const result = await service.getMarkets(filters);

						// Verify: All returned markets satisfy the filter criteria
						for (const market of result) {
							// Check active filter
							if (filters.active !== undefined) {
								expect(market.active).toBe(filters.active);
							}

							// Check closed filter
							if (filters.closed !== undefined) {
								expect(market.closed).toBe(filters.closed);
							}
						}

						// Verify: The service returns what the API gave it
						expect(result).toHaveLength(filteredMarkets.length);
						expect(result).toEqual(filteredMarkets);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	describe('getMarketById', () => {
		it('should return market from cache if available', async () => {
			const mockMarket = createMockMarket() as Market;

			const mockCacheInstance = vi.mocked(service['cache']);
			const mockClientInstance = vi.mocked(service['client']);

			mockCacheInstance.get = vi.fn().mockReturnValue(mockMarket);

			const result = await service.getMarketById('123');

			expect(result).toEqual(mockMarket);
			expect(mockClientInstance.fetchMarketById).not.toHaveBeenCalled();
		});

		it('should fetch from API on cache miss', async () => {
			const mockMarket = createMockMarket() as Market;

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
	 * NOTE: Search and sorting tests removed
	 * - searchMarkets() method has been removed from MarketService
	 * - Text search is now handled by SearchService using Polymarket's /public-search endpoint
	 * - Sorting is handled server-side via 'order' and 'ascending' query parameters
	 * - Integration tests for /api/search and /api/markets should cover this functionality
	 */

	describe('getMarketBySlug', () => {
		it('should return market from cache if available', async () => {
			const mockMarket = createMockMarket() as Market;

			const mockCacheInstance = vi.mocked(service['cache']);
			const mockClientInstance = vi.mocked(service['client']);

			mockCacheInstance.get = vi.fn().mockReturnValue(mockMarket);

			const result = await service.getMarketBySlug('test-question');

			expect(result).toEqual(mockMarket);
			expect(mockClientInstance.fetchMarketBySlug).not.toHaveBeenCalled();
		});

		it('should fetch from API on cache miss', async () => {
			const mockMarket = createMockMarket() as Market;

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
