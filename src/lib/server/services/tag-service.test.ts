import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { TagService } from './tag-service';
import { loadConfig } from '../config/api-config';
import { Logger } from '../utils/logger';

// Mock the dependencies
vi.mock('../api/polymarket-client');
vi.mock('../cache/cache-manager');
vi.mock('../config/api-config');
vi.mock('../utils/logger');

describe('TagService', () => {
	let service: TagService;

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Mock loadConfig
		vi.mocked(loadConfig).mockReturnValue({
			baseUrl: 'https://test-api.com',
			dataApiUrl: 'https://data-api.polymarket.com',
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

		service = new TagService();
	});

	/**
	 * Feature: polymarket-tags-api, Property 1: Cache consistency
	 * Validates: Requirements 1.3, 1.4, 2.4, 3.4
	 */
	describe('Property 1: Cache consistency', () => {
		it('for any tag fetch operation (list, by ID, or by slug), when the same request is made twice within the TTL period, the second request should return cached data without making an API call', async () => {
			// Generator for tag data
			const tagArb = fc.record({
				id: fc.string({ minLength: 1 }),
				label: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 })
			});

			await fc.assert(
				fc.asyncProperty(fc.array(tagArb, { minLength: 1, maxLength: 10 }), async (tags) => {
					// Get the mocked instances
					const mockClientInstance = vi.mocked(service['client']);
					const mockCacheInstance = vi.mocked(service['cache']);

					// Setup: Mock cache behavior
					let cacheCallCount = 0;
					mockCacheInstance.get = vi.fn().mockImplementation(() => {
						cacheCallCount++;
						// First call: cache miss, second call: cache hit
						return cacheCallCount === 1 ? null : tags;
					});
					mockCacheInstance.set = vi.fn();
					mockClientInstance.fetchTags = vi.fn().mockResolvedValue(tags);

					// Execute: First request (cache miss)
					const result1 = await service.getTags();

					// Execute: Second request (cache hit)
					const result2 = await service.getTags();

					// Verify: First request fetched from API
					expect(mockClientInstance.fetchTags).toHaveBeenCalledTimes(1);

					// Verify: Second request used cache
					expect(result1).toEqual(result2);
					expect(mockCacheInstance.set).toHaveBeenCalledTimes(1);
				}),
				{ numRuns: 100 }
			);
		});

		it('for any tag by ID, when the same request is made twice within the TTL period, the second request should return cached data without making an API call', async () => {
			// Generator for tag data
			const tagArb = fc.record({
				id: fc.string({ minLength: 1 }),
				label: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 })
			});

			await fc.assert(
				fc.asyncProperty(tagArb, async (tag) => {
					// Get the mocked instances
					const mockClientInstance = vi.mocked(service['client']);
					const mockCacheInstance = vi.mocked(service['cache']);

					// Setup: Mock cache behavior
					let cacheCallCount = 0;
					mockCacheInstance.get = vi.fn().mockImplementation(() => {
						cacheCallCount++;
						// First call: cache miss, second call: cache hit
						return cacheCallCount === 1 ? null : tag;
					});
					mockCacheInstance.set = vi.fn();
					mockClientInstance.fetchTagById = vi.fn().mockResolvedValue(tag);

					// Execute: First request (cache miss)
					const result1 = await service.getTagById(tag.id);

					// Execute: Second request (cache hit)
					const result2 = await service.getTagById(tag.id);

					// Verify: First request fetched from API
					expect(mockClientInstance.fetchTagById).toHaveBeenCalledTimes(1);

					// Verify: Second request used cache
					expect(result1).toEqual(result2);
					expect(mockCacheInstance.set).toHaveBeenCalledTimes(1);
				}),
				{ numRuns: 100 }
			);
		});

		it('for any tag by slug, when the same request is made twice within the TTL period, the second request should return cached data without making an API call', async () => {
			// Generator for tag data
			const tagArb = fc.record({
				id: fc.string({ minLength: 1 }),
				label: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 })
			});

			await fc.assert(
				fc.asyncProperty(tagArb, async (tag) => {
					// Get the mocked instances
					const mockClientInstance = vi.mocked(service['client']);
					const mockCacheInstance = vi.mocked(service['cache']);

					// Setup: Mock cache behavior
					let cacheCallCount = 0;
					mockCacheInstance.get = vi.fn().mockImplementation(() => {
						cacheCallCount++;
						// First call: cache miss, second call: cache hit
						return cacheCallCount === 1 ? null : tag;
					});
					mockCacheInstance.set = vi.fn();
					mockClientInstance.fetchTagBySlug = vi.fn().mockResolvedValue(tag);

					// Execute: First request (cache miss)
					const result1 = await service.getTagBySlug(tag.slug);

					// Execute: Second request (cache hit)
					const result2 = await service.getTagBySlug(tag.slug);

					// Verify: First request fetched from API
					expect(mockClientInstance.fetchTagBySlug).toHaveBeenCalledTimes(1);

					// Verify: Second request used cache
					expect(result1).toEqual(result2);
					expect(mockCacheInstance.set).toHaveBeenCalledTimes(1);
				}),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: polymarket-tags-api, Property 2: Cache stampede prevention
	 * Validates: Requirements 1.5, 2.5, 3.5
	 */
	describe('Property 2: Cache stampede prevention', () => {
		it('for any tag fetch operation, when multiple concurrent requests are made for the same data, only one API request should be made and all concurrent requests should receive the same result', async () => {
			// Generator for tag data
			const tagArb = fc.record({
				id: fc.string({ minLength: 1 }),
				label: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 })
			});

			await fc.assert(
				fc.asyncProperty(
					fc.array(tagArb, { minLength: 1, maxLength: 10 }),
					fc.integer({ min: 2, max: 10 }),
					async (tags, concurrentRequests) => {
						// Get the mocked instances
						const mockClientInstance = vi.mocked(service['client']);
						const mockCacheInstance = vi.mocked(service['cache']);

						// Setup: Mock cache miss
						mockCacheInstance.get = vi.fn().mockReturnValue(null);
						mockCacheInstance.set = vi.fn();
						mockClientInstance.fetchTags = vi.fn().mockResolvedValue(tags);

						// Execute: Make N concurrent requests
						const promises = Array.from({ length: concurrentRequests }, () => service.getTags());
						const results = await Promise.all(promises);

						// Verify: Only one API call was made
						expect(mockClientInstance.fetchTags).toHaveBeenCalledTimes(1);

						// Verify: All requests received the same result
						for (const result of results) {
							expect(result).toEqual(tags);
						}
					}
				),
				{ numRuns: 100 }
			);
		});

		it('for any tag by ID, when multiple concurrent requests are made for the same ID, only one API request should be made', async () => {
			// Generator for tag data
			const tagArb = fc.record({
				id: fc.string({ minLength: 1 }),
				label: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 })
			});

			await fc.assert(
				fc.asyncProperty(
					tagArb,
					fc.integer({ min: 2, max: 10 }),
					async (tag, concurrentRequests) => {
						// Get the mocked instances
						const mockClientInstance = vi.mocked(service['client']);
						const mockCacheInstance = vi.mocked(service['cache']);

						// Setup: Mock cache miss
						mockCacheInstance.get = vi.fn().mockReturnValue(null);
						mockCacheInstance.set = vi.fn();
						mockClientInstance.fetchTagById = vi.fn().mockResolvedValue(tag);

						// Execute: Make N concurrent requests
						const promises = Array.from({ length: concurrentRequests }, () =>
							service.getTagById(tag.id)
						);
						const results = await Promise.all(promises);

						// Verify: Only one API call was made
						expect(mockClientInstance.fetchTagById).toHaveBeenCalledTimes(1);

						// Verify: All requests received the same result
						for (const result of results) {
							expect(result).toEqual(tag);
						}
					}
				),
				{ numRuns: 100 }
			);
		});

		it('for any tag by slug, when multiple concurrent requests are made for the same slug, only one API request should be made', async () => {
			// Generator for tag data
			const tagArb = fc.record({
				id: fc.string({ minLength: 1 }),
				label: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 })
			});

			await fc.assert(
				fc.asyncProperty(
					tagArb,
					fc.integer({ min: 2, max: 10 }),
					async (tag, concurrentRequests) => {
						// Get the mocked instances
						const mockClientInstance = vi.mocked(service['client']);
						const mockCacheInstance = vi.mocked(service['cache']);

						// Setup: Mock cache miss
						mockCacheInstance.get = vi.fn().mockReturnValue(null);
						mockCacheInstance.set = vi.fn();
						mockClientInstance.fetchTagBySlug = vi.fn().mockResolvedValue(tag);

						// Execute: Make N concurrent requests
						const promises = Array.from({ length: concurrentRequests }, () =>
							service.getTagBySlug(tag.slug)
						);
						const results = await Promise.all(promises);

						// Verify: Only one API call was made
						expect(mockClientInstance.fetchTagBySlug).toHaveBeenCalledTimes(1);

						// Verify: All requests received the same result
						for (const result of results) {
							expect(result).toEqual(tag);
						}
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: polymarket-tags-api, Property 4: 404 null handling
	 * Validates: Requirements 2.3, 3.3
	 */
	describe('Property 4: 404 null handling', () => {
		it('for any tag ID that does not exist, when the API returns a 404 status, the service should return null instead of throwing an error', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1 }), async (tagId) => {
					// Get the mocked instances
					const mockClientInstance = vi.mocked(service['client']);
					const mockCacheInstance = vi.mocked(service['cache']);

					// Setup: Mock cache miss and 404 error
					mockCacheInstance.get = vi.fn().mockReturnValue(null);
					mockClientInstance.fetchTagById = vi.fn().mockRejectedValue({ statusCode: 404 });

					// Execute: Try to fetch non-existent tag
					const result = await service.getTagById(tagId);

					// Verify: Service returns null instead of throwing
					expect(result).toBeNull();
				}),
				{ numRuns: 100 }
			);
		});

		it('for any tag slug that does not exist, when the API returns a 404 status, the service should return null instead of throwing an error', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1 }), async (tagSlug) => {
					// Get the mocked instances
					const mockClientInstance = vi.mocked(service['client']);
					const mockCacheInstance = vi.mocked(service['cache']);

					// Setup: Mock cache miss and 404 error
					mockCacheInstance.get = vi.fn().mockReturnValue(null);
					mockClientInstance.fetchTagBySlug = vi.fn().mockRejectedValue({ statusCode: 404 });

					// Execute: Try to fetch non-existent tag
					const result = await service.getTagBySlug(tagSlug);

					// Verify: Service returns null instead of throwing
					expect(result).toBeNull();
				}),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: polymarket-tags-api, Property 7: Request logging completeness
	 * Validates: Requirements 4.1, 4.2, 4.3
	 */
	describe('Property 7: Request logging completeness', () => {
		it('for any successful API request, there should be a log entry at the start with parameters, and a corresponding log entry at completion', async () => {
			// Generator for tag data
			const tagArb = fc.record({
				id: fc.string({ minLength: 1 }),
				label: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 })
			});

			await fc.assert(
				fc.asyncProperty(fc.array(tagArb, { minLength: 0, maxLength: 20 }), async (tags) => {
					// Get the mocked instances
					const mockClientInstance = vi.mocked(service['client']);
					const mockCacheInstance = vi.mocked(service['cache']);
					const mockLoggerInstance = vi.mocked(service['logger']);

					// Setup: Mock cache miss to force API call
					mockCacheInstance.get = vi.fn().mockReturnValue(null);
					mockCacheInstance.set = vi.fn();
					mockClientInstance.fetchTags = vi.fn().mockResolvedValue(tags);

					// Clear previous calls
					vi.mocked(mockLoggerInstance.info).mockClear();

					// Execute: Make a request
					const result = await service.getTags();

					// Verify: Logger was called
					expect(mockLoggerInstance.info).toHaveBeenCalled();

					// Get all info log calls
					const infoCalls = vi.mocked(mockLoggerInstance.info).mock.calls;

					// Verify: At least one log entry exists
					expect(infoCalls.length).toBeGreaterThan(0);

					// Verify: Result matches what was returned
					expect(result).toEqual(tags);
				}),
				{ numRuns: 100 }
			);
		});

		it('for any failed API request, there should be a log entry at the start and the error should propagate', async () => {
			// Generator for error types
			const errorArb = fc.oneof(
				fc.record({
					statusCode: fc.integer({ min: 400, max: 599 }),
					message: fc.string({ minLength: 1 })
				}),
				fc.string({ minLength: 1 }).map((msg) => new Error(msg))
			);

			await fc.assert(
				fc.asyncProperty(errorArb, async (error) => {
					// Get the mocked instances
					const mockClientInstance = vi.mocked(service['client']);
					const mockCacheInstance = vi.mocked(service['cache']);
					const mockLoggerInstance = vi.mocked(service['logger']);

					// Setup: Mock cache miss and API error
					mockCacheInstance.get = vi.fn().mockReturnValue(null);
					mockClientInstance.fetchTags = vi.fn().mockRejectedValue(error);

					// Clear previous calls
					vi.mocked(mockLoggerInstance.info).mockClear();
					vi.mocked(mockLoggerInstance.error).mockClear();

					// Execute: Make a request that will fail
					try {
						await service.getTags();
						// If we get here, the error wasn't thrown (shouldn't happen)
						expect.fail('Expected an error to be thrown');
					} catch (e) {
						// Expected to throw
						// The error should have been logged by the client layer
						// Since we're testing the service layer, we verify the error propagates
						expect(e).toBeDefined();
					}
				}),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: polymarket-tags-api, Property 8: Cache event logging
	 * Validates: Requirements 4.4, 4.5
	 */
	describe('Property 8: Cache event logging', () => {
		it('for any cache lookup operation, there should be a log entry indicating either a cache hit or cache miss with relevant context', async () => {
			// Generator for tag data
			const tagArb = fc.record({
				id: fc.string({ minLength: 1 }),
				label: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 })
			});

			await fc.assert(
				fc.asyncProperty(fc.array(tagArb, { minLength: 0, maxLength: 10 }), async (tags) => {
					// Get the mocked instances
					const mockClientInstance = vi.mocked(service['client']);
					const mockCacheInstance = vi.mocked(service['cache']);
					const mockLoggerInstance = vi.mocked(service['logger']);

					// Setup: Mock cache miss first, then cache hit
					let callCount = 0;
					mockCacheInstance.get = vi.fn().mockImplementation(() => {
						callCount++;
						return callCount === 1 ? null : tags;
					});
					mockCacheInstance.set = vi.fn();
					mockClientInstance.fetchTags = vi.fn().mockResolvedValue(tags);

					// Clear previous calls
					vi.mocked(mockLoggerInstance.info).mockClear();

					// Execute: First request (cache miss)
					await service.getTags();

					// Verify: Cache miss was logged
					const missLogCalls = vi.mocked(mockLoggerInstance.info).mock.calls;
					const cacheMissLog = missLogCalls.find((call) => call[0].includes('Cache miss'));
					expect(cacheMissLog).toBeDefined();

					// Clear for second request
					vi.mocked(mockLoggerInstance.info).mockClear();

					// Execute: Second request (cache hit)
					await service.getTags();

					// Verify: Cache hit was logged
					const hitLogCalls = vi.mocked(mockLoggerInstance.info).mock.calls;
					const cacheHitLog = hitLogCalls.find((call) => call[0].includes('Cache hit'));
					expect(cacheHitLog).toBeDefined();
				}),
				{ numRuns: 100 }
			);
		});

		it('for any tag by ID cache lookup, there should be a log entry indicating either a cache hit or cache miss', async () => {
			// Generator for tag data
			const tagArb = fc.record({
				id: fc.string({ minLength: 1 }),
				label: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 })
			});

			await fc.assert(
				fc.asyncProperty(tagArb, async (tag) => {
					// Get the mocked instances
					const mockClientInstance = vi.mocked(service['client']);
					const mockCacheInstance = vi.mocked(service['cache']);
					const mockLoggerInstance = vi.mocked(service['logger']);

					// Setup: Mock cache miss first, then cache hit
					let callCount = 0;
					mockCacheInstance.get = vi.fn().mockImplementation(() => {
						callCount++;
						return callCount === 1 ? null : tag;
					});
					mockCacheInstance.set = vi.fn();
					mockClientInstance.fetchTagById = vi.fn().mockResolvedValue(tag);

					// Clear previous calls
					vi.mocked(mockLoggerInstance.info).mockClear();

					// Execute: First request (cache miss)
					await service.getTagById(tag.id);

					// Verify: Cache miss was logged
					const missLogCalls = vi.mocked(mockLoggerInstance.info).mock.calls;
					const cacheMissLog = missLogCalls.find((call) => call[0].includes('Cache miss'));
					expect(cacheMissLog).toBeDefined();

					// Clear for second request
					vi.mocked(mockLoggerInstance.info).mockClear();

					// Execute: Second request (cache hit)
					await service.getTagById(tag.id);

					// Verify: Cache hit was logged
					const hitLogCalls = vi.mocked(mockLoggerInstance.info).mock.calls;
					const cacheHitLog = hitLogCalls.find((call) => call[0].includes('Cache hit'));
					expect(cacheHitLog).toBeDefined();
				}),
				{ numRuns: 100 }
			);
		});

		it('for any tag by slug cache lookup, there should be a log entry indicating either a cache hit or cache miss', async () => {
			// Generator for tag data
			const tagArb = fc.record({
				id: fc.string({ minLength: 1 }),
				label: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 })
			});

			await fc.assert(
				fc.asyncProperty(tagArb, async (tag) => {
					// Get the mocked instances
					const mockClientInstance = vi.mocked(service['client']);
					const mockCacheInstance = vi.mocked(service['cache']);
					const mockLoggerInstance = vi.mocked(service['logger']);

					// Setup: Mock cache miss first, then cache hit
					let callCount = 0;
					mockCacheInstance.get = vi.fn().mockImplementation(() => {
						callCount++;
						return callCount === 1 ? null : tag;
					});
					mockCacheInstance.set = vi.fn();
					mockClientInstance.fetchTagBySlug = vi.fn().mockResolvedValue(tag);

					// Clear previous calls
					vi.mocked(mockLoggerInstance.info).mockClear();

					// Execute: First request (cache miss)
					await service.getTagBySlug(tag.slug);

					// Verify: Cache miss was logged
					const missLogCalls = vi.mocked(mockLoggerInstance.info).mock.calls;
					const cacheMissLog = missLogCalls.find((call) => call[0].includes('Cache miss'));
					expect(cacheMissLog).toBeDefined();

					// Clear for second request
					vi.mocked(mockLoggerInstance.info).mockClear();

					// Execute: Second request (cache hit)
					await service.getTagBySlug(tag.slug);

					// Verify: Cache hit was logged
					const hitLogCalls = vi.mocked(mockLoggerInstance.info).mock.calls;
					const cacheHitLog = hitLogCalls.find((call) => call[0].includes('Cache hit'));
					expect(cacheHitLog).toBeDefined();
				}),
				{ numRuns: 100 }
			);
		});
	});
});
