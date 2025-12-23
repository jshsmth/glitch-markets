import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { SeriesService } from './series-service';
import { loadConfig } from '../config/api-config';
import { Logger } from '../utils/logger';

// Mock the dependencies
vi.mock('../api/polymarket-client');
vi.mock('../cache/cache-manager');
vi.mock('../config/api-config');
vi.mock('../utils/logger');

describe('SeriesService', () => {
	let service: SeriesService;

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

		// Mock Logger constructor
		vi.mocked(Logger).mockImplementation(function (this: unknown) {
			return {
				info: vi.fn(),
				error: vi.fn(),
				warn: vi.fn(),
				debug: vi.fn()
			} as never;
		} as never);

		service = new SeriesService();
	});

	/**
	 * Feature: polymarket-series-api, Property 6: Cache hit prevents API calls
	 * Validates: Requirements 3.1, 3.2
	 */
	describe('Property 6: Cache hit prevents API calls', () => {
		it('for any series query with specific filters, if data is cached and not expired, subsequent identical requests should return cached data without making additional API calls', async () => {
			// Generator for series data
			const seriesArb = fc.record({
				id: fc.string({ minLength: 1 }),
				ticker: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 }),
				title: fc.string({ minLength: 1 }),
				subtitle: fc.option(fc.string(), { nil: null }),
				seriesType: fc.string(),
				recurrence: fc.string(),
				description: fc.string(),
				image: fc.option(fc.webUrl(), { nil: null }),
				icon: fc.option(fc.webUrl(), { nil: null }),
				layout: fc.string(),
				active: fc.boolean(),
				closed: fc.boolean(),
				archived: fc.boolean(),
				new: fc.boolean(),
				featured: fc.boolean(),
				restricted: fc.boolean(),
				isTemplate: fc.boolean(),
				templateVariables: fc.boolean(),
				publishedAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				createdBy: fc.string(),
				updatedBy: fc.string(),
				createdAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				updatedAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				commentsEnabled: fc.boolean(),
				competitive: fc.string(),
				volume24hr: fc.float({ min: 0, max: 10000, noNaN: true }),
				volume: fc.float({ min: 0, max: 10000, noNaN: true }),
				liquidity: fc.float({ min: 0, max: 10000, noNaN: true }),
				startDate: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				pythTokenID: fc.option(fc.string(), { nil: null }),
				cgAssetName: fc.option(fc.string(), { nil: null }),
				score: fc.float({ min: 0, max: 100, noNaN: true }),
				events: fc.array(fc.record({ id: fc.string() })),
				collections: fc.array(fc.record({ id: fc.string() })),
				categories: fc.array(
					fc.record({
						id: fc.string(),
						name: fc.oneof(
							fc.constant('crypto'),
							fc.constant('sports'),
							fc.constant('politics'),
							fc.constant('entertainment')
						)
					})
				),
				tags: fc.array(fc.record({ id: fc.string(), name: fc.string() })),
				commentCount: fc.integer({ min: 0, max: 1000 }),
				chats: fc.array(fc.record({ id: fc.string() }))
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
					fc.array(seriesArb, { minLength: 1, maxLength: 20 }),
					filtersArb,
					async (seriesData, filters) => {
						// Get the mocked instances
						const mockClientInstance = vi.mocked(service['client']);
						const mockCacheInstance = vi.mocked(service['cache']);

						// Setup: Mock cache behavior - first call miss, second call hit
						let callCount = 0;
						let cachedResult: unknown = null;

						mockCacheInstance.get = vi.fn().mockImplementation(() => {
							if (callCount === 0) {
								return null; // First call: cache miss
							}
							return cachedResult; // Second call: return what was cached
						});

						mockCacheInstance.set = vi.fn().mockImplementation((key, value) => {
							cachedResult = value; // Store what gets cached
						});

						mockClientInstance.fetchSeries = vi.fn().mockResolvedValue(seriesData);

						// Execute: First call (cache miss)
						const result1 = await service.getSeries(filters);
						callCount++;

						// Execute: Second call (cache hit)
						const result2 = await service.getSeries(filters);

						// Verify: API was called only once (on cache miss)
						expect(mockClientInstance.fetchSeries).toHaveBeenCalledTimes(1);

						// Verify: Both calls return the same data
						expect(result1).toEqual(result2);

						// Verify: Cache was set after first call
						expect(mockCacheInstance.set).toHaveBeenCalledTimes(1);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: polymarket-series-api, Property 7: Cache miss triggers fetch and store
	 * Validates: Requirements 3.3
	 */
	describe('Property 7: Cache miss triggers fetch and store', () => {
		it('for any series query with specific filters, if data is not cached, the system should fetch from the API and store the result in cache with the configured TTL', async () => {
			// Generator for series data
			const seriesArb = fc.record({
				id: fc.string({ minLength: 1 }),
				ticker: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 }),
				title: fc.string({ minLength: 1 }),
				subtitle: fc.option(fc.string(), { nil: null }),
				seriesType: fc.string(),
				recurrence: fc.string(),
				description: fc.string(),
				image: fc.option(fc.webUrl(), { nil: null }),
				icon: fc.option(fc.webUrl(), { nil: null }),
				layout: fc.string(),
				active: fc.boolean(),
				closed: fc.boolean(),
				archived: fc.boolean(),
				new: fc.boolean(),
				featured: fc.boolean(),
				restricted: fc.boolean(),
				isTemplate: fc.boolean(),
				templateVariables: fc.boolean(),
				publishedAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				createdBy: fc.string(),
				updatedBy: fc.string(),
				createdAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				updatedAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				commentsEnabled: fc.boolean(),
				competitive: fc.string(),
				volume24hr: fc.float({ min: 0, max: 10000, noNaN: true }),
				volume: fc.float({ min: 0, max: 10000, noNaN: true }),
				liquidity: fc.float({ min: 0, max: 10000, noNaN: true }),
				startDate: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				pythTokenID: fc.option(fc.string(), { nil: null }),
				cgAssetName: fc.option(fc.string(), { nil: null }),
				score: fc.float({ min: 0, max: 100, noNaN: true }),
				events: fc.array(fc.record({ id: fc.string() })),
				collections: fc.array(fc.record({ id: fc.string() })),
				categories: fc.array(
					fc.record({
						id: fc.string(),
						name: fc.oneof(
							fc.constant('crypto'),
							fc.constant('sports'),
							fc.constant('politics'),
							fc.constant('entertainment')
						)
					})
				),
				tags: fc.array(fc.record({ id: fc.string(), name: fc.string() })),
				commentCount: fc.integer({ min: 0, max: 1000 }),
				chats: fc.array(fc.record({ id: fc.string() }))
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
					fc.array(seriesArb, { minLength: 0, maxLength: 20 }),
					filtersArb,
					async (seriesData, filters) => {
						// Get the mocked instances
						const mockClientInstance = vi.mocked(service['client']);
						const mockCacheInstance = vi.mocked(service['cache']);

						// Setup: Mock cache miss
						mockCacheInstance.get = vi.fn().mockReturnValue(null);
						mockCacheInstance.set = vi.fn();
						mockClientInstance.fetchSeries = vi.fn().mockResolvedValue(seriesData);

						// Execute: Get series with cache miss
						const result = await service.getSeries(filters);

						// Verify: API was called
						expect(mockClientInstance.fetchSeries).toHaveBeenCalledTimes(1);

						// Verify: Cache was set with the result
						expect(mockCacheInstance.set).toHaveBeenCalledTimes(1);
						const setCalls = mockCacheInstance.set.mock.calls;
						expect(setCalls[0][0]).toContain('series:');
						expect(setCalls[0][2]).toBe(60000); // Default TTL

						// Verify: Result matches what was fetched
						expect(result).toBeDefined();
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: polymarket-series-api, Property 8: Cache stampede protection
	 * Validates: Requirements 3.4
	 */
	describe('Property 8: Cache stampede protection', () => {
		it('for any series query, if multiple concurrent requests are made for the same uncached data, only one API request should be made and all concurrent requests should receive the same result', async () => {
			// Generator for series data
			const seriesArb = fc.array(
				fc.record({
					id: fc.string({ minLength: 1 }),
					ticker: fc.string({ minLength: 1 }),
					slug: fc.string({ minLength: 1 }),
					title: fc.string({ minLength: 1 }),
					subtitle: fc.option(fc.string(), { nil: null }),
					seriesType: fc.string(),
					recurrence: fc.string(),
					description: fc.string(),
					image: fc.option(fc.webUrl(), { nil: null }),
					icon: fc.option(fc.webUrl(), { nil: null }),
					layout: fc.string(),
					active: fc.boolean(),
					closed: fc.boolean(),
					archived: fc.boolean(),
					new: fc.boolean(),
					featured: fc.boolean(),
					restricted: fc.boolean(),
					isTemplate: fc.boolean(),
					templateVariables: fc.boolean(),
					publishedAt: fc
						.integer({ min: 1577836800000, max: 1924905600000 })
						.map((timestamp) => new Date(timestamp).toISOString()),
					createdBy: fc.string(),
					updatedBy: fc.string(),
					createdAt: fc
						.integer({ min: 1577836800000, max: 1924905600000 })
						.map((timestamp) => new Date(timestamp).toISOString()),
					updatedAt: fc
						.integer({ min: 1577836800000, max: 1924905600000 })
						.map((timestamp) => new Date(timestamp).toISOString()),
					commentsEnabled: fc.boolean(),
					competitive: fc.string(),
					volume24hr: fc.float({ min: 0, max: 10000, noNaN: true }),
					volume: fc.float({ min: 0, max: 10000, noNaN: true }),
					liquidity: fc.float({ min: 0, max: 10000, noNaN: true }),
					startDate: fc
						.integer({ min: 1577836800000, max: 1924905600000 })
						.map((timestamp) => new Date(timestamp).toISOString()),
					pythTokenID: fc.option(fc.string(), { nil: null }),
					cgAssetName: fc.option(fc.string(), { nil: null }),
					score: fc.float({ min: 0, max: 100, noNaN: true }),
					events: fc.array(fc.record({ id: fc.string() })),
					collections: fc.array(fc.record({ id: fc.string() })),
					categories: fc.array(
						fc.record({
							id: fc.string(),
							name: fc.oneof(
								fc.constant('crypto'),
								fc.constant('sports'),
								fc.constant('politics'),
								fc.constant('entertainment')
							)
						})
					),
					tags: fc.array(fc.record({ id: fc.string(), name: fc.string() })),
					commentCount: fc.integer({ min: 0, max: 1000 }),
					chats: fc.array(fc.record({ id: fc.string() }))
				}),
				{ minLength: 0, maxLength: 10 }
			);

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
				closed: fc.option(fc.boolean(), { nil: undefined })
			});

			// Generator for number of concurrent requests
			const concurrentRequestsArb = fc.integer({ min: 2, max: 5 });

			await fc.assert(
				fc.asyncProperty(
					seriesArb,
					filtersArb,
					concurrentRequestsArb,
					async (seriesData, filters, numRequests) => {
						// Get the mocked instances
						const mockClientInstance = vi.mocked(service['client']);
						const mockCacheInstance = vi.mocked(service['cache']);

						// Setup: Mock cache miss and API response with delay
						mockCacheInstance.get = vi.fn().mockReturnValue(null);
						mockCacheInstance.set = vi.fn();
						mockClientInstance.fetchSeries = vi.fn().mockImplementation(async () => {
							// Add a small delay to simulate API call
							await new Promise((resolve) => setTimeout(resolve, 10));
							return seriesData;
						});

						// Execute: Make multiple concurrent requests
						const promises = Array.from({ length: numRequests }, () => service.getSeries(filters));
						const results = await Promise.all(promises);

						// Verify: API was called only once despite multiple concurrent requests
						expect(mockClientInstance.fetchSeries).toHaveBeenCalledTimes(1);

						// Verify: All requests received the same result
						for (let i = 1; i < results.length; i++) {
							expect(results[i]).toEqual(results[0]);
						}

						// Verify: Cache was set only once
						expect(mockCacheInstance.set).toHaveBeenCalledTimes(1);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: polymarket-series-api, Property 9: Filter application
	 * Validates: Requirements 4.1, 4.2, 4.3
	 */
	describe('Property 9: Filter application', () => {
		it('for any series dataset and filter parameters (category, active, closed), the filtered results should only include series that match all specified filter criteria', async () => {
			// Generator for series data
			const seriesArb = fc.record({
				id: fc.string({ minLength: 1 }),
				ticker: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 }),
				title: fc.string({ minLength: 1 }),
				subtitle: fc.option(fc.string(), { nil: null }),
				seriesType: fc.string(),
				recurrence: fc.string(),
				description: fc.string(),
				image: fc.option(fc.webUrl(), { nil: null }),
				icon: fc.option(fc.webUrl(), { nil: null }),
				layout: fc.string(),
				active: fc.boolean(),
				closed: fc.boolean(),
				archived: fc.boolean(),
				new: fc.boolean(),
				featured: fc.boolean(),
				restricted: fc.boolean(),
				isTemplate: fc.boolean(),
				templateVariables: fc.boolean(),
				publishedAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				createdBy: fc.string(),
				updatedBy: fc.string(),
				createdAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				updatedAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				commentsEnabled: fc.boolean(),
				competitive: fc.string(),
				volume24hr: fc.float({ min: 0, max: 10000, noNaN: true }),
				volume: fc.float({ min: 0, max: 10000, noNaN: true }),
				liquidity: fc.float({ min: 0, max: 10000, noNaN: true }),
				startDate: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				pythTokenID: fc.option(fc.string(), { nil: null }),
				cgAssetName: fc.option(fc.string(), { nil: null }),
				score: fc.float({ min: 0, max: 100, noNaN: true }),
				events: fc.array(fc.record({ id: fc.string() })),
				collections: fc.array(fc.record({ id: fc.string() })),
				categories: fc.array(
					fc.record({
						id: fc.string(),
						name: fc.oneof(
							fc.constant('crypto'),
							fc.constant('sports'),
							fc.constant('politics'),
							fc.constant('entertainment')
						)
					})
				),
				tags: fc.array(fc.record({ id: fc.string(), name: fc.string() })),
				commentCount: fc.integer({ min: 0, max: 1000 }),
				chats: fc.array(fc.record({ id: fc.string() }))
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
				closed: fc.option(fc.boolean(), { nil: undefined })
			});

			await fc.assert(
				fc.asyncProperty(
					fc.array(seriesArb, { minLength: 0, maxLength: 50 }),
					filtersArb,
					async (seriesData, filters) => {
						// Get the mocked instances
						const mockClientInstance = vi.mocked(service['client']);
						const mockCacheInstance = vi.mocked(service['cache']);

						// Setup: Mock cache miss and API response
						mockCacheInstance.get = vi.fn().mockReturnValue(null);
						mockClientInstance.fetchSeries = vi.fn().mockResolvedValue(seriesData);

						// Execute: Get series with filters
						const result = await service.getSeries(filters);

						// Verify: All returned series satisfy the filter criteria
						for (const series of result) {
							// Check category filter
							if (filters.category !== undefined) {
								const hasCategory = series.categories.some((cat) => cat.name === filters.category);
								expect(hasCategory).toBe(true);
							}

							// Check active filter
							if (filters.active !== undefined) {
								expect(series.active).toBe(filters.active);
							}

							// Check closed filter
							if (filters.closed !== undefined) {
								expect(series.closed).toBe(filters.closed);
							}
						}

						// Verify: All series that match the filters are included
						const expectedSeries = seriesData.filter((series) => {
							if (
								filters.category !== undefined &&
								!series.categories.some((cat) => cat.name === filters.category)
							) {
								return false;
							}
							if (filters.active !== undefined && series.active !== filters.active) {
								return false;
							}
							if (filters.closed !== undefined && series.closed !== filters.closed) {
								return false;
							}
							return true;
						});

						expect(result).toHaveLength(expectedSeries.length);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: polymarket-series-api, Property 10: Pagination correctness
	 * Validates: Requirements 4.4
	 */
	describe('Property 10: Pagination correctness', () => {
		it('for any series dataset and pagination parameters (limit, offset), the results should contain at most limit items starting from position offset in the dataset', async () => {
			// Generator for series data
			const seriesArb = fc.record({
				id: fc.string({ minLength: 1 }),
				ticker: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 }),
				title: fc.string({ minLength: 1 }),
				subtitle: fc.option(fc.string(), { nil: null }),
				seriesType: fc.string(),
				recurrence: fc.string(),
				description: fc.string(),
				image: fc.option(fc.webUrl(), { nil: null }),
				icon: fc.option(fc.webUrl(), { nil: null }),
				layout: fc.string(),
				active: fc.boolean(),
				closed: fc.boolean(),
				archived: fc.boolean(),
				new: fc.boolean(),
				featured: fc.boolean(),
				restricted: fc.boolean(),
				isTemplate: fc.boolean(),
				templateVariables: fc.boolean(),
				publishedAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				createdBy: fc.string(),
				updatedBy: fc.string(),
				createdAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				updatedAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				commentsEnabled: fc.boolean(),
				competitive: fc.string(),
				volume24hr: fc.float({ min: 0, max: 10000, noNaN: true }),
				volume: fc.float({ min: 0, max: 10000, noNaN: true }),
				liquidity: fc.float({ min: 0, max: 10000, noNaN: true }),
				startDate: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				pythTokenID: fc.option(fc.string(), { nil: null }),
				cgAssetName: fc.option(fc.string(), { nil: null }),
				score: fc.float({ min: 0, max: 100, noNaN: true }),
				events: fc.array(fc.record({ id: fc.string() })),
				collections: fc.array(fc.record({ id: fc.string() })),
				categories: fc.array(
					fc.record({
						id: fc.string(),
						name: fc.oneof(
							fc.constant('crypto'),
							fc.constant('sports'),
							fc.constant('politics'),
							fc.constant('entertainment')
						)
					})
				),
				tags: fc.array(fc.record({ id: fc.string(), name: fc.string() })),
				commentCount: fc.integer({ min: 0, max: 1000 }),
				chats: fc.array(fc.record({ id: fc.string() }))
			});

			await fc.assert(
				fc.asyncProperty(
					fc.integer({ min: 1, max: 20 }),
					fc.integer({ min: 0, max: 10 }),
					async (limit, offset) => {
						// Get the mocked instances
						const mockClientInstance = vi.mocked(service['client']);
						const mockCacheInstance = vi.mocked(service['cache']);

						// Generate paginated response from API (simulating what the API would return)
						const paginatedData = await fc.sample(
							fc.array(seriesArb, { minLength: 0, maxLength: limit }),
							1
						)[0];

						// Setup: Mock cache miss and API response with paginated data
						mockCacheInstance.get = vi.fn().mockReturnValue(null);
						mockClientInstance.fetchSeries = vi.fn().mockResolvedValue(paginatedData);

						// Execute: Get series with pagination
						const result = await service.getSeries({ limit, offset });

						// Verify: Result contains at most 'limit' items
						// The API is responsible for pagination, so we trust it returns the right amount
						expect(result.length).toBeLessThanOrEqual(limit);

						// Verify: The parameters are passed correctly to the API client
						expect(mockClientInstance.fetchSeries).toHaveBeenCalledWith({
							params: { limit, offset }
						});
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: polymarket-series-api, Property 14: ID lookup
	 * Validates: Requirements 6.2
	 */
	describe('Property 14: ID lookup', () => {
		it('for any valid ID, getSeriesById should return the matching series or null if not found', async () => {
			// Generator for series data
			const seriesArb = fc.record({
				id: fc.string({ minLength: 1 }),
				ticker: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 }),
				title: fc.string({ minLength: 1 }),
				subtitle: fc.option(fc.string(), { nil: null }),
				seriesType: fc.string(),
				recurrence: fc.string(),
				description: fc.string(),
				image: fc.option(fc.webUrl(), { nil: null }),
				icon: fc.option(fc.webUrl(), { nil: null }),
				layout: fc.string(),
				active: fc.boolean(),
				closed: fc.boolean(),
				archived: fc.boolean(),
				new: fc.boolean(),
				featured: fc.boolean(),
				restricted: fc.boolean(),
				isTemplate: fc.boolean(),
				templateVariables: fc.boolean(),
				publishedAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				createdBy: fc.string(),
				updatedBy: fc.string(),
				createdAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				updatedAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				commentsEnabled: fc.boolean(),
				competitive: fc.string(),
				volume24hr: fc.float({ min: 0, max: 10000, noNaN: true }),
				volume: fc.float({ min: 0, max: 10000, noNaN: true }),
				liquidity: fc.float({ min: 0, max: 10000, noNaN: true }),
				startDate: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				pythTokenID: fc.option(fc.string(), { nil: null }),
				cgAssetName: fc.option(fc.string(), { nil: null }),
				score: fc.float({ min: 0, max: 100, noNaN: true }),
				events: fc.array(fc.record({ id: fc.string() })),
				collections: fc.array(fc.record({ id: fc.string() })),
				categories: fc.array(
					fc.record({
						id: fc.string(),
						name: fc.oneof(
							fc.constant('crypto'),
							fc.constant('sports'),
							fc.constant('politics'),
							fc.constant('entertainment')
						)
					})
				),
				tags: fc.array(fc.record({ id: fc.string(), name: fc.string() })),
				commentCount: fc.integer({ min: 0, max: 1000 }),
				chats: fc.array(fc.record({ id: fc.string() }))
			});

			await fc.assert(
				fc.asyncProperty(seriesArb, async (seriesData) => {
					// Get the mocked instances
					const mockClientInstance = vi.mocked(service['client']);
					const mockCacheInstance = vi.mocked(service['cache']);

					// Setup: Mock cache miss
					mockCacheInstance.get = vi.fn().mockReturnValue(null);
					mockCacheInstance.set = vi.fn();

					// Test getSeriesById - successful case
					mockClientInstance.fetchSeriesById = vi.fn().mockResolvedValue(seriesData);
					const resultById = await service.getSeriesById(seriesData.id);

					// Verify: Result matches the series data
					expect(resultById).toEqual(seriesData);
					expect(mockClientInstance.fetchSeriesById).toHaveBeenCalledWith(seriesData.id);
					expect(mockCacheInstance.set).toHaveBeenCalledWith(
						`series:id:${seriesData.id}`,
						seriesData,
						60000
					);
				}),
				{ numRuns: 100 }
			);
		});

		it('should return null when series is not found (404)', async () => {
			// Generator for IDs
			const idArb = fc.string({ minLength: 1 });

			await fc.assert(
				fc.asyncProperty(idArb, async (id) => {
					// Get the mocked instances
					const mockClientInstance = vi.mocked(service['client']);
					const mockCacheInstance = vi.mocked(service['cache']);

					// Setup: Mock cache miss and 404 error
					mockCacheInstance.get = vi.fn().mockReturnValue(null);
					mockCacheInstance.set = vi.fn();

					// Test getSeriesById - 404 case
					const error404 = new Error('Not found');
					(error404 as unknown as { statusCode: number }).statusCode = 404;
					mockClientInstance.fetchSeriesById = vi.fn().mockRejectedValue(error404);

					const resultById = await service.getSeriesById(id);

					// Verify: Returns null for 404
					expect(resultById).toBeNull();
					expect(mockClientInstance.fetchSeriesById).toHaveBeenCalledWith(id);
					expect(mockCacheInstance.set).not.toHaveBeenCalled();
				}),
				{ numRuns: 100 }
			);
		});

		it('should use cache when available', async () => {
			// Generator for series data
			const seriesArb = fc.record({
				id: fc.string({ minLength: 1 }),
				ticker: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 }),
				title: fc.string({ minLength: 1 }),
				subtitle: fc.option(fc.string(), { nil: null }),
				seriesType: fc.string(),
				recurrence: fc.string(),
				description: fc.string(),
				image: fc.option(fc.webUrl(), { nil: null }),
				icon: fc.option(fc.webUrl(), { nil: null }),
				layout: fc.string(),
				active: fc.boolean(),
				closed: fc.boolean(),
				archived: fc.boolean(),
				new: fc.boolean(),
				featured: fc.boolean(),
				restricted: fc.boolean(),
				isTemplate: fc.boolean(),
				templateVariables: fc.boolean(),
				publishedAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				createdBy: fc.string(),
				updatedBy: fc.string(),
				createdAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				updatedAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				commentsEnabled: fc.boolean(),
				competitive: fc.string(),
				volume24hr: fc.float({ min: 0, max: 10000, noNaN: true }),
				volume: fc.float({ min: 0, max: 10000, noNaN: true }),
				liquidity: fc.float({ min: 0, max: 10000, noNaN: true }),
				startDate: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				pythTokenID: fc.option(fc.string(), { nil: null }),
				cgAssetName: fc.option(fc.string(), { nil: null }),
				score: fc.float({ min: 0, max: 100, noNaN: true }),
				events: fc.array(fc.record({ id: fc.string() })),
				collections: fc.array(fc.record({ id: fc.string() })),
				categories: fc.array(
					fc.record({
						id: fc.string(),
						name: fc.oneof(
							fc.constant('crypto'),
							fc.constant('sports'),
							fc.constant('politics'),
							fc.constant('entertainment')
						)
					})
				),
				tags: fc.array(fc.record({ id: fc.string(), name: fc.string() })),
				commentCount: fc.integer({ min: 0, max: 1000 }),
				chats: fc.array(fc.record({ id: fc.string() }))
			});

			await fc.assert(
				fc.asyncProperty(seriesArb, async (seriesData) => {
					// Get the mocked instances
					const mockClientInstance = vi.mocked(service['client']);
					const mockCacheInstance = vi.mocked(service['cache']);

					// Test getSeriesById with cache
					mockCacheInstance.get = vi.fn().mockReturnValue(seriesData);
					mockClientInstance.fetchSeriesById = vi.fn();

					const resultById = await service.getSeriesById(seriesData.id);

					// Verify: Returns cached data without calling API
					expect(resultById).toEqual(seriesData);
					expect(mockClientInstance.fetchSeriesById).not.toHaveBeenCalled();
				}),
				{ numRuns: 100 }
			);
		});

		it('should implement cache stampede protection for ID lookups', async () => {
			// Generator for series data
			const seriesArb = fc.record({
				id: fc.string({ minLength: 1 }),
				ticker: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 }),
				title: fc.string({ minLength: 1 }),
				subtitle: fc.option(fc.string(), { nil: null }),
				seriesType: fc.string(),
				recurrence: fc.string(),
				description: fc.string(),
				image: fc.option(fc.webUrl(), { nil: null }),
				icon: fc.option(fc.webUrl(), { nil: null }),
				layout: fc.string(),
				active: fc.boolean(),
				closed: fc.boolean(),
				archived: fc.boolean(),
				new: fc.boolean(),
				featured: fc.boolean(),
				restricted: fc.boolean(),
				isTemplate: fc.boolean(),
				templateVariables: fc.boolean(),
				publishedAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				createdBy: fc.string(),
				updatedBy: fc.string(),
				createdAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				updatedAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				commentsEnabled: fc.boolean(),
				competitive: fc.string(),
				volume24hr: fc.float({ min: 0, max: 10000, noNaN: true }),
				volume: fc.float({ min: 0, max: 10000, noNaN: true }),
				liquidity: fc.float({ min: 0, max: 10000, noNaN: true }),
				startDate: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				pythTokenID: fc.option(fc.string(), { nil: null }),
				cgAssetName: fc.option(fc.string(), { nil: null }),
				score: fc.float({ min: 0, max: 100, noNaN: true }),
				events: fc.array(fc.record({ id: fc.string() })),
				collections: fc.array(fc.record({ id: fc.string() })),
				categories: fc.array(
					fc.record({
						id: fc.string(),
						name: fc.oneof(
							fc.constant('crypto'),
							fc.constant('sports'),
							fc.constant('politics'),
							fc.constant('entertainment')
						)
					})
				),
				tags: fc.array(fc.record({ id: fc.string(), name: fc.string() })),
				commentCount: fc.integer({ min: 0, max: 1000 }),
				chats: fc.array(fc.record({ id: fc.string() }))
			});

			const concurrentRequestsArb = fc.integer({ min: 2, max: 5 });

			await fc.assert(
				fc.asyncProperty(seriesArb, concurrentRequestsArb, async (seriesData, numRequests) => {
					// Get the mocked instances
					const mockClientInstance = vi.mocked(service['client']);
					const mockCacheInstance = vi.mocked(service['cache']);

					// Test cache stampede protection for getSeriesById
					mockCacheInstance.get = vi.fn().mockReturnValue(null);
					mockCacheInstance.set = vi.fn();
					mockClientInstance.fetchSeriesById = vi.fn().mockImplementation(async () => {
						await new Promise((resolve) => setTimeout(resolve, 10));
						return seriesData;
					});

					const promisesById = Array.from({ length: numRequests }, () =>
						service.getSeriesById(seriesData.id)
					);
					const resultsById = await Promise.all(promisesById);

					// Verify: API was called only once
					expect(mockClientInstance.fetchSeriesById).toHaveBeenCalledTimes(1);

					// Verify: All requests received the same result
					for (let i = 1; i < resultsById.length; i++) {
						expect(resultsById[i]).toEqual(resultsById[0]);
					}
				}),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: polymarket-series-api, Property 11: Case-insensitive search
	 * Validates: Requirements 4.5
	 */
	describe('Property 11: Case-insensitive search', () => {
		it('for any series dataset and search query, the search results should include all series whose titles contain the query string (case-insensitive) and exclude all series whose titles do not contain the query', async () => {
			// Generator for series data
			const seriesArb = fc.record({
				id: fc.string({ minLength: 1 }),
				ticker: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 }),
				title: fc.string({ minLength: 1 }),
				subtitle: fc.option(fc.string(), { nil: null }),
				seriesType: fc.string(),
				recurrence: fc.string(),
				description: fc.string(),
				image: fc.option(fc.webUrl(), { nil: null }),
				icon: fc.option(fc.webUrl(), { nil: null }),
				layout: fc.string(),
				active: fc.boolean(),
				closed: fc.boolean(),
				archived: fc.boolean(),
				new: fc.boolean(),
				featured: fc.boolean(),
				restricted: fc.boolean(),
				isTemplate: fc.boolean(),
				templateVariables: fc.boolean(),
				publishedAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				createdBy: fc.string(),
				updatedBy: fc.string(),
				createdAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				updatedAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				commentsEnabled: fc.boolean(),
				competitive: fc.string(),
				volume24hr: fc.float({ min: 0, max: 10000, noNaN: true }),
				volume: fc.float({ min: 0, max: 10000, noNaN: true }),
				liquidity: fc.float({ min: 0, max: 10000, noNaN: true }),
				startDate: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				pythTokenID: fc.option(fc.string(), { nil: null }),
				cgAssetName: fc.option(fc.string(), { nil: null }),
				score: fc.float({ min: 0, max: 100, noNaN: true }),
				events: fc.array(fc.record({ id: fc.string() })),
				collections: fc.array(fc.record({ id: fc.string() })),
				categories: fc.array(
					fc.record({
						id: fc.string(),
						name: fc.oneof(
							fc.constant('crypto'),
							fc.constant('sports'),
							fc.constant('politics'),
							fc.constant('entertainment')
						)
					})
				),
				tags: fc.array(fc.record({ id: fc.string(), name: fc.string() })),
				commentCount: fc.integer({ min: 0, max: 1000 }),
				chats: fc.array(fc.record({ id: fc.string() }))
			});

			// Generator for search query - use a non-whitespace string
			await fc.assert(
				fc.asyncProperty(
					fc.array(seriesArb, { minLength: 1, maxLength: 30 }),
					fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0), // Exclude whitespace-only strings
					async (seriesData, query) => {
						// Get the mocked instances
						const mockClientInstance = vi.mocked(service['client']);
						const mockCacheInstance = vi.mocked(service['cache']);

						// Setup: Mock cache miss and API response
						mockCacheInstance.get = vi.fn().mockReturnValue(null);
						mockClientInstance.fetchSeries = vi.fn().mockResolvedValue(seriesData);

						// Execute: Search series with query
						const result = await service.searchSeries({ query });

						// Verify: All returned series contain the query string (case-insensitive)
						const queryLower = query.toLowerCase();
						for (const series of result) {
							expect(series.title?.toLowerCase()).toContain(queryLower);
						}

						// Verify: All series that contain the query are included
						const expectedSeries = seriesData.filter((s) =>
							s.title?.toLowerCase().includes(queryLower)
						);
						expect(result).toHaveLength(expectedSeries.length);

						// Verify: No series that don't contain the query are included
						for (const series of seriesData) {
							const shouldBeIncluded = series.title?.toLowerCase().includes(queryLower) ?? false;
							const isIncluded = result.some((r) => r.id === series.id);
							expect(isIncluded).toBe(shouldBeIncluded);
						}
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should handle empty query by returning all series', async () => {
			// Generator for series data
			const seriesArb = fc.array(
				fc.record({
					id: fc.string({ minLength: 1 }),
					ticker: fc.string({ minLength: 1 }),
					slug: fc.string({ minLength: 1 }),
					title: fc.string({ minLength: 1 }),
					subtitle: fc.option(fc.string(), { nil: null }),
					seriesType: fc.string(),
					recurrence: fc.string(),
					description: fc.string(),
					image: fc.option(fc.webUrl(), { nil: null }),
					icon: fc.option(fc.webUrl(), { nil: null }),
					layout: fc.string(),
					active: fc.boolean(),
					closed: fc.boolean(),
					archived: fc.boolean(),
					new: fc.boolean(),
					featured: fc.boolean(),
					restricted: fc.boolean(),
					isTemplate: fc.boolean(),
					templateVariables: fc.boolean(),
					publishedAt: fc
						.integer({ min: 1577836800000, max: 1924905600000 })
						.map((timestamp) => new Date(timestamp).toISOString()),
					createdBy: fc.string(),
					updatedBy: fc.string(),
					createdAt: fc
						.integer({ min: 1577836800000, max: 1924905600000 })
						.map((timestamp) => new Date(timestamp).toISOString()),
					updatedAt: fc
						.integer({ min: 1577836800000, max: 1924905600000 })
						.map((timestamp) => new Date(timestamp).toISOString()),
					commentsEnabled: fc.boolean(),
					competitive: fc.string(),
					volume24hr: fc.float({ min: 0, max: 10000, noNaN: true }),
					volume: fc.float({ min: 0, max: 10000, noNaN: true }),
					liquidity: fc.float({ min: 0, max: 10000, noNaN: true }),
					startDate: fc
						.integer({ min: 1577836800000, max: 1924905600000 })
						.map((timestamp) => new Date(timestamp).toISOString()),
					pythTokenID: fc.option(fc.string(), { nil: null }),
					cgAssetName: fc.option(fc.string(), { nil: null }),
					score: fc.float({ min: 0, max: 100, noNaN: true }),
					events: fc.array(fc.record({ id: fc.string() })),
					collections: fc.array(fc.record({ id: fc.string() })),
					categories: fc.array(
						fc.record({
							id: fc.string(),
							name: fc.oneof(
								fc.constant('crypto'),
								fc.constant('sports'),
								fc.constant('politics'),
								fc.constant('entertainment')
							)
						})
					),
					tags: fc.array(fc.record({ id: fc.string(), name: fc.string() })),
					commentCount: fc.integer({ min: 0, max: 1000 }),
					chats: fc.array(fc.record({ id: fc.string() }))
				}),
				{ minLength: 0, maxLength: 20 }
			);

			await fc.assert(
				fc.asyncProperty(seriesArb, async (seriesData) => {
					// Get the mocked instances
					const mockClientInstance = vi.mocked(service['client']);
					const mockCacheInstance = vi.mocked(service['cache']);

					// Setup: Mock cache miss and API response
					mockCacheInstance.get = vi.fn().mockReturnValue(null);
					mockClientInstance.fetchSeries = vi.fn().mockResolvedValue(seriesData);

					// Execute: Search with empty query
					const result1 = await service.searchSeries({ query: '' });
					const result2 = await service.searchSeries({ query: '   ' });

					// Verify: Empty query returns all series
					expect(result1).toHaveLength(seriesData.length);
					expect(result2).toHaveLength(seriesData.length);
				}),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: polymarket-series-api, Property 12: Sorting correctness
	 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
	 */
	describe('Property 12: Sorting correctness', () => {
		it('for any series dataset, sortBy field (volume, liquidity, createdAt), and sortOrder (asc, desc), the sorted results should be ordered according to the specified field and direction', async () => {
			// Generator for series data
			const seriesArb = fc.record({
				id: fc.string({ minLength: 1 }),
				ticker: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 }),
				title: fc.string({ minLength: 1 }),
				subtitle: fc.option(fc.string(), { nil: null }),
				seriesType: fc.string(),
				recurrence: fc.string(),
				description: fc.string(),
				image: fc.option(fc.webUrl(), { nil: null }),
				icon: fc.option(fc.webUrl(), { nil: null }),
				layout: fc.string(),
				active: fc.boolean(),
				closed: fc.boolean(),
				archived: fc.boolean(),
				new: fc.boolean(),
				featured: fc.boolean(),
				restricted: fc.boolean(),
				isTemplate: fc.boolean(),
				templateVariables: fc.boolean(),
				publishedAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				createdBy: fc.string(),
				updatedBy: fc.string(),
				createdAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				updatedAt: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				commentsEnabled: fc.boolean(),
				competitive: fc.string(),
				volume24hr: fc.float({ min: 0, max: 10000, noNaN: true }),
				volume: fc.float({ min: 0, max: 10000, noNaN: true }),
				liquidity: fc.float({ min: 0, max: 10000, noNaN: true }),
				startDate: fc
					.integer({ min: 1577836800000, max: 1924905600000 })
					.map((timestamp) => new Date(timestamp).toISOString()),
				pythTokenID: fc.option(fc.string(), { nil: null }),
				cgAssetName: fc.option(fc.string(), { nil: null }),
				score: fc.float({ min: 0, max: 100, noNaN: true }),
				events: fc.array(fc.record({ id: fc.string() })),
				collections: fc.array(fc.record({ id: fc.string() })),
				categories: fc.array(
					fc.record({
						id: fc.string(),
						name: fc.oneof(
							fc.constant('crypto'),
							fc.constant('sports'),
							fc.constant('politics'),
							fc.constant('entertainment')
						)
					})
				),
				tags: fc.array(fc.record({ id: fc.string(), name: fc.string() })),
				commentCount: fc.integer({ min: 0, max: 1000 }),
				chats: fc.array(fc.record({ id: fc.string() }))
			});

			// Generator for sort parameters
			const sortByArb = fc.oneof(
				fc.constant('volume' as const),
				fc.constant('liquidity' as const),
				fc.constant('createdAt' as const)
			);
			const sortOrderArb = fc.oneof(fc.constant('asc' as const), fc.constant('desc' as const));

			await fc.assert(
				fc.asyncProperty(
					fc.array(seriesArb, { minLength: 2, maxLength: 30 }),
					sortByArb,
					sortOrderArb,
					async (seriesData, sortBy, sortOrder) => {
						// Get the mocked instances
						const mockClientInstance = vi.mocked(service['client']);
						const mockCacheInstance = vi.mocked(service['cache']);

						// Setup: Mock cache miss and API response
						mockCacheInstance.get = vi.fn().mockReturnValue(null);
						mockClientInstance.fetchSeries = vi.fn().mockResolvedValue(seriesData);

						// Execute: Search series with sorting
						const result = await service.searchSeries({ sortBy, sortOrder });

						// Verify: Results are sorted correctly
						for (let i = 1; i < result.length; i++) {
							let prevValue: number;
							let currValue: number;

							switch (sortBy) {
								case 'volume':
									prevValue = result[i - 1].volume ?? 0;
									currValue = result[i].volume ?? 0;
									break;
								case 'liquidity':
									prevValue = result[i - 1].liquidity ?? 0;
									currValue = result[i].liquidity ?? 0;
									break;
								case 'createdAt':
									prevValue = result[i - 1].createdAt
										? new Date(result[i - 1].createdAt!).getTime()
										: 0;
									currValue = result[i].createdAt ? new Date(result[i].createdAt!).getTime() : 0;
									break;
							}

							if (sortOrder === 'asc') {
								expect(prevValue).toBeLessThanOrEqual(currValue);
							} else {
								expect(prevValue).toBeGreaterThanOrEqual(currValue);
							}
						}

						// Verify: All original series are present in the result
						expect(result).toHaveLength(seriesData.length);
						for (const series of seriesData) {
							expect(result.some((r) => r.id === series.id)).toBe(true);
						}
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should handle sorting with default order (desc) when sortOrder is not specified', async () => {
			// Generator for series data
			const seriesArb = fc.array(
				fc.record({
					id: fc.string({ minLength: 1 }),
					ticker: fc.string({ minLength: 1 }),
					slug: fc.string({ minLength: 1 }),
					title: fc.string({ minLength: 1 }),
					subtitle: fc.option(fc.string(), { nil: null }),
					seriesType: fc.string(),
					recurrence: fc.string(),
					description: fc.string(),
					image: fc.option(fc.webUrl(), { nil: null }),
					icon: fc.option(fc.webUrl(), { nil: null }),
					layout: fc.string(),
					active: fc.boolean(),
					closed: fc.boolean(),
					archived: fc.boolean(),
					new: fc.boolean(),
					featured: fc.boolean(),
					restricted: fc.boolean(),
					isTemplate: fc.boolean(),
					templateVariables: fc.boolean(),
					publishedAt: fc
						.integer({ min: 1577836800000, max: 1924905600000 })
						.map((timestamp) => new Date(timestamp).toISOString()),
					createdBy: fc.string(),
					updatedBy: fc.string(),
					createdAt: fc
						.integer({ min: 1577836800000, max: 1924905600000 })
						.map((timestamp) => new Date(timestamp).toISOString()),
					updatedAt: fc
						.integer({ min: 1577836800000, max: 1924905600000 })
						.map((timestamp) => new Date(timestamp).toISOString()),
					commentsEnabled: fc.boolean(),
					competitive: fc.string(),
					volume24hr: fc.float({ min: 0, max: 10000, noNaN: true }),
					volume: fc.float({ min: 0, max: 10000, noNaN: true }),
					liquidity: fc.float({ min: 0, max: 10000, noNaN: true }),
					startDate: fc
						.integer({ min: 1577836800000, max: 1924905600000 })
						.map((timestamp) => new Date(timestamp).toISOString()),
					pythTokenID: fc.option(fc.string(), { nil: null }),
					cgAssetName: fc.option(fc.string(), { nil: null }),
					score: fc.float({ min: 0, max: 100, noNaN: true }),
					events: fc.array(fc.record({ id: fc.string() })),
					collections: fc.array(fc.record({ id: fc.string() })),
					categories: fc.array(
						fc.record({
							id: fc.string(),
							name: fc.oneof(
								fc.constant('crypto'),
								fc.constant('sports'),
								fc.constant('politics'),
								fc.constant('entertainment')
							)
						})
					),
					tags: fc.array(fc.record({ id: fc.string(), name: fc.string() })),
					commentCount: fc.integer({ min: 0, max: 1000 }),
					chats: fc.array(fc.record({ id: fc.string() }))
				}),
				{ minLength: 2, maxLength: 20 }
			);

			await fc.assert(
				fc.asyncProperty(seriesArb, async (seriesData) => {
					// Get the mocked instances
					const mockClientInstance = vi.mocked(service['client']);
					const mockCacheInstance = vi.mocked(service['cache']);

					// Setup: Mock cache miss and API response
					mockCacheInstance.get = vi.fn().mockReturnValue(null);
					mockClientInstance.fetchSeries = vi.fn().mockResolvedValue(seriesData);

					// Execute: Search with sortBy but no sortOrder (should default to desc)
					const result = await service.searchSeries({ sortBy: 'volume' });

					// Verify: Results are sorted in descending order
					for (let i = 1; i < result.length; i++) {
						expect(result[i - 1].volume ?? 0).toBeGreaterThanOrEqual(result[i].volume ?? 0);
					}
				}),
				{ numRuns: 100 }
			);
		});
	});
});
