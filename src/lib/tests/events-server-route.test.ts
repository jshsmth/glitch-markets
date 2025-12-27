/**
 * Property-based tests for /api/events server routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { RequestEvent } from '@sveltejs/kit';
import type { Event } from '$lib/server/api/polymarket-client';
import { eventArbitrary } from './helpers/test-arbitraries';

const mockFetchEvents = vi.fn();
const mockFetchEventById = vi.fn();
const mockFetchEventBySlug = vi.fn();

vi.mock('$lib/server/api/polymarket-client', () => ({
	PolymarketClient: class {
		fetchEvents = mockFetchEvents;
		fetchEventById = mockFetchEventById;
		fetchEventBySlug = mockFetchEventBySlug;
	}
}));

const eventsRoute = await import('../../routes/api/events/+server');
const eventByIdRoute = await import('../../routes/api/events/[id]/+server');
const eventBySlugRoute = await import('../../routes/api/events/slug/[slug]/+server');

describe('Events Server Routes', () => {
	beforeEach(async () => {
		vi.resetAllMocks();

		const { EventService } = await import('$lib/server/services/event-service');
		const service = new EventService();
		service.clearCache();
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
					fc.record({
						limit: fc.option(fc.integer({ min: 1, max: 100 })),
						offset: fc.option(fc.integer({ min: 0, max: 1000 })),
						category: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
						active: fc.option(fc.boolean()),
						closed: fc.option(fc.boolean())
					}),
					fc.array(eventArbitrary, { minLength: 0, maxLength: 10 }),
					async (filters, events: Event[]) => {
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
					fc.oneof(
						fc.integer({ max: -1 }).map(String),
						fc.string().filter((s) => isNaN(parseInt(s, 10)))
					),
					async (invalidLimit) => {
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
				fc.asyncProperty(fc.integer({ max: -1 }).map(String), async (invalidOffset) => {
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
				}),
				{ numRuns: 100 }
			);
		});

		it('should return properly formatted error for invalid boolean parameters', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.string().filter((s) => s !== 'true' && s !== 'false'),
					fc.constantFrom('active', 'closed'),
					async (invalidBoolean, paramName) => {
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
			const uniqueId = `non-existent-${Date.now()}-${Math.random()}`;

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
			const uniqueSlug = `non-existent-slug-${Date.now()}-${Math.random()}`;

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
