/**
 * Property-based tests for /api/builders/leaderboard server route
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import type { RequestEvent } from '@sveltejs/kit';
import type { BuilderLeaderboardEntry } from '$lib/server/api/polymarket-client';
import { arbitraries } from '$lib/tests/arbitraries/common-arbitraries.js';

// Mock the BuilderDataService to control responses
const mockGetLeaderboard = vi.fn();

vi.mock('$lib/server/services/builder-data-service', () => {
	return {
		BuilderDataService: class {
			getLeaderboard = mockGetLeaderboard;
		}
	};
});

const { GET } = await import('../../routes/api/builders/leaderboard/+server');

// Helper to generate valid builder leaderboard entry data
const leaderboardEntryArbitrary = fc.record({
	builder: arbitraries.nonEmptyString(),
	volume: arbitraries.volume(),
	rank: arbitraries.rankString(),
	activeUsers: arbitraries.activeUsers(),
	verified: arbitraries.verified(),
	builderLogo: arbitraries.logoUrl()
}) as unknown as fc.Arbitrary<BuilderLeaderboardEntry>;

describe('Builders Leaderboard Server Route', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockGetLeaderboard.mockReset();
	});

	afterEach(() => {
		vi.resetAllMocks();
		mockGetLeaderboard.mockReset();
	});

	/**
	 * Feature: builders-leaderboard-api
	 * Property: Route parameter handling
	 *
	 * For any valid query parameters sent to /api/builders/leaderboard, the route should return
	 * a ranked list of builders matching the parameters.
	 */
	describe('Property: Route parameter handling', () => {
		it('should return valid JSON for any valid request with filters', async () => {
			await fc.assert(
				fc.asyncProperty(
					// Generate random valid filter combinations
					fc.record({
						timePeriod: arbitraries.timePeriod(),
						limit: fc.option(fc.integer({ min: 1, max: 50 })),
						offset: arbitraries.offset()
					}),
					// Generate random leaderboard data that the service would return
					fc.array(leaderboardEntryArbitrary, { minLength: 0, maxLength: 50 }),
					async (filters, leaderboard: BuilderLeaderboardEntry[]) => {
						// Reset the mock for each iteration
						mockGetLeaderboard.mockReset();
						mockGetLeaderboard.mockResolvedValue(leaderboard);

						// Build query string
						const params = new URLSearchParams();
						if (filters.timePeriod !== null) params.set('timePeriod', filters.timePeriod);
						if (filters.limit !== null) params.set('limit', filters.limit.toString());
						if (filters.offset !== null) params.set('offset', filters.offset.toString());

						// Create mock request with query params
						const mockRequest = {
							url: new URL(`http://localhost/api/builders/leaderboard?${params.toString()}`)
						} as RequestEvent;

						const response = await GET(mockRequest);
						expect(response.status).toBe(200);

						const body = await response.json();
						expect(Array.isArray(body)).toBe(true);
						expect(body).toEqual(leaderboard);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: builders-leaderboard-api
	 * Property: Default parameter handling
	 */
	describe('Property: Default parameter handling', () => {
		it('should use default values when no query params are provided', async () => {
			const mockData: BuilderLeaderboardEntry[] = [
				{
					builder: 'Builder A',
					volume: 10000,
					rank: '1',
					activeUsers: 50,
					verified: true,
					builderLogo: 'https://example.com/a.png'
				}
			];

			mockGetLeaderboard.mockResolvedValue(mockData);

			const mockRequest = {
				url: new URL('http://localhost/api/builders/leaderboard')
			} as RequestEvent;

			const response = await GET(mockRequest);
			expect(response.status).toBe(200);

			// Verify service was called with default params
			expect(mockGetLeaderboard).toHaveBeenCalledWith({
				timePeriod: 'DAY'
			});
		});
	});

	/**
	 * Feature: builders-leaderboard-api
	 * Property: Response caching headers
	 */
	describe('Property: Response caching headers', () => {
		it('should include proper cache headers in the response', async () => {
			mockGetLeaderboard.mockResolvedValue([]);

			const mockRequest = {
				url: new URL('http://localhost/api/builders/leaderboard')
			} as RequestEvent;

			const response = await GET(mockRequest);

			expect(response.headers.get('Cache-Control')).toBe(
				'public, max-age=300, s-maxage=300, stale-while-revalidate=600'
			);
			expect(response.headers.get('CDN-Cache-Control')).toBe('public, max-age=300');
			expect(response.headers.get('Vercel-CDN-Cache-Control')).toBe('public, max-age=300');
		});
	});

	/**
	 * Feature: builders-leaderboard-api
	 * Property: Error handling
	 */
	describe('Property: Error handling', () => {
		it('should return 400 for invalid parameters', async () => {
			const mockRequest = {
				url: new URL('http://localhost/api/builders/leaderboard?limit=invalid')
			} as RequestEvent;

			const response = await GET(mockRequest);

			// Should return error response
			expect(response.status).toBeGreaterThanOrEqual(400);
		});

		it('should handle service errors gracefully', async () => {
			mockGetLeaderboard.mockRejectedValue(new Error('Service error'));

			const mockRequest = {
				url: new URL('http://localhost/api/builders/leaderboard')
			} as RequestEvent;

			const response = await GET(mockRequest);

			expect(response.status).toBe(500);
		});
	});

	/**
	 * Feature: builders-leaderboard-api
	 * Property: Rank consistency
	 */
	describe('Property: Rank consistency', () => {
		it('returned leaderboard should have consecutive or properly ordered ranks', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.array(leaderboardEntryArbitrary, { minLength: 1, maxLength: 50 }),
					async (rawLeaderboard) => {
						// Sort by rank to ensure proper ordering
						const sortedLeaderboard = rawLeaderboard
							.sort((a, b) => parseInt(a.rank) - parseInt(b.rank))
							.map((entry, index) => ({ ...entry, rank: String(index + 1) }));

						mockGetLeaderboard.mockReset();
						mockGetLeaderboard.mockResolvedValue(sortedLeaderboard);

						const mockRequest = {
							url: new URL('http://localhost/api/builders/leaderboard')
						} as RequestEvent;

						const response = await GET(mockRequest);
						const body = await response.json();

						// Verify ranks are in order
						for (let i = 0; i < body.length - 1; i++) {
							expect(parseInt(body[i].rank)).toBeLessThanOrEqual(parseInt(body[i + 1].rank));
						}
					}
				),
				{ numRuns: 100 }
			);
		});
	});
});
