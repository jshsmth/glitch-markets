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
import { BaseService } from './base-service.js';
import { buildCacheKey } from '../cache/cache-key-builder.js';
import { withCacheStampedeProtection } from '../cache/cache-stampede.js';
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
export class BuilderDataService extends BaseService {
	private cacheTtlLeaderboard: number;
	private cacheTtlVolume: number;

	/**
	 * Creates a new BuilderDataService instance
	 * @param cacheTtlLeaderboard - Cache TTL for leaderboard in milliseconds (default: 5 minutes)
	 * @param cacheTtlVolume - Cache TTL for volume time-series in milliseconds (default: 10 minutes)
	 */
	constructor(
		cacheTtlLeaderboard: number = CACHE_TTL.BUILDERS_LEADERBOARD,
		cacheTtlVolume: number = CACHE_TTL.BUILDERS_VOLUME
	) {
		super('BuilderDataService', cacheTtlLeaderboard);
		this.cacheTtlLeaderboard = cacheTtlLeaderboard;
		this.cacheTtlVolume = cacheTtlVolume;
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
		const cacheKey = buildCacheKey('builders:leaderboard', params);

		return withCacheStampedeProtection({
			cacheKey,
			fetchFn: () => this.fetchAndCacheLeaderboard(cacheKey, params),
			cache: this.cache,
			pendingRequests: this.pendingRequests as Map<string, Promise<BuilderLeaderboardEntry[]>>,
			logger: this.logger,
			logContext: { params },
			cacheHitMessage: 'Cache hit for builder leaderboard',
			cacheMissMessage: 'Cache miss for builder leaderboard, fetching from API'
		});
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
		const cacheKey = buildCacheKey('builders:volume', params);

		return withCacheStampedeProtection({
			cacheKey,
			fetchFn: () => this.fetchAndCacheVolume(cacheKey, params),
			cache: this.cache,
			pendingRequests: this.pendingRequests as Map<string, Promise<BuilderVolumeEntry[]>>,
			logger: this.logger,
			logContext: { params },
			cacheHitMessage: 'Cache hit for builder volume',
			cacheMissMessage: 'Cache miss for builder volume, fetching from API'
		});
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
}
