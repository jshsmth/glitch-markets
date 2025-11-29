/**
 * Property-based tests for /api/events server routes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import type { RequestEvent } from '@sveltejs/kit';
import type { Event } from '$lib/server/api/polymarket-client';

// Mock the PolymarketClient to control API responses
const mockFetchEvents = vi.fn();
const mockFetchEventById = vi.fn();
const mockFetchEventBySlug = vi.fn();

vi.mock('$lib/server/api/polymarket-client', () => {
	return {
		PolymarketClient: class {
			fetchEvents = mockFetchEvents;
			fetchEventById = mockFetchEventById;
			fetchEventBySlug = mockFetchEventBySlug;
		}
	};
});

const eventsRoute = await import('../../routes/api/events/+server');
const eventByIdRoute = await import('../../routes/api/events/[id]/+server');
const eventBySlugRoute = await import('../../routes/api/events/slug/[slug]/+server');

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
	outcomePrices: fc.array(fc.float({ min: 0, max: 1 }).map(String), { minLength: 2, maxLength: 2 }),
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

// Helper to generate valid event data
const eventArbitrary = fc.record({
	id: fc.string({ minLength: 1 }),
	ticker: fc.string({ minLength: 1 }),
	slug: fc.string({ minLength: 1 }),
	title: fc.string({ minLength: 1 }),
	subtitle: fc.string(),
	description: fc.string(),
	resolutionSource: fc.string(),
	startDate: fc
		.integer({ min: Date.parse('2020-01-01'), max: Date.parse('2030-12-31') })
		.map((ts) => new Date(ts).toISOString()),
	creationDate: fc
		.integer({ min: Date.parse('2020-01-01'), max: Date.parse('2030-12-31') })
		.map((ts) => new Date(ts).toISOString()),
	endDate: fc
		.integer({ min: Date.parse('2020-01-01'), max: Date.parse('2030-12-31') })
		.map((ts) => new Date(ts).toISOString()),
	image: fc.webUrl(),
	icon: fc.webUrl(),
	active: fc.boolean(),
	closed: fc.boolean(),
	archived: fc.boolean(),
	new: fc.boolean(),
	featured: fc.boolean(),
	restricted: fc.boolean(),
	liquidity: fc.float({ min: 0, max: 1000000 }),
	volume: fc.float({ min: 0, max: 1000000 }),
	openInterest: fc.float({ min: 0, max: 1000000 }),
	category: fc.string({ minLength: 1 }),
	subcategory: fc.string(),
	volume24hr: fc.float({ min: 0, max: 100000 }),
	volume1wk: fc.float({ min: 0, max: 500000 }),
	volume1mo: fc.float({ min: 0, max: 1000000 }),
	volume1yr: fc.float({ min: 0, max: 5000000 }),
	commentCount: fc.integer({ min: 0, max: 10000 }),
	markets: fc.array(marketArbitrary, {
		minLength: 0,
		maxLength: 10
	}),
	categories: fc.array(
		fc.record({
			id: fc.string({ minLength: 1 }),
			name: fc.string({ minLength: 1 })
		}),
		{
			minLength: 0,
			maxLength: 5
		}
	),
	tags: fc.array(
		fc.record({
			id: fc.string({ minLength: 1 }),
			label: fc.string({ minLength: 1 }),
			slug: fc.string({ minLength: 1 })
		}),
		{ minLength: 0, maxLength: 10 }
	)
});

describe('Events Server Routes', () => {
	beforeEach(async () => {
		vi.resetAllMocks();
		mockFetchEvents.mockReset();
		mockFetchEventById.mockReset();
		mockFetchEventBySlug.mockReset();

		// Clear the cache before each test
		const { EventService } = await import('$lib/server/services/event-service');
		const service = new EventService();

		service.clearCache();
	});

	afterEach(() => {
		vi.resetAllMocks();
		mockFetchEvents.mockReset();
		mockFetchEventById.mockReset();
		mockFetchEventBySlug.mockReset();
	});

	/**
	 * Feature: polymarket-events, Property 18: Responses include cache headers
	 * Validates: Requirements 7.4
	 *
	 * For any successful response from the events routes, appropriate cache control headers
	 * should be included.
	 */
	describe('Property 18: Responses include cache headers', () => {
		it('should include cache headers for /api/events with any valid filters', async () => {
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
					// Generate random event data
					fc.array(eventArbitrary, { minLength: 0, maxLength: 10 }),
					async (filters, events: Event[]) => {
						// Reset the mock
						mockFetchEvents.mockReset();
						mockFetchEvents.mockResolvedValue(events);

						// Build URL with filters
						const mockUrl = new URL('http://localhost/api/events');
						if (filters.limit !== null) mockUrl.searchParams.set('limit', String(filters.limit));
						if (filters.offset !== null) mockUrl.searchParams.set('offset', String(filters.offset));
						if (filters.category !== null) mockUrl.searchParams.set('category', filters.category);
						if (filters.active !== null) mockUrl.searchParams.set('active', String(filters.active));
						if (filters.closed !== null) mockUrl.searchParams.set('closed', String(filters.closed));

						const mockEvent: RequestEvent = {
							url: mockUrl
						} as RequestEvent;

						// Call the GET handler
						const response = await eventsRoute.GET(mockEvent);

						// Verify the response has cache headers
						expect(response.status).toBe(200);

						// Check for Cache-Control header
						const cacheControl = response.headers.get('Cache-Control');
						expect(cacheControl).toBeDefined();
						expect(cacheControl).not.toBeNull();
						expect(cacheControl).toContain('max-age');
						expect(cacheControl).toContain('public');
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should include cache headers for /api/events/[id] with any valid ID', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
					eventArbitrary,
					async (id, event: Event) => {
						// Reset the mock
						mockFetchEventById.mockReset();
						mockFetchEventById.mockResolvedValue(event);

						const mockEvent: RequestEvent = {
							params: { id }
						} as RequestEvent;

						// Call the GET handler
						const response = await eventByIdRoute.GET(mockEvent);

						// Verify the response has cache headers
						expect(response.status).toBe(200);

						// Check for Cache-Control header
						const cacheControl = response.headers.get('Cache-Control');
						expect(cacheControl).toBeDefined();
						expect(cacheControl).not.toBeNull();
						expect(cacheControl).toContain('max-age');
						expect(cacheControl).toContain('public');
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should include cache headers for /api/events/slug/[slug] with any valid slug', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
					eventArbitrary,
					async (slug, event: Event) => {
						// Reset the mock
						mockFetchEventBySlug.mockReset();
						mockFetchEventBySlug.mockResolvedValue(event);

						const mockEvent: RequestEvent = {
							params: { slug }
						} as RequestEvent;

						// Call the GET handler
						const response = await eventBySlugRoute.GET(mockEvent);

						// Verify the response has cache headers
						expect(response.status).toBe(200);

						// Check for Cache-Control header
						const cacheControl = response.headers.get('Cache-Control');
						expect(cacheControl).toBeDefined();
						expect(cacheControl).not.toBeNull();
						expect(cacheControl).toContain('max-age');
						expect(cacheControl).toContain('public');
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should include appropriate cache directives with correct TTL', async () => {
			mockFetchEvents.mockReset();
			mockFetchEvents.mockResolvedValue([]);

			const mockUrl = new URL('http://localhost/api/events');
			const mockEvent: RequestEvent = {
				url: mockUrl
			} as RequestEvent;

			const response = await eventsRoute.GET(mockEvent);

			expect(response.status).toBe(200);

			// Verify cache headers are present and have appropriate values (60 seconds for events)
			const cacheControl = response.headers.get('Cache-Control');
			expect(cacheControl).toBeDefined();
			expect(cacheControl).toContain('public');
			expect(cacheControl).toContain('max-age=60');
		});
	});

	/**
	 * Feature: polymarket-events, Property 19: Error responses are properly formatted
	 * Validates: Requirements 7.5
	 *
	 * For any error that occurs in the events routes, the response should be properly
	 * formatted with appropriate status codes and error details.
	 */
	describe('Property 19: Error responses are properly formatted', () => {
		it('should return properly formatted error for invalid limit parameter', async () => {
			await fc.assert(
				fc.asyncProperty(
					// Generate invalid limit values (negative or non-numeric strings)
					fc.oneof(
						fc.integer({ max: -1 }).map(String),
						fc.string().filter((s) => isNaN(parseInt(s, 10)))
					),
					async (invalidLimit) => {
						mockFetchEvents.mockReset();

						const mockUrl = new URL('http://localhost/api/events');
						mockUrl.searchParams.set('limit', invalidLimit);

						const mockEvent: RequestEvent = {
							url: mockUrl
						} as RequestEvent;

						const response = await eventsRoute.GET(mockEvent);

						// Should return 400 for validation error
						expect(response.status).toBe(400);

						// Parse the error response
						const responseText = await response.text();
						const errorResponse = JSON.parse(responseText);

						// Verify error response structure
						expect(errorResponse).toHaveProperty('error');
						expect(errorResponse).toHaveProperty('message');
						expect(errorResponse).toHaveProperty('statusCode');
						expect(errorResponse.statusCode).toBe(400);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should return properly formatted error for invalid offset parameter', async () => {
			await fc.assert(
				fc.asyncProperty(
					// Generate invalid offset values
					fc.integer({ max: -1 }).map(String),
					async (invalidOffset) => {
						mockFetchEvents.mockReset();

						const mockUrl = new URL('http://localhost/api/events');
						mockUrl.searchParams.set('offset', invalidOffset);

						const mockEvent: RequestEvent = {
							url: mockUrl
						} as RequestEvent;

						const response = await eventsRoute.GET(mockEvent);

						// Should return 400 for validation error
						expect(response.status).toBe(400);

						// Parse the error response
						const responseText = await response.text();
						const errorResponse = JSON.parse(responseText);

						// Verify error response structure
						expect(errorResponse).toHaveProperty('error');
						expect(errorResponse).toHaveProperty('message');
						expect(errorResponse).toHaveProperty('statusCode');
						expect(errorResponse.statusCode).toBe(400);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should return properly formatted error for invalid boolean parameters', async () => {
			await fc.assert(
				fc.asyncProperty(
					// Generate invalid boolean values (not 'true' or 'false')
					fc.string().filter((s) => s !== 'true' && s !== 'false'),
					fc.constantFrom('active', 'closed'),
					async (invalidBoolean, paramName) => {
						mockFetchEvents.mockReset();

						const mockUrl = new URL('http://localhost/api/events');
						mockUrl.searchParams.set(paramName, invalidBoolean);

						const mockEvent: RequestEvent = {
							url: mockUrl
						} as RequestEvent;

						const response = await eventsRoute.GET(mockEvent);

						// Should return 400 for validation error
						expect(response.status).toBe(400);

						// Parse the error response
						const responseText = await response.text();
						const errorResponse = JSON.parse(responseText);

						// Verify error response structure
						expect(errorResponse).toHaveProperty('error');
						expect(errorResponse).toHaveProperty('message');
						expect(errorResponse).toHaveProperty('statusCode');
						expect(errorResponse.statusCode).toBe(400);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should return 404 for non-existent event ID', async () => {
			// Use a unique ID that won't be cached
			const uniqueId = `non-existent-${Date.now()}-${Math.random()}`;

			// Mock the service to return null (not found)
			mockFetchEventById.mockReset();
			mockFetchEventById.mockRejectedValue({
				statusCode: 404,
				message: 'Event not found'
			});

			const mockEvent: RequestEvent = {
				params: { id: uniqueId }
			} as RequestEvent;

			const response = await eventByIdRoute.GET(mockEvent);

			// Should return 404
			expect(response.status).toBe(404);

			// Parse the error response
			const responseText = await response.text();
			const errorResponse = JSON.parse(responseText);

			// Verify error response structure
			expect(errorResponse).toHaveProperty('error');
			expect(errorResponse).toHaveProperty('message');
			expect(errorResponse).toHaveProperty('statusCode');
			expect(errorResponse.statusCode).toBe(404);
		});

		it('should return 404 for non-existent event slug', async () => {
			// Use a unique slug that won't be cached
			const uniqueSlug = `non-existent-slug-${Date.now()}-${Math.random()}`;

			// Mock the service to return null (not found)
			mockFetchEventBySlug.mockReset();
			mockFetchEventBySlug.mockRejectedValue({
				statusCode: 404,
				message: 'Event not found'
			});

			const mockEvent: RequestEvent = {
				params: { slug: uniqueSlug }
			} as RequestEvent;

			const response = await eventBySlugRoute.GET(mockEvent);

			// Should return 404
			expect(response.status).toBe(404);

			// Parse the error response
			const responseText = await response.text();
			const errorResponse = JSON.parse(responseText);

			// Verify error response structure
			expect(errorResponse).toHaveProperty('error');
			expect(errorResponse).toHaveProperty('message');
			expect(errorResponse).toHaveProperty('statusCode');
			expect(errorResponse.statusCode).toBe(404);
		});

		it('should return 400 for empty event ID', async () => {
			mockFetchEventById.mockReset();

			const mockEvent: RequestEvent = {
				params: { id: '' }
			} as RequestEvent;

			const response = await eventByIdRoute.GET(mockEvent);

			// Should return 400 for validation error
			expect(response.status).toBe(400);

			// Parse the error response
			const responseText = await response.text();
			const errorResponse = JSON.parse(responseText);

			// Verify error response structure
			expect(errorResponse).toHaveProperty('error');
			expect(errorResponse).toHaveProperty('message');
			expect(errorResponse).toHaveProperty('statusCode');
			expect(errorResponse.statusCode).toBe(400);
			expect(errorResponse.message).toContain('Event ID is required');
		});

		it('should return 400 for empty event slug', async () => {
			mockFetchEventBySlug.mockReset();

			const mockEvent: RequestEvent = {
				params: { slug: '' }
			} as RequestEvent;

			const response = await eventBySlugRoute.GET(mockEvent);

			// Should return 400 for validation error
			expect(response.status).toBe(400);

			// Parse the error response
			const responseText = await response.text();
			const errorResponse = JSON.parse(responseText);

			// Verify error response structure
			expect(errorResponse).toHaveProperty('error');
			expect(errorResponse).toHaveProperty('message');
			expect(errorResponse).toHaveProperty('statusCode');
			expect(errorResponse.statusCode).toBe(400);
			expect(errorResponse.message).toContain('Event slug is required');
		});
	});
});
