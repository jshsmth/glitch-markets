/**
 * Property-based tests for /api/series server route
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import type { RequestEvent } from '@sveltejs/kit';
import type { Series } from '$lib/server/api/polymarket-client';

// Mock the SeriesService to control responses
const mockGetSeries = vi.fn();

vi.mock('$lib/server/services/series-service', () => {
	return {
		SeriesService: class {
			getSeries = mockGetSeries;
		}
	};
});

const { GET } = await import('../../routes/api/series/+server');

// Helper to generate valid series data
const seriesArbitrary = fc.record({
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
}) as unknown as fc.Arbitrary<Series>;

describe('Series Server Route', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetSeries.mockReset();
	});

	afterEach(() => {
		vi.clearAllMocks();
		mockGetSeries.mockReset();
	});

	/**
	 * Feature: polymarket-series-api, Property 13: Route parameter handling
	 * Validates: Requirements 6.1
	 *
	 * For any valid query parameters sent to /api/series, the route should return
	 * a filtered list of series matching the parameters.
	 */
	describe('Property 13: Route parameter handling', () => {
		it('should return valid JSON for any valid request with filters', async () => {
			await fc.assert(
				fc.asyncProperty(
					// Generate random valid filter combinations
					fc.record({
						limit: fc.option(fc.integer({ min: 1, max: 100 })),
						offset: fc.option(fc.integer({ min: 0, max: 1000 })),
						category: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
						active: fc.option(fc.boolean()),
						closed: fc.option(fc.boolean())
					}),
					// Generate random series data that the service would return
					fc.array(seriesArbitrary, { minLength: 0, maxLength: 10 }),
					async (filters, series: Series[]) => {
						// Reset the mock for each iteration
						mockGetSeries.mockReset();
						mockGetSeries.mockResolvedValue(series);

						// Build URL with filters
						const mockUrl = new URL('http://localhost/api/series');
						if (filters.limit !== null) mockUrl.searchParams.set('limit', String(filters.limit));
						if (filters.offset !== null) mockUrl.searchParams.set('offset', String(filters.offset));
						if (filters.category !== null) mockUrl.searchParams.set('category', filters.category);
						if (filters.active !== null) mockUrl.searchParams.set('active', String(filters.active));
						if (filters.closed !== null) mockUrl.searchParams.set('closed', String(filters.closed));

						const mockEvent: RequestEvent = {
							url: mockUrl
						} as RequestEvent;

						// Call the GET handler
						const response = await GET(mockEvent);

						// Verify the response
						expect(response).toBeDefined();
						expect(response.status).toBe(200);

						// Parse the response body - this verifies it's valid JSON
						const responseText = await response.text();
						const responseData = JSON.parse(responseText);

						// Verify it's an array (the expected format)
						expect(Array.isArray(responseData)).toBe(true);

						// Verify the service was called with the correct filters
						expect(mockGetSeries).toHaveBeenCalledTimes(1);
						const calledFilters = mockGetSeries.mock.calls[0][0];

						// Check that filters were passed correctly
						if (filters.limit !== null) {
							expect(calledFilters.limit).toBe(filters.limit);
						}
						if (filters.offset !== null) {
							expect(calledFilters.offset).toBe(filters.offset);
						}
						if (filters.category !== null) {
							expect(calledFilters.category).toBe(filters.category);
						}
						if (filters.active !== null) {
							expect(calledFilters.active).toBe(filters.active);
						}
						if (filters.closed !== null) {
							expect(calledFilters.closed).toBe(filters.closed);
						}
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should return valid JSON for empty series lists', async () => {
			mockGetSeries.mockReset();
			mockGetSeries.mockResolvedValue([]);

			const mockUrl = new URL('http://localhost/api/series');
			const mockEvent: RequestEvent = {
				url: mockUrl
			} as RequestEvent;

			const response = await GET(mockEvent);

			expect(response.status).toBe(200);
			const responseText = await response.text();
			const responseData = JSON.parse(responseText);
			expect(Array.isArray(responseData)).toBe(true);
			expect(responseData).toHaveLength(0);
		});
	});

	/**
	 * Feature: polymarket-series-api, Property 15: Invalid parameter rejection
	 * Validates: Requirements 6.4
	 *
	 * For any invalid query parameters sent to series routes, the system should return
	 * a 400 status code with a descriptive error message.
	 */
	describe('Property 15: Invalid parameter rejection', () => {
		it('should reject negative limit values', async () => {
			await fc.assert(
				fc.asyncProperty(fc.integer({ min: -1000, max: -1 }), async (invalidLimit) => {
					mockGetSeries.mockReset();

					const mockUrl = new URL('http://localhost/api/series');
					mockUrl.searchParams.set('limit', String(invalidLimit));

					const mockEvent: RequestEvent = {
						url: mockUrl
					} as RequestEvent;

					const response = await GET(mockEvent);

					// Verify 400 error response
					expect(response.status).toBe(400);

					// Parse error response
					const responseText = await response.text();
					const errorData = JSON.parse(responseText);

					// Verify error structure
					expect(errorData.error).toBeDefined();
					expect(errorData.message).toBeDefined();
					expect(errorData.message).toContain('limit');

					// Verify service was not called
					expect(mockGetSeries).not.toHaveBeenCalled();
				}),
				{ numRuns: 100 }
			);
		});

		it('should reject negative offset values', async () => {
			await fc.assert(
				fc.asyncProperty(fc.integer({ min: -1000, max: -1 }), async (invalidOffset) => {
					mockGetSeries.mockReset();

					const mockUrl = new URL('http://localhost/api/series');
					mockUrl.searchParams.set('offset', String(invalidOffset));

					const mockEvent: RequestEvent = {
						url: mockUrl
					} as RequestEvent;

					const response = await GET(mockEvent);

					// Verify 400 error response
					expect(response.status).toBe(400);

					// Parse error response
					const responseText = await response.text();
					const errorData = JSON.parse(responseText);

					// Verify error structure
					expect(errorData.error).toBeDefined();
					expect(errorData.message).toBeDefined();
					expect(errorData.message).toContain('offset');

					// Verify service was not called
					expect(mockGetSeries).not.toHaveBeenCalled();
				}),
				{ numRuns: 100 }
			);
		});

		it('should reject invalid boolean values for active parameter', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.string().filter((s) => s !== 'true' && s !== 'false'),
					async (invalidBoolean) => {
						mockGetSeries.mockReset();

						const mockUrl = new URL('http://localhost/api/series');
						mockUrl.searchParams.set('active', invalidBoolean);

						const mockEvent: RequestEvent = {
							url: mockUrl
						} as RequestEvent;

						const response = await GET(mockEvent);

						// Verify 400 error response
						expect(response.status).toBe(400);

						// Parse error response
						const responseText = await response.text();
						const errorData = JSON.parse(responseText);

						// Verify error structure
						expect(errorData.error).toBeDefined();
						expect(errorData.message).toBeDefined();
						expect(errorData.message).toContain('active');

						// Verify service was not called
						expect(mockGetSeries).not.toHaveBeenCalled();
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should reject invalid boolean values for closed parameter', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.string().filter((s) => s !== 'true' && s !== 'false'),
					async (invalidBoolean) => {
						mockGetSeries.mockReset();

						const mockUrl = new URL('http://localhost/api/series');
						mockUrl.searchParams.set('closed', invalidBoolean);

						const mockEvent: RequestEvent = {
							url: mockUrl
						} as RequestEvent;

						const response = await GET(mockEvent);

						// Verify 400 error response
						expect(response.status).toBe(400);

						// Parse error response
						const responseText = await response.text();
						const errorData = JSON.parse(responseText);

						// Verify error structure
						expect(errorData.error).toBeDefined();
						expect(errorData.message).toBeDefined();
						expect(errorData.message).toContain('closed');

						// Verify service was not called
						expect(mockGetSeries).not.toHaveBeenCalled();
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should reject non-numeric limit values', async () => {
			mockGetSeries.mockReset();

			const mockUrl = new URL('http://localhost/api/series');
			mockUrl.searchParams.set('limit', 'not-a-number');

			const mockEvent: RequestEvent = {
				url: mockUrl
			} as RequestEvent;

			const response = await GET(mockEvent);

			expect(response.status).toBe(400);
			const responseText = await response.text();
			const errorData = JSON.parse(responseText);
			expect(errorData.message).toContain('limit');
			expect(mockGetSeries).not.toHaveBeenCalled();
		});

		it('should reject non-numeric offset values', async () => {
			mockGetSeries.mockReset();

			const mockUrl = new URL('http://localhost/api/series');
			mockUrl.searchParams.set('offset', 'not-a-number');

			const mockEvent: RequestEvent = {
				url: mockUrl
			} as RequestEvent;

			const response = await GET(mockEvent);

			expect(response.status).toBe(400);
			const responseText = await response.text();
			const errorData = JSON.parse(responseText);
			expect(errorData.message).toContain('offset');
			expect(mockGetSeries).not.toHaveBeenCalled();
		});
	});

	/**
	 * Feature: polymarket-series-api, Property 16: Cache headers presence
	 * Validates: Requirements 6.5
	 *
	 * For any successful series route response, the response should include appropriate
	 * cache control headers (Cache-Control, CDN-Cache-Control, Vercel-CDN-Cache-Control).
	 */
	describe('Property 16: Cache headers presence', () => {
		it('should include cache headers for any valid request', async () => {
			await fc.assert(
				fc.asyncProperty(
					// Generate random valid filter combinations
					fc.record({
						limit: fc.option(fc.integer({ min: 1, max: 100 })),
						offset: fc.option(fc.integer({ min: 0, max: 1000 })),
						category: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
						active: fc.option(fc.boolean()),
						closed: fc.option(fc.boolean())
					}),
					// Generate random series data
					fc.array(seriesArbitrary, { minLength: 0, maxLength: 10 }),
					async (filters, series: Series[]) => {
						// Reset the mock
						mockGetSeries.mockReset();
						mockGetSeries.mockResolvedValue(series);

						// Build URL with filters
						const mockUrl = new URL('http://localhost/api/series');
						if (filters.limit !== null) mockUrl.searchParams.set('limit', String(filters.limit));
						if (filters.offset !== null) mockUrl.searchParams.set('offset', String(filters.offset));
						if (filters.category !== null) mockUrl.searchParams.set('category', filters.category);
						if (filters.active !== null) mockUrl.searchParams.set('active', String(filters.active));
						if (filters.closed !== null) mockUrl.searchParams.set('closed', String(filters.closed));

						const mockEvent: RequestEvent = {
							url: mockUrl
						} as RequestEvent;

						// Call the GET handler
						const response = await GET(mockEvent);

						// Verify the response has cache headers
						expect(response.status).toBe(200);

						// Check for Cache-Control header
						const cacheControl = response.headers.get('Cache-Control');
						expect(cacheControl).toBeDefined();
						expect(cacheControl).not.toBeNull();
						expect(cacheControl).toContain('max-age');
						expect(cacheControl).toContain('public');

						// Check for CDN cache headers
						const cdnCacheControl = response.headers.get('CDN-Cache-Control');
						expect(cdnCacheControl).toBeDefined();
						expect(cdnCacheControl).not.toBeNull();

						const vercelCdnCacheControl = response.headers.get('Vercel-CDN-Cache-Control');
						expect(vercelCdnCacheControl).toBeDefined();
						expect(vercelCdnCacheControl).not.toBeNull();
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should include appropriate cache directives', async () => {
			mockGetSeries.mockReset();
			mockGetSeries.mockResolvedValue([]);

			const mockUrl = new URL('http://localhost/api/series');
			const mockEvent: RequestEvent = {
				url: mockUrl
			} as RequestEvent;

			const response = await GET(mockEvent);

			expect(response.status).toBe(200);

			// Verify cache headers are present and have appropriate values
			const cacheControl = response.headers.get('Cache-Control');
			expect(cacheControl).toBeDefined();
			expect(cacheControl).toContain('public');
			expect(cacheControl).toContain('max-age=60');
			expect(cacheControl).toContain('s-maxage=60');

			const cdnCacheControl = response.headers.get('CDN-Cache-Control');
			expect(cdnCacheControl).toBeDefined();
			expect(cdnCacheControl).toContain('public');
			expect(cdnCacheControl).toContain('max-age=60');

			const vercelCdnCacheControl = response.headers.get('Vercel-CDN-Cache-Control');
			expect(vercelCdnCacheControl).toBeDefined();
			expect(vercelCdnCacheControl).toContain('public');
			expect(vercelCdnCacheControl).toContain('max-age=60');
		});
	});

	/**
	 * Feature: polymarket-series-api, Property 17: Request logging completeness
	 * Validates: Requirements 7.3
	 *
	 * For any series route request, the log entry should include the request filters
	 * and a timestamp.
	 */
	describe('Property 17: Request logging completeness', () => {
		it('should log request with filters for any valid request', async () => {
			// We'll need to mock the Logger to verify logging
			const { Logger } = await import('$lib/server/utils/logger');
			const mockLoggerInfo = vi.spyOn(Logger.prototype, 'info');

			await fc.assert(
				fc.asyncProperty(
					fc.record({
						limit: fc.option(fc.integer({ min: 1, max: 100 })),
						offset: fc.option(fc.integer({ min: 0, max: 1000 })),
						category: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
						active: fc.option(fc.boolean()),
						closed: fc.option(fc.boolean())
					}),
					fc.array(seriesArbitrary, { minLength: 0, maxLength: 5 }),
					async (filters, series: Series[]) => {
						mockGetSeries.mockReset();
						mockGetSeries.mockResolvedValue(series);
						mockLoggerInfo.mockClear();

						const mockUrl = new URL('http://localhost/api/series');
						if (filters.limit !== null) mockUrl.searchParams.set('limit', String(filters.limit));
						if (filters.offset !== null) mockUrl.searchParams.set('offset', String(filters.offset));
						if (filters.category !== null) mockUrl.searchParams.set('category', filters.category);
						if (filters.active !== null) mockUrl.searchParams.set('active', String(filters.active));
						if (filters.closed !== null) mockUrl.searchParams.set('closed', String(filters.closed));

						const mockEvent: RequestEvent = {
							url: mockUrl
						} as RequestEvent;

						await GET(mockEvent);

						// Verify logging occurred
						expect(mockLoggerInfo).toHaveBeenCalled();

						// Find the "Fetching series" log call
						const fetchingLogCall = mockLoggerInfo.mock.calls.find(
							(call) => call[0] === 'Fetching series'
						);
						expect(fetchingLogCall).toBeDefined();

						// Verify filters are included in the log
						if (fetchingLogCall) {
							const logContext = fetchingLogCall[1];
							expect(logContext).toHaveProperty('filters');
						}
					}
				),
				{ numRuns: 100 }
			);

			mockLoggerInfo.mockRestore();
		});
	});

	/**
	 * Feature: polymarket-series-api, Property 18: Response logging completeness
	 * Validates: Requirements 7.4
	 *
	 * For any successful series route response, the log entry should include the result
	 * count and request duration.
	 */
	describe('Property 18: Response logging completeness', () => {
		it('should log response with count and duration for any successful request', async () => {
			const { Logger } = await import('$lib/server/utils/logger');
			const mockLoggerInfo = vi.spyOn(Logger.prototype, 'info');

			await fc.assert(
				fc.asyncProperty(
					fc.array(seriesArbitrary, { minLength: 0, maxLength: 20 }),
					async (series: Series[]) => {
						mockGetSeries.mockReset();
						mockGetSeries.mockResolvedValue(series);
						mockLoggerInfo.mockClear();

						const mockUrl = new URL('http://localhost/api/series');
						const mockEvent: RequestEvent = {
							url: mockUrl
						} as RequestEvent;

						await GET(mockEvent);

						// Find the "Series fetched successfully" log call
						const successLogCall = mockLoggerInfo.mock.calls.find(
							(call) => call[0] === 'Series fetched successfully'
						);
						expect(successLogCall).toBeDefined();

						// Verify count and duration are included
						if (successLogCall) {
							const logContext = successLogCall[1];
							expect(logContext).toHaveProperty('count');
							expect(logContext).toHaveProperty('duration');
							expect(logContext?.count).toBe(series.length);
							expect(typeof logContext?.duration).toBe('number');
							expect(logContext?.duration).toBeGreaterThanOrEqual(0);
						}
					}
				),
				{ numRuns: 100 }
			);

			mockLoggerInfo.mockRestore();
		});
	});

	/**
	 * Feature: polymarket-series-api, Property 19: Error logging completeness
	 * Validates: Requirements 7.5
	 *
	 * For any failed series operation, the error log should include the request duration
	 * and error context.
	 */
	describe('Property 19: Error logging completeness', () => {
		it('should log errors with duration and context', async () => {
			const { Logger } = await import('$lib/server/utils/logger');
			const { ApiError } = await import('$lib/server/errors/api-errors');
			const mockLoggerError = vi.spyOn(Logger.prototype, 'error');

			await fc.assert(
				fc.asyncProperty(
					fc.string({ minLength: 1, maxLength: 100 }),
					fc.integer({ min: 400, max: 599 }),
					async (errorMessage, statusCode) => {
						mockGetSeries.mockReset();
						mockLoggerError.mockClear();

						// Mock service to throw an error
						const testError = new ApiError(errorMessage, statusCode, 'TEST_ERROR');
						mockGetSeries.mockRejectedValue(testError);

						const mockUrl = new URL('http://localhost/api/series');
						const mockEvent: RequestEvent = {
							url: mockUrl
						} as RequestEvent;

						await GET(mockEvent);

						// Verify error logging occurred
						expect(mockLoggerError).toHaveBeenCalled();

						// Find the error log call
						const errorLogCall = mockLoggerError.mock.calls.find(
							(call) => call[0] === 'API error in series route'
						);
						expect(errorLogCall).toBeDefined();

						// Verify duration is included in the log context
						if (errorLogCall) {
							const logContext = errorLogCall[2];
							expect(logContext).toHaveProperty('duration');
							expect(typeof logContext?.duration).toBe('number');
							expect(logContext?.duration).toBeGreaterThanOrEqual(0);
						}
					}
				),
				{ numRuns: 100 }
			);

			mockLoggerError.mockRestore();
		});

		it('should log unexpected errors with duration', async () => {
			const { Logger } = await import('$lib/server/utils/logger');
			const mockLoggerError = vi.spyOn(Logger.prototype, 'error');

			mockGetSeries.mockReset();
			mockLoggerError.mockClear();

			// Mock service to throw an unexpected error
			const unexpectedError = new Error('Unexpected error occurred');
			mockGetSeries.mockRejectedValue(unexpectedError);

			const mockUrl = new URL('http://localhost/api/series');
			const mockEvent: RequestEvent = {
				url: mockUrl
			} as RequestEvent;

			await GET(mockEvent);

			// Verify error logging occurred
			expect(mockLoggerError).toHaveBeenCalled();

			// Find the unexpected error log call
			const errorLogCall = mockLoggerError.mock.calls.find(
				(call) => call[0] === 'Unexpected error in series route'
			);
			expect(errorLogCall).toBeDefined();

			// Verify duration is included
			if (errorLogCall) {
				const logContext = errorLogCall[2];
				expect(logContext).toHaveProperty('duration');
				expect(typeof logContext?.duration).toBe('number');
				expect(logContext?.duration).toBeGreaterThanOrEqual(0);
			}

			mockLoggerError.mockRestore();
		});
	});
});
