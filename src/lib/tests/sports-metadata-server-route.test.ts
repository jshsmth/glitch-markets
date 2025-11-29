/**
 * Property-based tests for /api/sports/metadata server route
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import type { RequestEvent } from '@sveltejs/kit';
import type { SportsMetadata } from '$lib/server/api/polymarket-client';

const mockGetSportsMetadata = vi.fn();

vi.mock('$lib/server/services/sports-service', () => {
	return {
		SportsService: class {
			getSportsMetadata = mockGetSportsMetadata;
		}
	};
});

const { GET } = await import('../../routes/api/sports/metadata/+server');

const metadataArbitrary = fc.record({
	sport: fc.string({ minLength: 1 }),
	image: fc.webUrl(),
	description: fc.string(),
	numberOfMarkets: fc.integer({ min: 0, max: 10000 }),
	volume24h: fc.float({ min: 0, max: 10000000, noNaN: true })
}) as unknown as fc.Arbitrary<SportsMetadata>;

describe('Sports Metadata Server Route', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockGetSportsMetadata.mockReset();
	});

	afterEach(() => {
		vi.resetAllMocks();
		mockGetSportsMetadata.mockReset();
	});

	describe('Property: Response handling', () => {
		it('should return valid JSON for metadata request', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.array(metadataArbitrary, { minLength: 1, maxLength: 20 }),
					async (metadata: SportsMetadata[]) => {
						mockGetSportsMetadata.mockReset();
						mockGetSportsMetadata.mockResolvedValue(metadata);

						const mockRequest = {
							url: new URL('http://localhost/api/sports/metadata')
						} as unknown as RequestEvent;

						// @ts-expect-error - Mock RequestEvent for testing
						const response = await GET(mockRequest);
						expect(response.status).toBe(200);

						const body = await response.json();
						expect(Array.isArray(body)).toBe(true);
						expect(body).toEqual(metadata);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	describe('Property: Error handling', () => {
		it('should handle service errors gracefully', async () => {
			mockGetSportsMetadata.mockRejectedValue(new Error('Service error'));

			const mockRequest = {
				url: new URL('http://localhost/api/sports/metadata')
			} as unknown as RequestEvent;

			// @ts-expect-error - Mock RequestEvent for testing
			const response = await GET(mockRequest);
			expect(response.status).toBe(500);
		});
	});
});
