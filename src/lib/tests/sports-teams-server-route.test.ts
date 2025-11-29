/**
 * Property-based tests for /api/sports/teams server route
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import type { RequestEvent } from '@sveltejs/kit';
import type { Team } from '$lib/server/api/polymarket-client';

const mockGetTeams = vi.fn();

vi.mock('$lib/server/services/sports-service', () => {
	return {
		SportsService: class {
			getTeams = mockGetTeams;
		}
	};
});

const { GET } = await import('../../routes/api/sports/teams/+server');

const teamArbitrary = fc.record({
	id: fc.integer({ min: 1 }),
	name: fc.string({ minLength: 1 }),
	league: fc.string({ minLength: 1 }),
	logo: fc.webUrl(),
	abbreviation: fc.string({ minLength: 1, maxLength: 5 }),
	city: fc.string({ minLength: 1 })
}) as unknown as fc.Arbitrary<Team>;

describe('Sports Teams Server Route', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockGetTeams.mockReset();
	});

	afterEach(() => {
		vi.resetAllMocks();
		mockGetTeams.mockReset();
	});

	describe('Property: Route parameter handling', () => {
		it('should return valid JSON for any valid request with filters', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						limit: fc.integer({ min: 1, max: 100 }),
						offset: fc.integer({ min: 0, max: 1000 }),
						league: fc.option(fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }))
					}),
					fc.array(teamArbitrary, { minLength: 0, maxLength: 50 }),
					async (filters, teams: Team[]) => {
						mockGetTeams.mockReset();
						mockGetTeams.mockResolvedValue(teams);

						const params = new URLSearchParams();
						params.set('limit', filters.limit.toString());
						params.set('offset', filters.offset.toString());
						if (filters.league !== null) {
							filters.league.forEach((l) => params.append('league', l));
						}

						const mockRequest = {
							url: new URL(`http://localhost/api/sports/teams?${params.toString()}`)
						} as unknown as RequestEvent;

						// @ts-expect-error - Mock RequestEvent for testing
						const response = await GET(mockRequest);
						expect(response.status).toBe(200);

						const body = await response.json();
						expect(Array.isArray(body)).toBe(true);
						expect(body).toEqual(teams);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	describe('Property: Error handling', () => {
		it('should handle service errors gracefully', async () => {
			mockGetTeams.mockRejectedValue(new Error('Service error'));

			const mockRequest = {
				url: new URL('http://localhost/api/sports/teams?limit=10&offset=0')
			} as unknown as RequestEvent;

			// @ts-expect-error - Mock RequestEvent for testing
			const response = await GET(mockRequest);
			expect(response.status).toBe(500);
		});
	});
});
