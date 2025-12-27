/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { BuilderDataService } from './builder-data-service';
import type { BuilderLeaderboardEntry, BuilderVolumeEntry } from '../api/polymarket-client';
import { loadConfig } from '../config/api-config';

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

describe('BuilderDataService', () => {
	let service: BuilderDataService;

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

		service = new BuilderDataService();
	});

	/**
	 * Feature: builder-leaderboard-caching
	 * Property: Cache hit consistency - repeated identical requests return same cached data
	 */
	describe('Property: Cache hit consistency for leaderboard', () => {
		it('for any valid leaderboard params, consecutive requests with identical params should return cached results', async () => {
			// Generator for leaderboard params
			const paramsArb = fc.record({
				timePeriod: fc.oneof(
					fc.constant('DAY'),
					fc.constant('WEEK'),
					fc.constant('MONTH'),
					fc.constant('ALL')
				),
				limit: fc.integer({ min: 1, max: 50 }),
				offset: fc.integer({ min: 0, max: 1000 })
			});

			// Generator for leaderboard entry
			const entryArb = fc.record({
				builder: fc.string({ minLength: 1, maxLength: 50 }),
				volume: fc.float({ min: 0, max: 10000000, noNaN: true }),
				rank: fc.integer({ min: 1, max: 1000 }).map(String),
				activeUsers: fc.integer({ min: 0, max: 10000 }),
				verified: fc.boolean(),
				builderLogo: fc.webUrl()
			});

			await fc.assert(
				fc.asyncProperty(
					paramsArb,
					fc.array(entryArb, { minLength: 0, maxLength: 50 }),
					async (params, mockData) => {
						// Reset mocks completely before each property test run
						vi.clearAllMocks();

						// Setup mock - get client and cache instances
						const mockClient = vi.mocked((service as any).client);
						const mockCache = vi.mocked((service as any).cache);

						// Set up fresh mock implementations for this test iteration
						mockCache.get = vi.fn().mockReturnValue(null);
						mockCache.set = vi.fn();
						mockClient.fetchBuilderLeaderboard = vi.fn().mockResolvedValue(mockData);

						// First call should hit API
						const result1 = await service.getLeaderboard(params);

						// Second call with identical params should use cache (return cached value)
						mockCache.get = vi.fn().mockReturnValue(mockData);
						const result2 = await service.getLeaderboard(params);

						// Verify API was only called once
						expect(mockClient.fetchBuilderLeaderboard).toHaveBeenCalledTimes(1);

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
	 * Feature: builder-volume-caching
	 * Property: Cache hit consistency for volume time-series
	 */
	describe('Property: Cache hit consistency for volume time-series', () => {
		it('for any valid volume params, consecutive requests with identical params should return cached results', async () => {
			// Generator for volume params
			const paramsArb = fc.record({
				timePeriod: fc.oneof(
					fc.constant('DAY'),
					fc.constant('WEEK'),
					fc.constant('MONTH'),
					fc.constant('ALL')
				)
			});

			// Generator for date strings in YYYY-MM-DD format
			// Using deterministic integer-based generation instead of Date objects
			const dateStringArb = fc
				.tuple(
					fc.integer({ min: 2020, max: 2030 }), // year
					fc.integer({ min: 1, max: 12 }), // month
					fc.integer({ min: 1, max: 28 }) // day (using 28 to avoid month-length issues)
				)
				.map(([year, month, day]) => {
					const monthStr = month.toString().padStart(2, '0');
					const dayStr = day.toString().padStart(2, '0');
					return `${year}-${monthStr}-${dayStr}`;
				});

			// Generator for volume entry with deterministic date generation
			const volumeArb = fc.record({
				dt: dateStringArb,
				builder: fc.string({ minLength: 1, maxLength: 50 }),
				builderLogo: fc.webUrl(),
				verified: fc.boolean(),
				volume: fc.float({ min: 0, max: 10000000, noNaN: true }),
				activeUsers: fc.integer({ min: 0, max: 10000 }),
				rank: fc.integer({ min: 1, max: 1000 }).map(String)
			});

			await fc.assert(
				fc.asyncProperty(
					paramsArb,
					fc.array(volumeArb, { minLength: 0, maxLength: 100 }),
					async (params, mockData) => {
						// Reset mocks completely before each property test run
						vi.clearAllMocks();

						// Setup mock - get client and cache instances
						const mockClient = vi.mocked((service as any).client);
						const mockCache = vi.mocked((service as any).cache);

						// Set up fresh mock implementations for this test iteration
						mockCache.get = vi.fn().mockReturnValue(null);
						mockCache.set = vi.fn();
						mockClient.fetchBuilderVolume = vi.fn().mockResolvedValue(mockData);

						// First call should hit API
						const result1 = await service.getVolumeTimeSeries(params);

						// Second call with identical params should use cache (return cached value)
						mockCache.get = vi.fn().mockReturnValue(mockData);
						const result2 = await service.getVolumeTimeSeries(params);

						// Verify API was only called once
						expect(mockClient.fetchBuilderVolume).toHaveBeenCalledTimes(1);

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
	 * Feature: builder-leaderboard-cache-isolation
	 * Property: Different params produce different cache keys
	 */
	describe('Property: Cache isolation for different parameters', () => {
		it('requests with different leaderboard params should not share cached results', async () => {
			const mockClient = vi.mocked((service as any).client);

			const mockData1: BuilderLeaderboardEntry[] = [
				{
					builder: 'Builder A',
					volume: 10000,
					rank: '1',
					activeUsers: 50,
					verified: true,
					builderLogo: 'https://example.com/a.png'
				}
			];
			const mockData2: BuilderLeaderboardEntry[] = [
				{
					builder: 'Builder B',
					volume: 5000,
					rank: '2',
					activeUsers: 25,
					verified: false,
					builderLogo: 'https://example.com/b.png'
				}
			];

			mockClient.fetchBuilderLeaderboard = vi
				.fn()
				.mockResolvedValueOnce(mockData1)
				.mockResolvedValueOnce(mockData2);

			// Request with DAY time period
			const result1 = await service.getLeaderboard({ timePeriod: 'DAY', limit: 25, offset: 0 });

			// Request with WEEK time period
			const result2 = await service.getLeaderboard({ timePeriod: 'WEEK', limit: 25, offset: 0 });

			// API should be called twice (different cache keys)
			expect(mockClient.fetchBuilderLeaderboard).toHaveBeenCalledTimes(2);

			// Results should be different
			expect(result1).toEqual(mockData1);
			expect(result2).toEqual(mockData2);
		});

		it('requests with different volume params should not share cached results', async () => {
			const mockClient = vi.mocked((service as any).client);

			const mockData1: BuilderVolumeEntry[] = [
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
			const mockData2: BuilderVolumeEntry[] = [
				{
					dt: '2025-11-22',
					builder: 'Builder B',
					builderLogo: 'https://example.com/b.png',
					verified: false,
					volume: 5000,
					activeUsers: 25,
					rank: '2'
				}
			];

			mockClient.fetchBuilderVolume = vi
				.fn()
				.mockResolvedValueOnce(mockData1)
				.mockResolvedValueOnce(mockData2);

			// Request with DAY time period
			const result1 = await service.getVolumeTimeSeries({ timePeriod: 'DAY' });

			// Request with WEEK time period
			const result2 = await service.getVolumeTimeSeries({ timePeriod: 'WEEK' });

			// API should be called twice (different cache keys)
			expect(mockClient.fetchBuilderVolume).toHaveBeenCalledTimes(2);

			// Results should be different
			expect(result1).toEqual(mockData1);
			expect(result2).toEqual(mockData2);
		});
	});

	/**
	 * Feature: builder-request-deduplication
	 * Property: Concurrent identical requests should only trigger one API call
	 */
	describe('Property: Request deduplication', () => {
		it('concurrent identical leaderboard requests should only call API once', async () => {
			const mockClient = vi.mocked((service as any).client);
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

			// Simulate slow API response
			mockClient.fetchBuilderLeaderboard = vi
				.fn()
				.mockImplementation(
					() => new Promise((resolve) => setTimeout(() => resolve(mockData), 50))
				);

			const params = { timePeriod: 'DAY' as const, limit: 25, offset: 0 };

			// Fire 5 concurrent requests
			const results = await Promise.all([
				service.getLeaderboard(params),
				service.getLeaderboard(params),
				service.getLeaderboard(params),
				service.getLeaderboard(params),
				service.getLeaderboard(params)
			]);

			// API should only be called once
			expect(mockClient.fetchBuilderLeaderboard).toHaveBeenCalledTimes(1);

			// All results should be identical
			results.forEach((result) => {
				expect(result).toEqual(mockData);
			});
		});

		it('concurrent identical volume requests should only call API once', async () => {
			const mockClient = vi.mocked((service as any).client);
			const mockData: BuilderVolumeEntry[] = [
				{
					dt: '2025-11-29',
					builder: 'Builder A',
					volume: 10000,
					activeUsers: 50,
					rank: '1',
					verified: true,
					builderLogo: 'https://example.com/a.png'
				}
			];

			// Simulate slow API response
			mockClient.fetchBuilderVolume = vi
				.fn()
				.mockImplementation(
					() => new Promise((resolve) => setTimeout(() => resolve(mockData), 50))
				);

			const params = { timePeriod: 'DAY' as const };

			// Fire 5 concurrent requests
			const results = await Promise.all([
				service.getVolumeTimeSeries(params),
				service.getVolumeTimeSeries(params),
				service.getVolumeTimeSeries(params),
				service.getVolumeTimeSeries(params),
				service.getVolumeTimeSeries(params)
			]);

			// API should only be called once
			expect(mockClient.fetchBuilderVolume).toHaveBeenCalledTimes(1);

			// All results should be identical
			results.forEach((result) => {
				expect(result).toEqual(mockData);
			});
		});
	});

	/**
	 * Feature: builder-error-propagation
	 * Property: API errors should propagate correctly to callers
	 */
	describe('Property: Error propagation', () => {
		it('leaderboard API errors should propagate to caller', async () => {
			const mockClient = vi.mocked((service as any).client);
			const testError = new Error('API Error');

			mockClient.fetchBuilderLeaderboard = vi.fn().mockRejectedValue(testError);

			await expect(
				service.getLeaderboard({ timePeriod: 'DAY', limit: 25, offset: 0 })
			).rejects.toThrow('API Error');
		});

		it('volume API errors should propagate to caller', async () => {
			const mockClient = vi.mocked((service as any).client);
			const testError = new Error('API Error');

			mockClient.fetchBuilderVolume = vi.fn().mockRejectedValue(testError);

			await expect(service.getVolumeTimeSeries({ timePeriod: 'DAY' })).rejects.toThrow('API Error');
		});
	});
});
