/**
 * Property-based tests for /api/search server route
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import type { RequestEvent } from '@sveltejs/kit';
import type { SearchResults } from '$lib/server/api/polymarket-client';

const mockSearch = vi.fn();

vi.mock('$lib/server/services/search-service', () => {
	return {
		SearchService: class {
			search = mockSearch;
		}
	};
});

const { GET } = await import('../../routes/api/search/+server');

const searchResultsArbitrary = fc.record({
	events: fc.array(
		fc.record({
			id: fc.string(),
			title: fc.string(),
			slug: fc.string()
		})
	),
	tags: fc.array(
		fc.record({
			id: fc.integer({ min: 1 }),
			label: fc.string(),
			slug: fc.string()
		})
	),
	profiles: fc.array(
		fc.record({
			address: fc.string(),
			username: fc.string()
		})
	),
	pagination: fc.record({
		totalResults: fc.integer({ min: 0, max: 10000 }),
		page: fc.integer({ min: 0, max: 100 }),
		limit: fc.integer({ min: 1, max: 100 })
	})
}) as unknown as fc.Arbitrary<SearchResults>;

describe('Search Server Route', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockSearch.mockReset();
	});

	afterEach(() => {
		vi.resetAllMocks();
		mockSearch.mockReset();
	});

	describe('Property: Route parameter handling', () => {
		it('should return valid JSON for any valid search query', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						q: fc.string({ minLength: 1 }),
						limitPerType: fc.option(fc.integer({ min: 1, max: 100 })),
						searchTags: fc.option(fc.boolean()),
						searchProfiles: fc.option(fc.boolean())
					}),
					searchResultsArbitrary,
					async (filters, results: SearchResults) => {
						mockSearch.mockReset();
						mockSearch.mockResolvedValue(results);

						const params = new URLSearchParams();
						params.set('q', filters.q);
						if (filters.limitPerType !== null)
							params.set('limitPerType', filters.limitPerType.toString());
						if (filters.searchTags !== null)
							params.set('searchTags', filters.searchTags.toString());
						if (filters.searchProfiles !== null)
							params.set('searchProfiles', filters.searchProfiles.toString());

						const mockRequest = {
							url: new URL(`http://localhost/api/search?${params.toString()}`)
						} as RequestEvent;

						const response = await GET(mockRequest);
						expect(response.status).toBe(200);

						const body = await response.json();
						expect(body).toEqual(results);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	describe('Property: Required query parameter', () => {
		it('should return error when q parameter is missing', async () => {
			const mockRequest = {
				url: new URL('http://localhost/api/search')
			} as RequestEvent;

			const response = await GET(mockRequest);
			expect(response.status).toBeGreaterThanOrEqual(400);
		});
	});

	describe('Property: Error handling', () => {
		it('should handle service errors gracefully', async () => {
			mockSearch.mockRejectedValue(new Error('Service error'));

			const mockRequest = {
				url: new URL('http://localhost/api/search?q=test')
			} as RequestEvent;

			const response = await GET(mockRequest);
			expect(response.status).toBe(500);
		});
	});
});
