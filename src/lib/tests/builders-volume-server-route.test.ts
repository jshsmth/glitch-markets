/**
 * Property-based tests for /api/builders/volume server route
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import type { RequestEvent } from '@sveltejs/kit';
import type { BuilderVolumeEntry } from '$lib/server/api/polymarket-client';
import { arbitraries } from '$lib/tests/arbitraries/common-arbitraries.js';

// Mock the BuilderDataService to control responses
const mockGetVolumeTimeSeries = vi.fn();

vi.mock('$lib/server/services/builder-data-service', () => {
	return {
		BuilderDataService: class {
			getVolumeTimeSeries = mockGetVolumeTimeSeries;
		}
	};
});

const { GET } = await import('../../routes/api/builders/volume/+server');

// Helper to generate valid builder volume entry data
const volumeEntryArbitrary = fc.record({
	dt: arbitraries.isoDateOnly(),
	builder: arbitraries.nonEmptyString(),
	builderLogo: arbitraries.logoUrl(),
	verified: arbitraries.verified(),
	volume: arbitraries.volume(),
	activeUsers: arbitraries.activeUsers(),
	rank: arbitraries.rankString()
}) as unknown as fc.Arbitrary<BuilderVolumeEntry>;

describe('Builders Volume Server Route', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockGetVolumeTimeSeries.mockReset();
	});

	afterEach(() => {
		vi.resetAllMocks();
		mockGetVolumeTimeSeries.mockReset();
	});

	/**
	 * Feature: builders-volume-api
	 * Property: Route parameter handling
	 *
	 * For any valid query parameters sent to /api/builders/volume, the route should return
	 * daily volume time-series data for builders.
	 */
	describe('Property: Route parameter handling', () => {
		it('should return valid JSON for any valid request with filters', async () => {
			await fc.assert(
				fc.asyncProperty(
					// Generate random valid filter combinations
					fc.record({
						timePeriod: arbitraries.timePeriod()
					}),
					// Generate random volume data that the service would return
					fc.array(volumeEntryArbitrary, { minLength: 0, maxLength: 100 }),
					async (filters, volume: BuilderVolumeEntry[]) => {
						// Reset the mock for each iteration
						mockGetVolumeTimeSeries.mockReset();
						mockGetVolumeTimeSeries.mockResolvedValue(volume);

						// Build query string
						const params = new URLSearchParams();
						if (filters.timePeriod !== null) params.set('timePeriod', filters.timePeriod);

						// Create mock request with query params
						const mockRequest = {
							url: new URL(`http://localhost/api/builders/volume?${params.toString()}`)
						} as RequestEvent;

						const response = await GET(mockRequest);
						expect(response.status).toBe(200);

						const body = await response.json();
						expect(Array.isArray(body)).toBe(true);
						expect(body).toEqual(volume);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: builders-volume-api
	 * Property: Default parameter handling
	 */
	describe('Property: Default parameter handling', () => {
		it('should use default values when no query params are provided', async () => {
			const mockData: BuilderVolumeEntry[] = [
				{
					dt: '2025-11-29',
					builder: 'Builder A',
					builderLogo: 'https://example.com/a.png',
					verified: true,
					volume: 10000,
					activeUsers: 50,
					rank: '1'
				}
			];

			mockGetVolumeTimeSeries.mockResolvedValue(mockData);

			const mockRequest = {
				url: new URL('http://localhost/api/builders/volume')
			} as RequestEvent;

			const response = await GET(mockRequest);
			expect(response.status).toBe(200);

			// Verify service was called with default params
			expect(mockGetVolumeTimeSeries).toHaveBeenCalledWith({
				timePeriod: 'DAY'
			});
		});
	});

	/**
	 * Feature: builders-volume-api
	 * Property: Response caching headers
	 */
	describe('Property: Response caching headers', () => {
		it('should include proper cache headers in the response', async () => {
			mockGetVolumeTimeSeries.mockResolvedValue([]);

			const mockRequest = {
				url: new URL('http://localhost/api/builders/volume')
			} as RequestEvent;

			const response = await GET(mockRequest);

			expect(response.headers.get('Cache-Control')).toBe('public, max-age=600, s-maxage=600');
			expect(response.headers.get('CDN-Cache-Control')).toBe('public, max-age=600');
			expect(response.headers.get('Vercel-CDN-Cache-Control')).toBe('public, max-age=600');
		});
	});

	/**
	 * Feature: builders-volume-api
	 * Property: Error handling
	 */
	describe('Property: Error handling', () => {
		it('should return 400 for invalid parameters', async () => {
			const mockRequest = {
				url: new URL('http://localhost/api/builders/volume?timePeriod=INVALID')
			} as RequestEvent;

			const response = await GET(mockRequest);

			// Should return error response
			expect(response.status).toBeGreaterThanOrEqual(400);
		});

		it('should handle service errors gracefully', async () => {
			mockGetVolumeTimeSeries.mockRejectedValue(new Error('Service error'));

			const mockRequest = {
				url: new URL('http://localhost/api/builders/volume')
			} as RequestEvent;

			const response = await GET(mockRequest);

			expect(response.status).toBe(500);
		});
	});

	/**
	 * Feature: builders-volume-api
	 * Property: Time-series data consistency
	 */
	describe('Property: Time-series data consistency', () => {
		it('returned volume data should have valid date strings', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.array(volumeEntryArbitrary, { minLength: 1, maxLength: 100 }),
					async (volumeData) => {
						mockGetVolumeTimeSeries.mockReset();
						mockGetVolumeTimeSeries.mockResolvedValue(volumeData);

						const mockRequest = {
							url: new URL('http://localhost/api/builders/volume')
						} as RequestEvent;

						const response = await GET(mockRequest);
						const body = await response.json();

						// Verify all entries have valid date strings
						for (const entry of body) {
							expect(entry.dt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
							// Verify date is parseable
							const parsed = new Date(entry.dt);
							expect(parsed.toString()).not.toBe('Invalid Date');
						}
					}
				),
				{ numRuns: 100 }
			);
		});

		it('returned volume data should have non-negative volume values', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.array(volumeEntryArbitrary, { minLength: 1, maxLength: 100 }),
					async (volumeData) => {
						mockGetVolumeTimeSeries.mockReset();
						mockGetVolumeTimeSeries.mockResolvedValue(volumeData);

						const mockRequest = {
							url: new URL('http://localhost/api/builders/volume')
						} as RequestEvent;

						const response = await GET(mockRequest);
						const body = await response.json();

						// Verify all volume values are non-negative
						for (const entry of body) {
							expect(entry.volume).toBeGreaterThanOrEqual(0);
							expect(entry.activeUsers || 0).toBeGreaterThanOrEqual(0);
						}
					}
				),
				{ numRuns: 100 }
			);
		});
	});
});
