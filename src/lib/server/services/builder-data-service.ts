/**
 * Builder Data Service Layer
 * Coordinates between API client and server routes, handles caching for builder data
 */

import type {
	BuilderLeaderboardParams,
	BuilderLeaderboardEntry,
	BuilderVolumeParams,
	BuilderVolumeEntry
} from '../api/polymarket-client.js';
import { PolymarketClient } from '../api/polymarket-client.js';
import { CacheManager } from '../cache/cache-manager.js';
import { loadConfig } from '../config/api-config.js';
import { Logger } from '../utils/logger.js';
import { CACHE_TTL } from '$lib/config/constants.js';

/**
 * Service layer for builder data operations
 * Coordinates between API client and server routes, handles caching
 *
 * @example
 * ```typescript
 * const service = new BuilderDataService();
 * const leaderboard = await service.getLeaderboard({
 *   timePeriod: 'WEEK',
 *   limit: 25,
 *   offset: 0
 * });
 * ```
 */
export class BuilderDataService {
	private client: PolymarketClient;
	private cache: CacheManager;
	private logger: Logger;
	private cacheTtlLeaderboard: number;
	private cacheTtlVolume: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private pendingRequests: Map<string, Promise<any>>;

	/**
	 * Creates a new BuilderDataService instance
	 * @param cacheTtlLeaderboard - Cache TTL for leaderboard in milliseconds (default: 5 minutes)
	 * @param cacheTtlVolume - Cache TTL for volume time-series in milliseconds (default: 10 minutes)
	 */
	constructor(
		cacheTtlLeaderboard: number = CACHE_TTL.BUILDERS_LEADERBOARD,
		cacheTtlVolume: number = CACHE_TTL.BUILDERS_VOLUME
	) {
		const config = loadConfig();
		this.client = new PolymarketClient(config);
		this.cache = new CacheManager(100);
		this.logger = new Logger({ component: 'BuilderDataService' });
		this.cacheTtlLeaderboard = cacheTtlLeaderboard;
		this.cacheTtlVolume = cacheTtlVolume;
		this.pendingRequests = new Map();
	}

	/**
	 * Fetches builder leaderboard with optional filtering and pagination
	 * Results are cached to improve performance
	 *
	 * @param params - Query parameters for leaderboard (timePeriod, limit, offset)
	 * @returns Promise resolving to an array of builder leaderboard entries
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When params are invalid
	 *
	 * @example
	 * ```typescript
	 * const leaderboard = await service.getLeaderboard({
	 *   timePeriod: 'WEEK',
	 *   limit: 10,
	 *   offset: 0
	 * });
	 * ```
	 */
	async getLeaderboard(params: BuilderLeaderboardParams): Promise<BuilderLeaderboardEntry[]> {
		const cacheKey = `builders:leaderboard:${JSON.stringify(params)}`;

		const cached = this.cache.get<BuilderLeaderboardEntry[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for builder leaderboard', { params });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { params });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for builder leaderboard, fetching from API', { params });

		const fetchPromise = this.fetchAndCacheLeaderboard(cacheKey, params);
		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			const result = await fetchPromise;
			return result;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	/**
	 * Fetches builder volume time-series data
	 * Results are cached to improve performance
	 *
	 * @param params - Query parameters for volume time-series (timePeriod)
	 * @returns Promise resolving to an array of builder volume entries
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When params are invalid
	 *
	 * @example
	 * ```typescript
	 * const volume = await service.getVolumeTimeSeries({ timePeriod: 'MONTH' });
	 * console.log(volume); // [{ dt: "2025-11-29", builder: "...", ... }]
	 * ```
	 */
	async getVolumeTimeSeries(params: BuilderVolumeParams): Promise<BuilderVolumeEntry[]> {
		const cacheKey = `builders:volume:${JSON.stringify(params)}`;

		const cached = this.cache.get<BuilderVolumeEntry[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for builder volume', { params });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { params });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for builder volume, fetching from API', { params });

		const fetchPromise = this.fetchAndCacheVolume(cacheKey, params);
		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			const result = await fetchPromise;
			return result;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	/**
	 * Internal method to fetch and cache leaderboard
	 * Separated for better cache stampede protection
	 * @private
	 */
	private async fetchAndCacheLeaderboard(
		cacheKey: string,
		params: BuilderLeaderboardParams
	): Promise<BuilderLeaderboardEntry[]> {
		const leaderboard = await this.client.fetchBuilderLeaderboard(params);
		this.cache.set(cacheKey, leaderboard, this.cacheTtlLeaderboard);
		return leaderboard;
	}

	/**
	 * Internal method to fetch and cache volume time-series
	 * Separated for better cache stampede protection
	 * @private
	 */
	private async fetchAndCacheVolume(
		cacheKey: string,
		params: BuilderVolumeParams
	): Promise<BuilderVolumeEntry[]> {
		const volume = await this.client.fetchBuilderVolume(params);
		this.cache.set(cacheKey, volume, this.cacheTtlVolume);
		return volume;
	}

	/**
	 * Clears the cache - useful for testing
	 * @internal This method is primarily for testing purposes
	 */
	clearCache(): void {
		this.cache.clear();
	}
}
