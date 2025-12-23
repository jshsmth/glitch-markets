/**
 * Cache Stampede Protection Utility
 *
 * Provides a reusable pattern for preventing cache stampedes (thundering herd problem)
 * where multiple concurrent requests for the same resource trigger multiple API calls.
 *
 * Pattern:
 * 1. Check cache first
 * 2. If cache miss, check if request is already in-flight
 * 3. If in-flight, wait for existing request
 * 4. If not in-flight, make request and track it
 * 5. Clean up tracking after request completes
 */

import type { CacheManager } from './cache-manager';
import type { Logger } from '../utils/logger';

export interface CacheStampedeOptions<T> {
	/**
	 * Unique cache key for this request
	 */
	cacheKey: string;

	/**
	 * Function that fetches the data and stores it in cache
	 * Should return the fetched data
	 */
	fetchFn: () => Promise<T>;

	/**
	 * Cache manager instance
	 */
	cache: CacheManager;

	/**
	 * Map tracking pending requests (shared across all method calls)
	 */
	pendingRequests: Map<string, Promise<T>>;

	/**
	 * Logger instance for debugging
	 */
	logger: Logger;

	/**
	 * Context object for logging (e.g., { filters: {...} })
	 */
	logContext?: Record<string, unknown>;

	/**
	 * Optional cache hit message override
	 */
	cacheHitMessage?: string;

	/**
	 * Optional cache miss message override
	 */
	cacheMissMessage?: string;

	/**
	 * Optional in-flight message override
	 */
	inFlightMessage?: string;
}

/**
 * Executes a fetch operation with cache stampede protection
 *
 * This function implements the cache stampede protection pattern:
 * - Returns cached data if available
 * - Prevents duplicate concurrent requests for the same key
 * - Ensures only one request is made even with concurrent calls
 *
 * @param options - Configuration options including cache, fetch function, and logging
 * @returns Promise resolving to the cached or fetched data
 *
 * @example
 * ```typescript
 * const result = await withCacheStampedeProtection({
 *   cacheKey: `markets:${JSON.stringify(filters)}`,
 *   fetchFn: () => this.fetchAndCacheMarkets(cacheKey, filters),
 *   cache: this.cache,
 *   pendingRequests: this.pendingRequests,
 *   logger: this.logger,
 *   logContext: { filters }
 * });
 * ```
 */
export async function withCacheStampedeProtection<T>(options: CacheStampedeOptions<T>): Promise<T> {
	const {
		cacheKey,
		fetchFn,
		cache,
		pendingRequests,
		logger,
		logContext = {},
		cacheHitMessage = 'Cache hit',
		cacheMissMessage = 'Cache miss, fetching from source',
		inFlightMessage = 'Request already in-flight, waiting for result'
	} = options;

	const cached = cache.get<T>(cacheKey);
	if (cached) {
		logger.info(cacheHitMessage, logContext);
		return cached;
	}

	if (pendingRequests.has(cacheKey)) {
		logger.info(inFlightMessage, logContext);
		return pendingRequests.get(cacheKey)!;
	}

	logger.info(cacheMissMessage, logContext);

	const fetchPromise = fetchFn();
	pendingRequests.set(cacheKey, fetchPromise);

	try {
		return await fetchPromise;
	} finally {
		pendingRequests.delete(cacheKey);
	}
}
