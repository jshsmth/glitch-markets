/**
 * Sports Service Layer
 * Coordinates between API client and server routes, handles caching
 */

import type { Team, SportsMetadata, TeamQueryParams } from '../api/polymarket-client.js';
import { PolymarketClient } from '../api/polymarket-client.js';
import { CacheManager } from '../cache/cache-manager.js';
import { withCacheStampedeProtection } from '../cache/cache-stampede.js';
import { loadConfig } from '../config/api-config.js';
import { Logger } from '../utils/logger.js';
import { CACHE_TTL } from '$lib/config/constants.js';

/**
 * Service layer for sports operations
 * Coordinates between API client and server routes, handles caching
 *
 * @example
 * ```typescript
 * const service = new SportsService();
 * const teams = await service.getTeams({ limit: 10, offset: 0 });
 * ```
 */
export class SportsService {
	private client: PolymarketClient;
	private cache: CacheManager;
	private logger: Logger;
	private cacheTtl: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private pendingRequests: Map<string, Promise<any>>;

	/**
	 * Creates a new SportsService instance
	 * @param cacheTtl - Cache time-to-live in milliseconds (default: 60s)
	 */
	constructor(cacheTtl: number = CACHE_TTL.DEFAULT) {
		const config = loadConfig();
		this.client = new PolymarketClient(config);
		this.cache = new CacheManager(100);
		this.logger = new Logger({ component: 'SportsService' });
		this.cacheTtl = cacheTtl;
		this.pendingRequests = new Map();
	}

	/**
	 * Fetches teams with optional filtering and pagination
	 * Results are cached to improve performance
	 *
	 * @param params - Query parameters for filtering and pagination
	 * @returns Promise resolving to an array of teams
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When params are invalid
	 *
	 * @example
	 * ```typescript
	 * const teams = await service.getTeams({
	 *   limit: 10,
	 *   offset: 0,
	 *   league: ['NBA', 'NFL']
	 * });
	 * ```
	 */
	async getTeams(params: TeamQueryParams): Promise<Team[]> {
		const cacheKey = `sports:teams:${JSON.stringify(params)}`;

		return withCacheStampedeProtection({
			cacheKey,
			fetchFn: () => this.fetchAndCacheTeams(cacheKey, params),
			cache: this.cache,
			pendingRequests: this.pendingRequests as Map<string, Promise<Team[]>>,
			logger: this.logger,
			logContext: { params },
			cacheHitMessage: 'Cache hit for teams',
			cacheMissMessage: 'Cache miss for teams, fetching from API'
		});
	}

	/**
	 * Fetches sports metadata for all sports
	 * Results are cached to improve performance
	 *
	 * @returns Promise resolving to an array of sports metadata
	 * @throws {ApiError} When the API request fails
	 *
	 * @example
	 * ```typescript
	 * const metadata = await service.getSportsMetadata();
	 * console.log(metadata); // [{ sport: "NFL", image: "...", ... }]
	 * ```
	 */
	async getSportsMetadata(): Promise<SportsMetadata[]> {
		const cacheKey = 'sports:metadata:all';

		return withCacheStampedeProtection({
			cacheKey,
			fetchFn: () => this.fetchAndCacheSportsMetadata(cacheKey),
			cache: this.cache,
			pendingRequests: this.pendingRequests as Map<string, Promise<SportsMetadata[]>>,
			logger: this.logger,
			cacheHitMessage: 'Cache hit for sports metadata',
			cacheMissMessage: 'Cache miss for sports metadata, fetching from API'
		});
	}

	/**
	 * Internal method to fetch and cache teams
	 * Separated for better cache stampede protection
	 * @private
	 */
	private async fetchAndCacheTeams(cacheKey: string, params: TeamQueryParams): Promise<Team[]> {
		const teams = await this.client.fetchTeams(params);
		this.cache.set(cacheKey, teams, this.cacheTtl);
		return teams;
	}

	/**
	 * Internal method to fetch and cache sports metadata
	 * Separated for better cache stampede protection
	 * @private
	 */
	private async fetchAndCacheSportsMetadata(cacheKey: string): Promise<SportsMetadata[]> {
		const metadata = await this.client.fetchSportsMetadata();
		this.cache.set(cacheKey, metadata, this.cacheTtl);
		return metadata;
	}

	/**
	 * Clears the cache - useful for testing
	 * @internal This method is primarily for testing purposes
	 */
	clearCache(): void {
		this.cache.clear();
	}
}
