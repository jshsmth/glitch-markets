/**
 * Shared Singleton Instances
 * Provides singleton instances of CacheManager and PolymarketClient
 * to be shared across all service instances, improving cache hit rates
 * and reducing memory usage.
 */

import { CacheManager } from './cache-manager.js';
import { PolymarketClient } from '../api/polymarket-client.js';
import { loadConfig } from '../config/api-config.js';

let sharedCache: CacheManager | null = null;
let sharedClient: PolymarketClient | null = null;

/**
 * Returns a singleton instance of CacheManager
 * All services share this cache, improving hit rates across routes
 *
 * @returns Shared CacheManager instance with 500-item capacity
 */
export function getSharedCache(): CacheManager {
	if (!sharedCache) {
		sharedCache = new CacheManager(500);
	}
	return sharedCache;
}

/**
 * Returns a singleton instance of PolymarketClient
 * All services share this client, enabling connection pooling
 * and reducing overhead
 *
 * @returns Shared PolymarketClient instance
 */
export function getSharedClient(): PolymarketClient {
	if (!sharedClient) {
		const config = loadConfig();
		sharedClient = new PolymarketClient(config);
	}
	return sharedClient;
}

/**
 * Clears the shared cache
 * Useful for testing or manual cache invalidation
 */
export function clearSharedCache(): void {
	if (sharedCache) {
		sharedCache.clear();
	}
}

/**
 * Resets all singleton instances
 * Primarily for testing purposes
 * @internal
 */
export function resetSharedInstances(): void {
	sharedCache = null;
	sharedClient = null;
}
