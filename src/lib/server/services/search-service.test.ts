/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { SearchService } from './search-service';
import type { SearchResults } from '../api/polymarket-client';
import { loadConfig } from '../config/api-config';

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

describe('SearchService', () => {
	let service: SearchService;

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

		service = new SearchService();
	});

	/**
	 * Feature: search-caching
	 * Property: Cache hit consistency - repeated identical searches return same cached data
	 */
	describe('Property: Cache hit consistency for search', () => {
		it('for any valid search options, consecutive requests with identical options should return cached results', async () => {
			// Generator for search options
			const optionsArb = fc.record({
				q: fc.string({ minLength: 1 }),
				eventsStatus: fc.option(fc.string(), { nil: undefined }),
				limitPerType: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
				page: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
				searchTags: fc.option(fc.boolean(), { nil: undefined }),
				searchProfiles: fc.option(fc.boolean(), { nil: undefined })
			});

			// Generator for search results
			const resultsArb = fc.record({
				events: fc.array(
					fc.record({
						id: fc.string(),
						title: fc.string(),
						slug: fc.string()
					})
				),
				tags: fc.array(
					fc.record({
						id: fc.string(),
						label: fc.string(),
						slug: fc.string()
					})
				),
				profiles: fc.array(
					fc.record({
						address: fc.string(),
						username: fc.string()
					})
				),
				pagination: fc.record({
					totalResults: fc.integer({ min: 0, max: 10000 }),
					hasMore: fc.boolean()
				})
			});

			await fc.assert(
				fc.asyncProperty(optionsArb, resultsArb, async (options, mockData) => {
					// Setup mock - get client and cache instances
					const mockClient = vi.mocked((service as any).client);
					const mockCache = vi.mocked((service as any).cache);

					mockCache.get = vi.fn().mockReturnValue(null);
					mockClient.fetchSearch = vi.fn().mockResolvedValue(mockData);

					// First call should hit API
					const result1 = await service.search(options);

					// Second call with identical options should use cache (return cached value)
					mockCache.get = vi.fn().mockReturnValue(mockData);
					const result2 = await service.search(options);

					// Verify API was only called once
					expect(mockClient.fetchSearch).toHaveBeenCalledTimes(1);

					// Verify both results are identical
					expect(result1).toEqual(result2);
					expect(result1).toEqual(mockData);
				}),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: search-cache-disabled
	 * Property: When cache is disabled, each request should hit the API
	 */
	describe('Property: Cache bypass when cache option is false', () => {
		it('requests with cache: false should always hit the API and not cache results', async () => {
			const mockClient = vi.mocked((service as any).client);
			const mockData: SearchResults = {
				events: [],
				tags: [],
				profiles: [],
				pagination: { totalResults: 0, hasMore: false }
			};

			mockClient.fetchSearch = vi.fn().mockResolvedValue(mockData);

			const options = { q: 'bitcoin', cache: false };

			// Make three requests with cache disabled
			await service.search(options);
			await service.search(options);
			await service.search(options);

			// API should be called three times (no caching)
			expect(mockClient.fetchSearch).toHaveBeenCalledTimes(3);
		});
	});

	/**
	 * Feature: search-cache-isolation
	 * Property: Different search queries produce different cache keys
	 */
	describe('Property: Cache isolation for different search queries', () => {
		it('requests with different queries should not share cached results', async () => {
			const mockClient = vi.mocked((service as any).client);

			const mockData1: SearchResults = {
				events: [],
				tags: [],
				profiles: [],
				pagination: { totalResults: 0, hasMore: false }
			};
			const mockData2: SearchResults = {
				events: [],
				tags: [],
				profiles: [],
				pagination: { totalResults: 0, hasMore: false }
			};

			mockClient.fetchSearch = vi
				.fn()
				.mockResolvedValueOnce(mockData1)
				.mockResolvedValueOnce(mockData2);

			// Request with query "bitcoin"
			const result1 = await service.search({ q: 'bitcoin' });

			// Request with query "ethereum" (different query)
			const result2 = await service.search({ q: 'ethereum' });

			// API should be called twice (different cache keys)
			expect(mockClient.fetchSearch).toHaveBeenCalledTimes(2);

			// Results should be different
			expect(result1).toEqual(mockData1);
			expect(result2).toEqual(mockData2);
		});

		it('requests with different limitPerType should not share cached results', async () => {
			const mockClient = vi.mocked((service as any).client);

			const mockData1: SearchResults = {
				events: [],
				tags: [],
				profiles: [],
				pagination: { totalResults: 0, hasMore: false }
			};
			const mockData2: SearchResults = {
				events: [],
				tags: [],
				profiles: [],
				pagination: { totalResults: 0, hasMore: false }
			};

			mockClient.fetchSearch = vi
				.fn()
				.mockResolvedValueOnce(mockData1)
				.mockResolvedValueOnce(mockData2);

			// Request with limit 10
			const result1 = await service.search({ q: 'test', limitPerType: 10 });

			// Request with limit 20 (different limit)
			const result2 = await service.search({ q: 'test', limitPerType: 20 });

			// API should be called twice (different cache keys)
			expect(mockClient.fetchSearch).toHaveBeenCalledTimes(2);

			// Results should be different
			expect(result1).toEqual(mockData1);
			expect(result2).toEqual(mockData2);
		});
	});

	/**
	 * Feature: search-request-deduplication
	 * Property: Concurrent identical search requests should only trigger one API call
	 */
	describe('Property: Request deduplication', () => {
		it('concurrent identical search requests should only call API once', async () => {
			const mockClient = vi.mocked((service as any).client);
			const mockData: SearchResults = {
				events: [],
				tags: [],
				profiles: [],
				pagination: { totalResults: 0, hasMore: false }
			};

			// Simulate slow API response
			mockClient.fetchSearch = vi
				.fn()
				.mockImplementation(
					() => new Promise((resolve) => setTimeout(() => resolve(mockData), 50))
				);

			const options = { q: 'test query' };

			// Fire 5 concurrent requests
			const results = await Promise.all([
				service.search(options),
				service.search(options),
				service.search(options),
				service.search(options),
				service.search(options)
			]);

			// API should only be called once
			expect(mockClient.fetchSearch).toHaveBeenCalledTimes(1);

			// All results should be identical
			results.forEach((result) => {
				expect(result).toEqual(mockData);
			});
		});
	});

	/**
	 * Feature: search-error-propagation
	 * Property: API errors should propagate correctly to callers
	 */
	describe('Property: Error propagation', () => {
		it('search API errors should propagate to caller', async () => {
			const mockClient = vi.mocked((service as any).client);
			const testError = new Error('API Error');

			mockClient.fetchSearch = vi.fn().mockRejectedValue(testError);

			await expect(service.search({ q: 'test' })).rejects.toThrow('API Error');
		});

		it('errors should propagate even when cache is disabled', async () => {
			const mockClient = vi.mocked((service as any).client);
			const testError = new Error('Server Error');

			mockClient.fetchSearch = vi.fn().mockRejectedValue(testError);

			await expect(service.search({ q: 'test', cache: false })).rejects.toThrow('Server Error');
		});
	});

	/**
	 * Feature: search-param-transformation
	 * Property: Service should correctly transform options to API params
	 */
	describe('Property: Correct param transformation', () => {
		it('should transform all search options to correct API params', async () => {
			const mockClient = vi.mocked((service as any).client);
			mockClient.fetchSearch = vi.fn().mockResolvedValue({
				events: [],
				tags: [],
				profiles: [],
				pagination: { totalResults: 0, hasMore: false }
			});

			await service.search({
				q: 'test',
				eventsStatus: 'active',
				limitPerType: 10,
				page: 1,
				eventsTags: ['crypto', 'sports'],
				keepClosedMarkets: 1,
				sort: 'volume',
				ascending: false,
				searchTags: true,
				searchProfiles: true,
				recurrence: 'weekly',
				excludeTagIds: [1, 2, 3],
				optimized: true
			});

			expect(mockClient.fetchSearch).toHaveBeenCalledWith({
				params: {
					q: 'test',
					events_status: 'active',
					limit_per_type: 10,
					page: 1,
					events_tag: ['crypto', 'sports'],
					keep_closed_markets: 1,
					sort: 'volume',
					ascending: false,
					search_tags: true,
					search_profiles: true,
					recurrence: 'weekly',
					exclude_tag_id: [1, 2, 3],
					optimized: true
				}
			});
		});
	});
});
