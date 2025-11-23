/**
 * Search Service Layer
 * Coordinates between API client and server routes, handles caching
 */

import type { SearchResults } from '../api/polymarket-client.js';
import { PolymarketClient } from '../api/polymarket-client.js';
import { CacheManager } from '../cache/cache-manager.js';
import { loadConfig } from '../config/api-config.js';
import { Logger } from '../utils/logger.js';

export interface SearchOptions {
	q: string;
	cache?: boolean;
	eventsStatus?: string;
	limitPerType?: number;
	page?: number;
	eventsTags?: string[];
	keepClosedMarkets?: number;
	sort?: string;
	ascending?: boolean;
	searchTags?: boolean;
	searchProfiles?: boolean;
	recurrence?: string;
	excludeTagIds?: number[];
	optimized?: boolean;
}

/**
 * Service layer for search operations
 * Coordinates between API client and server routes, handles caching and cache stampede protection
 *
 * @example
 * ```typescript
 * const service = new SearchService();
 * const results = await service.search({ q: 'bitcoin', limitPerType: 10 });
 * ```
 */
export class SearchService {
	private client: PolymarketClient;
	private cache: CacheManager;
	private logger: Logger;
	private cacheTtl: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private pendingRequests: Map<string, Promise<any>>;

	/**
	 * Creates a new SearchService instance
	 * @param cacheTtl - Cache time-to-live in milliseconds (default: 60000ms = 1 minute)
	 */
	constructor(cacheTtl: number = 60000) {
		const config = loadConfig();
		this.client = new PolymarketClient(config);
		this.cache = new CacheManager(100);
		this.logger = new Logger({ component: 'SearchService' });
		this.cacheTtl = cacheTtl;
		this.pendingRequests = new Map();
	}

	/**
	 * Searches for markets, events, and profiles
	 * Results are cached to improve performance unless cache is disabled
	 *
	 * @param options - Search options including query and filters
	 * @returns Promise resolving to search results
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When search parameters are invalid
	 *
	 * @example
	 * ```typescript
	 * // Search for bitcoin-related content
	 * const results = await service.search({
	 *   q: 'bitcoin',
	 *   limitPerType: 10,
	 *   searchTags: true,
	 *   searchProfiles: true
	 * });
	 * ```
	 */
	async search(options: SearchOptions): Promise<SearchResults> {
		const cacheKey = this.buildCacheKey(options);

		// Check if caching is disabled
		if (options.cache === false) {
			this.logger.info('Cache disabled for search request', { options });
			return this.fetchAndCacheSearch(cacheKey, options, true);
		}

		const cached = this.cache.get<SearchResults>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for search', { query: options.q });
			return cached;
		}

		// Check if request is already in-flight (cache stampede protection)
		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { query: options.q });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for search, fetching from API', { query: options.q });

		// Create the promise for fetching data
		const fetchPromise = this.fetchAndCacheSearch(cacheKey, options);

		// Store the promise so concurrent requests can wait for it
		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			const result = await fetchPromise;
			return result;
		} finally {
			// Clean up the pending request
			this.pendingRequests.delete(cacheKey);
		}
	}

	/**
	 * Internal method to fetch and cache search results
	 * Separated for better cache stampede protection
	 */
	private async fetchAndCacheSearch(
		cacheKey: string,
		options: SearchOptions,
		skipCache: boolean = false
	): Promise<SearchResults> {
		// Build params object for API client
		const params: Record<string, string | number | boolean | string[] | number[]> = {
			q: options.q
		};

		if (options.eventsStatus !== undefined) params.events_status = options.eventsStatus;
		if (options.limitPerType !== undefined) params.limit_per_type = options.limitPerType;
		if (options.page !== undefined) params.page = options.page;
		if (options.eventsTags !== undefined && options.eventsTags.length > 0)
			params.events_tag = options.eventsTags;
		if (options.keepClosedMarkets !== undefined)
			params.keep_closed_markets = options.keepClosedMarkets;
		if (options.sort !== undefined) params.sort = options.sort;
		if (options.ascending !== undefined) params.ascending = options.ascending;
		if (options.searchTags !== undefined) params.search_tags = options.searchTags;
		if (options.searchProfiles !== undefined) params.search_profiles = options.searchProfiles;
		if (options.recurrence !== undefined) params.recurrence = options.recurrence;
		if (options.excludeTagIds !== undefined && options.excludeTagIds.length > 0)
			params.exclude_tag_id = options.excludeTagIds;
		if (options.optimized !== undefined) params.optimized = options.optimized;

		const results = await this.client.fetchSearch({ params });

		// Cache the results unless skipCache is true
		if (!skipCache) {
			this.cache.set(cacheKey, results, this.cacheTtl);
		}

		return results;
	}

	/**
	 * Builds a cache key from search options
	 */
	private buildCacheKey(options: SearchOptions): string {
		return `search:${JSON.stringify(options)}`;
	}
}
