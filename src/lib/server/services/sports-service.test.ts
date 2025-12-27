/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { SportsService } from './sports-service';
import type { Team, SportsMetadata } from '../api/polymarket-client';
import { loadConfig } from '../config/api-config';
import { arbitraries } from '$lib/tests/arbitraries/common-arbitraries.js';

// Mock the dependencies
vi.mock('../api/polymarket-client');
vi.mock('../cache/cache-manager');
vi.mock('../config/api-config');
vi.mock('$lib/utils/logger', () => ({
	Logger: class {
		info = vi.fn();
		error = vi.fn();
		warn = vi.fn();
		debug = vi.fn();
		child = vi.fn().mockReturnThis();
	}
}));

describe('SportsService', () => {
	let service: SportsService;

	beforeEach(() => {
		// Reset all mocks
		vi.resetAllMocks();

		// Mock loadConfig
		vi.mocked(loadConfig).mockReturnValue({
			baseUrl: 'https://test-api.com',
			dataApiUrl: 'https://data-api.polymarket.com',
			bridgeApiUrl: 'https://bridge.polymarket.com',
			clobApiUrl: 'https://clob.polymarket.com',
			timeout: 5000,
			cacheTtl: 60,
			enableCache: true
		});

		service = new SportsService();
	});

	/**
	 * Feature: sports-teams-caching
	 * Property: Cache hit consistency - repeated identical requests return same cached data
	 */
	describe('Property: Cache hit consistency for teams', () => {
		it('for any valid team params, consecutive requests with identical params should return cached results', async () => {
			// Generator for team params
			const paramsArb = fc.record({
				limit: fc.integer({ min: 1, max: 100 }),
				offset: fc.integer({ min: 0, max: 1000 }),
				league: fc.option(fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }), {
					nil: undefined
				})
			});

			// Generator for team data
			const teamArb = fc.record({
				id: fc.integer({ min: 1 }),
				name: fc.string({ minLength: 1 }),
				league: fc.string({ minLength: 1 }),
				logo: fc.webUrl(),
				abbreviation: fc.string({ minLength: 1, maxLength: 5 }),
				alias: fc.string({ minLength: 1 }),
				record: fc.option(fc.string(), { nil: null }),
				createdAt: fc.option(arbitraries.dateString(), { nil: null }),
				updatedAt: fc.option(arbitraries.dateString(), { nil: null })
			});

			await fc.assert(
				fc.asyncProperty(
					paramsArb,
					fc.array(teamArb, { minLength: 0, maxLength: 50 }),
					async (params, mockData) => {
						// Setup mock - get client and cache instances
						const mockClient = vi.mocked((service as any).client);
						const mockCache = vi.mocked((service as any).cache);

						mockCache.get = vi.fn().mockReturnValue(null);
						mockClient.fetchTeams = vi.fn().mockResolvedValue(mockData);

						// First call should hit API
						const result1 = await service.getTeams(params);

						// Second call with identical params should use cache (return cached value)
						mockCache.get = vi.fn().mockReturnValue(mockData);
						const result2 = await service.getTeams(params);

						// Verify API was only called once
						expect(mockClient.fetchTeams).toHaveBeenCalledTimes(1);

						// Verify both results are identical
						expect(result1).toEqual(result2);
						expect(result1).toEqual(mockData);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: sports-metadata-caching
	 * Property: Cache hit consistency for sports metadata
	 */
	describe('Property: Cache hit consistency for sports metadata', () => {
		it('consecutive metadata requests should return cached results', async () => {
			// Generator for sports metadata
			const metadataArb = fc.array(
				fc.record({
					sport: fc.string({ minLength: 1 }),
					image: fc.webUrl(),
					resolution: fc.string(),
					ordering: fc.string(),
					tags: fc.string(),
					series: fc.string()
				}),
				{ minLength: 1, maxLength: 20 }
			);

			await fc.assert(
				fc.asyncProperty(metadataArb, async (mockData) => {
					// Setup mock - get client and cache instances
					const mockClient = vi.mocked((service as any).client);
					const mockCache = vi.mocked((service as any).cache);

					mockCache.get = vi.fn().mockReturnValue(null);
					mockClient.fetchSportsMetadata = vi.fn().mockResolvedValue(mockData);

					// First call should hit API
					const result1 = await service.getSportsMetadata();

					// Second call should use cache (return cached value)
					mockCache.get = vi.fn().mockReturnValue(mockData);
					const result2 = await service.getSportsMetadata();

					// Third call should also use cache
					const result3 = await service.getSportsMetadata();

					// Verify API was only called once
					expect(mockClient.fetchSportsMetadata).toHaveBeenCalledTimes(1);

					// Verify all results are identical
					expect(result1).toEqual(result2);
					expect(result2).toEqual(result3);
					expect(result1).toEqual(mockData);
				}),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: sports-cache-isolation
	 * Property: Different team params produce different cache keys
	 */
	describe('Property: Cache isolation for different parameters', () => {
		it('requests with different team params should not share cached results', async () => {
			const mockClient = vi.mocked((service as any).client);

			const mockData1: Team[] = [
				{
					id: 1,
					name: 'Lakers',
					league: 'NBA',
					logo: 'https://example.com/lakers.png',
					abbreviation: 'LAL',
					alias: 'Los Angeles',
					record: null,
					createdAt: null,
					updatedAt: null
				}
			];
			const mockData2: Team[] = [
				{
					id: 2,
					name: 'Warriors',
					league: 'NBA',
					logo: 'https://example.com/warriors.png',
					abbreviation: 'GSW',
					alias: 'Golden State',
					record: null,
					createdAt: null,
					updatedAt: null
				}
			];

			mockClient.fetchTeams = vi
				.fn()
				.mockResolvedValueOnce(mockData1)
				.mockResolvedValueOnce(mockData2);

			// Request with limit 10
			const result1 = await service.getTeams({ limit: 10, offset: 0 });

			// Request with limit 20 (different params)
			const result2 = await service.getTeams({ limit: 20, offset: 0 });

			// API should be called twice (different cache keys)
			expect(mockClient.fetchTeams).toHaveBeenCalledTimes(2);

			// Results should be different
			expect(result1).toEqual(mockData1);
			expect(result2).toEqual(mockData2);
		});

		it('requests with different league filters should not share cached results', async () => {
			const mockClient = vi.mocked((service as any).client);

			const mockData1: Team[] = [
				{
					id: 1,
					name: 'Lakers',
					league: 'NBA',
					logo: 'https://example.com/lakers.png',
					abbreviation: 'LAL',
					alias: 'Los Angeles',
					record: null,
					createdAt: null,
					updatedAt: null
				}
			];
			const mockData2: Team[] = [
				{
					id: 3,
					name: 'Patriots',
					league: 'NFL',
					logo: 'https://example.com/patriots.png',
					abbreviation: 'NE',
					alias: 'New England',
					record: null,
					createdAt: null,
					updatedAt: null
				}
			];

			mockClient.fetchTeams = vi
				.fn()
				.mockResolvedValueOnce(mockData1)
				.mockResolvedValueOnce(mockData2);

			// Request with NBA league
			const result1 = await service.getTeams({ limit: 10, offset: 0, league: ['NBA'] });

			// Request with NFL league (different params)
			const result2 = await service.getTeams({ limit: 10, offset: 0, league: ['NFL'] });

			// API should be called twice (different cache keys)
			expect(mockClient.fetchTeams).toHaveBeenCalledTimes(2);

			// Results should be different
			expect(result1).toEqual(mockData1);
			expect(result2).toEqual(mockData2);
		});
	});

	/**
	 * Feature: sports-request-deduplication
	 * Property: Concurrent identical requests should only trigger one API call
	 */
	describe('Property: Request deduplication', () => {
		it('concurrent identical team requests should only call API once', async () => {
			const mockClient = vi.mocked((service as any).client);
			const mockData: Team[] = [
				{
					id: 1,
					name: 'Lakers',
					league: 'NBA',
					logo: 'https://example.com/lakers.png',
					abbreviation: 'LAL',
					alias: 'Los Angeles',
					record: null,
					createdAt: null,
					updatedAt: null
				}
			];

			// Simulate slow API response
			mockClient.fetchTeams = vi
				.fn()
				.mockImplementation(
					() => new Promise((resolve) => setTimeout(() => resolve(mockData), 50))
				);

			const params = { limit: 10, offset: 0 };

			// Fire 5 concurrent requests
			const results = await Promise.all([
				service.getTeams(params),
				service.getTeams(params),
				service.getTeams(params),
				service.getTeams(params),
				service.getTeams(params)
			]);

			// API should only be called once
			expect(mockClient.fetchTeams).toHaveBeenCalledTimes(1);

			// All results should be identical
			results.forEach((result) => {
				expect(result).toEqual(mockData);
			});
		});

		it('concurrent metadata requests should only call API once', async () => {
			const mockClient = vi.mocked((service as any).client);
			const mockData: SportsMetadata[] = [
				{
					sport: 'NBA',
					image: 'https://example.com/nba.png',
					resolution: '',
					ordering: '',
					tags: '',
					series: ''
				}
			];

			// Simulate slow API response
			mockClient.fetchSportsMetadata = vi
				.fn()
				.mockImplementation(
					() => new Promise((resolve) => setTimeout(() => resolve(mockData), 50))
				);

			// Fire 5 concurrent requests
			const results = await Promise.all([
				service.getSportsMetadata(),
				service.getSportsMetadata(),
				service.getSportsMetadata(),
				service.getSportsMetadata(),
				service.getSportsMetadata()
			]);

			// API should only be called once
			expect(mockClient.fetchSportsMetadata).toHaveBeenCalledTimes(1);

			// All results should be identical
			results.forEach((result) => {
				expect(result).toEqual(mockData);
			});
		});
	});

	/**
	 * Feature: sports-error-propagation
	 * Property: API errors should propagate correctly to callers
	 */
	describe('Property: Error propagation', () => {
		it('teams API errors should propagate to caller', async () => {
			const mockClient = vi.mocked((service as any).client);
			const testError = new Error('API Error');

			mockClient.fetchTeams = vi.fn().mockRejectedValue(testError);

			await expect(service.getTeams({ limit: 10, offset: 0 })).rejects.toThrow('API Error');
		});

		it('metadata API errors should propagate to caller', async () => {
			const mockClient = vi.mocked((service as any).client);
			const testError = new Error('API Error');

			mockClient.fetchSportsMetadata = vi.fn().mockRejectedValue(testError);

			await expect(service.getSportsMetadata()).rejects.toThrow('API Error');
		});
	});
});
