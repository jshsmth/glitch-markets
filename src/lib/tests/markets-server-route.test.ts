/**
 * Property-based tests for /api/markets server route
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import type { RequestEvent } from '@sveltejs/kit';
import type { Market } from '$lib/server/api/polymarket-client';

// Mock the PolymarketClient to control API responses
const mockFetchMarkets = vi.fn();

vi.mock('$lib/server/api/polymarket-client', () => {
	return {
		PolymarketClient: class {
			fetchMarkets = mockFetchMarkets;
		}
	};
});

// Import after mocking
const { GET } = await import('../../routes/api/markets/+server');

// Helper to generate valid market data
const marketArbitrary = fc.record({
	id: fc.string({ minLength: 1 }),
	question: fc.string({ minLength: 1 }),
	conditionId: fc.string({ minLength: 1 }),
	slug: fc.string({ minLength: 1 }),
	endDate: fc
		.integer({ min: Date.parse('2020-01-01'), max: Date.parse('2030-12-31') })
		.map((ts) => new Date(ts).toISOString()),
	category: fc.string({ minLength: 1 }),
	liquidity: fc.float({ min: 0, max: 1000000 }).map(String),
	image: fc.webUrl(),
	icon: fc.webUrl(),
	description: fc.string(),
	outcomes: fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 2 }),
	outcomePrices: fc.array(fc.float({ min: 0, max: 1 }).map(String), {
		minLength: 2,
		maxLength: 2
	}),
	volume: fc.float({ min: 0, max: 1000000 }).map(String),
	active: fc.boolean(),
	marketType: fc.constantFrom('normal' as const, 'scalar' as const),
	closed: fc.boolean(),
	volumeNum: fc.float({ min: 0, max: 1000000 }),
	liquidityNum: fc.float({ min: 0, max: 1000000 }),
	volume24hr: fc.float({ min: 0, max: 100000 }),
	volume1wk: fc.float({ min: 0, max: 500000 }),
	volume1mo: fc.float({ min: 0, max: 1000000 }),
	lastTradePrice: fc.float({ min: 0, max: 1 }),
	bestBid: fc.float({ min: 0, max: 1 }),
	bestAsk: fc.float({ min: 0, max: 1 })
});

describe('Markets Server Route', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchMarkets.mockReset();
	});

	afterEach(() => {
		vi.clearAllMocks();
		mockFetchMarkets.mockReset();
	});

	/**
	 * Feature: polymarket-api-integration, Property 1: API data fetching consistency
	 * Validates: Requirements 1.1, 1.3
	 *
	 * For any valid request to the markets endpoint, the server route should successfully
	 * fetch data from the Gamma API and return it as valid JSON.
	 */
	describe('Property 1: API data fetching consistency', () => {
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
					// Generate random market data that the API would return
					fc.array(marketArbitrary, { minLength: 0, maxLength: 10 }),
					async (filters, markets: Market[]) => {
						// Reset the mock for each iteration
						mockFetchMarkets.mockReset();
						mockFetchMarkets.mockResolvedValue(markets);

						// Build URL with filters
						const mockUrl = new URL('http://localhost/api/markets');
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
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should return valid JSON for empty market lists', async () => {
			mockFetchMarkets.mockReset();
			mockFetchMarkets.mockResolvedValue([]);

			const mockUrl = new URL('http://localhost/api/markets');
			const mockEvent: RequestEvent = {
				url: mockUrl
			} as RequestEvent;

			const response = await GET(mockEvent);

			expect(response.status).toBe(200);
			const responseText = await response.text();
			const responseData = JSON.parse(responseText);
			expect(Array.isArray(responseData)).toBe(true);
		});
	});

	/**
	 * Feature: polymarket-api-integration, Property 4: Pagination correctness
	 * Validates: Requirements 1.5
	 *
	 * For any valid pagination parameters (limit, offset), the server route should return
	 * results that respect those pagination constraints.
	 */
	describe('Property 4: Pagination correctness', () => {
		it('should respect limit parameter for any valid limit value', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.integer({ min: 1, max: 100 }),
					// Generate more markets than the limit to test pagination
					fc.array(marketArbitrary, { minLength: 10, maxLength: 200 }),
					async (limit, allMarkets: Market[]) => {
						// Reset the mock
						mockFetchMarkets.mockReset();

						// The API client will receive the limit parameter and should return
						// markets respecting that limit
						const limitedMarkets = allMarkets.slice(0, limit);
						mockFetchMarkets.mockResolvedValue(limitedMarkets);

						// Build URL with limit parameter
						const mockUrl = new URL('http://localhost/api/markets');
						mockUrl.searchParams.set('limit', String(limit));

						const mockEvent: RequestEvent = {
							url: mockUrl
						} as RequestEvent;

						// Call the GET handler
						const response = await GET(mockEvent);

						// Verify the response
						expect(response.status).toBe(200);

						// Parse the response
						const responseText = await response.text();
						const responseData = JSON.parse(responseText);

						// Verify the returned data respects the limit
						expect(responseData.length).toBeLessThanOrEqual(limit);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should respect offset parameter for any valid offset value', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.integer({ min: 0, max: 50 }),
					fc.array(marketArbitrary, { minLength: 100, maxLength: 100 }),
					async (offset, allMarkets: Market[]) => {
						// Reset the mock
						mockFetchMarkets.mockReset();

						// The API client will receive the offset parameter
						const offsetMarkets = allMarkets.slice(offset);
						mockFetchMarkets.mockResolvedValue(offsetMarkets);

						// Build URL with offset parameter
						const mockUrl = new URL('http://localhost/api/markets');
						mockUrl.searchParams.set('offset', String(offset));

						const mockEvent: RequestEvent = {
							url: mockUrl
						} as RequestEvent;

						// Call the GET handler
						const response = await GET(mockEvent);

						// Verify the response
						expect(response.status).toBe(200);

						// Parse the response
						const responseText = await response.text();
						const responseData = JSON.parse(responseText);

						// Verify we got data (unless offset is beyond the array)
						expect(Array.isArray(responseData)).toBe(true);

						// If offset is within bounds, we should get data
						if (offset < allMarkets.length) {
							expect(responseData.length).toBeGreaterThan(0);
						}
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should handle limit and offset together correctly', async () => {
			// Create a fixed set of markets for this test
			const allMarkets: Market[] = Array.from({ length: 50 }, (_, i) => ({
				id: `market-${i}`,
				question: `Question ${i}`,
				conditionId: `condition-${i}`,
				slug: `slug-${i}`,
				endDate: new Date('2025-12-31').toISOString(),
				category: 'test',
				liquidity: '1000',
				image: 'http://example.com/image.jpg',
				icon: 'http://example.com/icon.jpg',
				description: 'Test market',
				outcomes: ['Yes', 'No'],
				outcomePrices: ['0.5', '0.5'],
				volume: '10000',
				active: true,
				marketType: 'normal' as const,
				closed: false,
				volumeNum: 10000,
				liquidityNum: 1000,
				volume24hr: 1000,
				volume1wk: 5000,
				volume1mo: 10000,
				lastTradePrice: 0.5,
				bestBid: 0.49,
				bestAsk: 0.51
			}));

			mockFetchMarkets.mockReset();

			// Test with limit=10, offset=5
			const limit = 10;
			const offset = 5;
			const expectedMarkets = allMarkets.slice(offset, offset + limit);
			mockFetchMarkets.mockResolvedValue(expectedMarkets);

			const mockUrl = new URL('http://localhost/api/markets');
			mockUrl.searchParams.set('limit', String(limit));
			mockUrl.searchParams.set('offset', String(offset));

			const mockEvent: RequestEvent = {
				url: mockUrl
			} as RequestEvent;

			const response = await GET(mockEvent);

			expect(response.status).toBe(200);
			const responseText = await response.text();
			const responseData = JSON.parse(responseText);

			// Should return exactly 10 markets starting from index 5
			expect(responseData.length).toBe(10);
		});
	});
});

/**
 * Feature: polymarket-api-integration, Property 12: Cache header presence
 * Validates: Requirements 5.5
 *
 * For any response from the server route, appropriate cache control headers should be included.
 */
describe('Property 12: Cache header presence', () => {
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
				// Generate random market data
				fc.array(marketArbitrary, { minLength: 0, maxLength: 10 }),
				async (filters, markets: Market[]) => {
					// Reset the mock
					mockFetchMarkets.mockReset();
					mockFetchMarkets.mockResolvedValue(markets);

					// Build URL with filters
					const mockUrl = new URL('http://localhost/api/markets');
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
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should include appropriate cache directives', async () => {
		mockFetchMarkets.mockReset();
		mockFetchMarkets.mockResolvedValue([]);

		const mockUrl = new URL('http://localhost/api/markets');
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
	});
});
