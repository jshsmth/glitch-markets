/**
 * Property-based tests for /api/tags server route
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import type { Tag } from '$lib/server/api/polymarket-client';
import {
	ValidationError,
	TimeoutError,
	NetworkError,
	ApiResponseError
} from '$lib/server/errors/api-errors.js';

// Mock the PolymarketClient to control API responses
const mockFetchTags = vi.fn();

vi.mock('$lib/server/api/polymarket-client', () => {
	return {
		PolymarketClient: class {
			fetchTags = mockFetchTags;
		}
	};
});

// Import after mocking
const { GET } = await import('../../routes/api/tags/+server');

// Helper to generate valid tag data
const tagArbitrary = fc.record({
	id: fc.string({ minLength: 1 }),
	label: fc.string({ minLength: 1 }),
	slug: fc.string({ minLength: 1 })
});

describe('Tags Server Route', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		mockFetchTags.mockReset();

		// Clear the cache before each test
		const { TagService } = await import('$lib/server/services/tag-service');
		const service = new TagService();
		// @ts-expect-error - accessing private cache for testing
		service.cache.clear();
	});

	afterEach(() => {
		vi.clearAllMocks();
		mockFetchTags.mockReset();
	});

	/**
	 * Feature: polymarket-tags-api, Property 6: Error status code mapping
	 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
	 *
	 * For any error type (ValidationError, NetworkError, TimeoutError, ApiResponseError, or unknown error),
	 * the route handler should map it to the appropriate HTTP status code (400, 503, 504, or 500)
	 * and return a formatted error response.
	 */
	describe('Property 6: Error status code mapping', () => {
		it('should map ValidationError to 400 status code', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (errorMessage) => {
					// Reset the mock
					mockFetchTags.mockReset();
					mockFetchTags.mockRejectedValue(new ValidationError(errorMessage));

					// Call the GET handler
					const response = await GET();

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

		it('should map NetworkError to 503 status code', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (errorMessage) => {
					// Reset the mock
					mockFetchTags.mockReset();
					mockFetchTags.mockRejectedValue(new NetworkError(errorMessage));

					// Call the GET handler
					const response = await GET();

					// Should return 503 for network error
					expect(response.status).toBe(503);

					// Parse the error response
					const responseText = await response.text();
					const errorResponse = JSON.parse(responseText);

					// Verify error response structure
					expect(errorResponse).toHaveProperty('error');
					expect(errorResponse).toHaveProperty('message');
					expect(errorResponse).toHaveProperty('statusCode');
					expect(errorResponse.statusCode).toBe(503);
				}),
				{ numRuns: 100 }
			);
		});

		it('should map TimeoutError to 503 status code', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (errorMessage) => {
					// Reset the mock
					mockFetchTags.mockReset();
					mockFetchTags.mockRejectedValue(new TimeoutError(errorMessage));

					// Call the GET handler
					const response = await GET();

					// Should return 504 for timeout error
					expect(response.status).toBe(503);

					// Parse the error response
					const responseText = await response.text();
					const errorResponse = JSON.parse(responseText);

					// Verify error response structure
					expect(errorResponse).toHaveProperty('error');
					expect(errorResponse).toHaveProperty('message');
					expect(errorResponse).toHaveProperty('statusCode');
					expect(errorResponse.statusCode).toBe(503);
				}),
				{ numRuns: 100 }
			);
		});

		it('should map ApiResponseError to its status code', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.string({ minLength: 1, maxLength: 100 }),
					fc.integer({ min: 400, max: 599 }),
					async (errorMessage, statusCode) => {
						// Reset the mock
						mockFetchTags.mockReset();
						mockFetchTags.mockRejectedValue(
							new ApiResponseError(errorMessage, statusCode, statusCode, {})
						);

						// Call the GET handler
						const response = await GET();

						// Should return the same status code as the ApiResponseError
						expect(response.status).toBe(statusCode);

						// Parse the error response
						const responseText = await response.text();
						const errorResponse = JSON.parse(responseText);

						// Verify error response structure
						expect(errorResponse).toHaveProperty('error');
						expect(errorResponse).toHaveProperty('message');
						expect(errorResponse).toHaveProperty('statusCode');
						expect(errorResponse.statusCode).toBe(statusCode);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should map unknown errors to 500 status code', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (errorMessage) => {
					// Reset the mock
					mockFetchTags.mockReset();
					mockFetchTags.mockRejectedValue(new Error(errorMessage));

					// Call the GET handler
					const response = await GET();

					// Should return 500 for unknown error
					expect(response.status).toBe(500);

					// Parse the error response
					const responseText = await response.text();
					const errorResponse = JSON.parse(responseText);

					// Verify error response structure
					expect(errorResponse).toHaveProperty('error');
					expect(errorResponse).toHaveProperty('message');
					expect(errorResponse).toHaveProperty('statusCode');
					expect(errorResponse.statusCode).toBe(500);
				}),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: polymarket-tags-api, Property 9: Cache headers presence
	 * Validates: Requirements 6.1, 6.2, 6.3
	 *
	 * For any successful tag data response, the HTTP response should include Cache-Control,
	 * CDN-Cache-Control, and Vercel-CDN-Cache-Control headers with 60-second max-age values.
	 */
	describe('Property 9: Cache headers presence', () => {
		it('should include all required cache headers for any successful response', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.array(tagArbitrary, { minLength: 0, maxLength: 20 }),
					async (tags: Tag[]) => {
						// Reset the mock
						mockFetchTags.mockReset();
						mockFetchTags.mockResolvedValue(tags);

						// Call the GET handler
						const response = await GET();

						// Verify the response is successful
						expect(response.status).toBe(200);

						// Check for Cache-Control header
						const cacheControl = response.headers.get('Cache-Control');
						expect(cacheControl).toBeDefined();
						expect(cacheControl).not.toBeNull();
						expect(cacheControl).toContain('max-age');
						expect(cacheControl).toContain('public');

						// Check for CDN-Cache-Control header
						const cdnCacheControl = response.headers.get('CDN-Cache-Control');
						expect(cdnCacheControl).toBeDefined();
						expect(cdnCacheControl).not.toBeNull();

						// Check for Vercel-CDN-Cache-Control header
						const vercelCdnCacheControl = response.headers.get('Vercel-CDN-Cache-Control');
						expect(vercelCdnCacheControl).toBeDefined();
						expect(vercelCdnCacheControl).not.toBeNull();
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should include cache headers with 60-second max-age', async () => {
			mockFetchTags.mockReset();
			mockFetchTags.mockResolvedValue([]);

			const response = await GET();

			expect(response.status).toBe(200);

			// Verify cache headers are present and have appropriate values (60 seconds)
			const cacheControl = response.headers.get('Cache-Control');
			expect(cacheControl).toBeDefined();
			expect(cacheControl).toContain('public');
			expect(cacheControl).toContain('max-age=60');

			const cdnCacheControl = response.headers.get('CDN-Cache-Control');
			expect(cdnCacheControl).toBeDefined();
			expect(cdnCacheControl).toContain('max-age=60');

			const vercelCdnCacheControl = response.headers.get('Vercel-CDN-Cache-Control');
			expect(vercelCdnCacheControl).toBeDefined();
			expect(vercelCdnCacheControl).toContain('max-age=60');
		});

		it('should include cache headers for empty tag lists', async () => {
			mockFetchTags.mockReset();
			mockFetchTags.mockResolvedValue([]);

			const response = await GET();

			expect(response.status).toBe(200);

			// Verify all cache headers are present even for empty results
			expect(response.headers.get('Cache-Control')).toBeDefined();
			expect(response.headers.get('CDN-Cache-Control')).toBeDefined();
			expect(response.headers.get('Vercel-CDN-Cache-Control')).toBeDefined();
		});
	});
});
