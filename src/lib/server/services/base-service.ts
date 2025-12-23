/**
 * Base Service Class
 * Provides shared functionality for all service layer classes
 */

import { PolymarketClient } from '../api/polymarket-client.js';
import { CacheManager } from '../cache/cache-manager.js';
import { loadConfig } from '../config/api-config.js';
import { Logger } from '../utils/logger.js';
import { CACHE_TTL } from '$lib/config/constants.js';

/**
 * Base class for all service layer classes
 * Handles common initialization, caching, and data fetching patterns
 */
export abstract class BaseService {
	protected client: PolymarketClient;
	protected cache: CacheManager;
	protected logger: Logger;
	protected cacheTtl: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected pendingRequests: Map<string, Promise<any>>;

	/**
	 * Creates a new BaseService instance
	 * @param componentName - Name of the component for logging
	 * @param cacheTtl - Cache time-to-live in milliseconds
	 */
	constructor(componentName: string, cacheTtl: number = CACHE_TTL.DEFAULT) {
		const config = loadConfig();
		this.client = new PolymarketClient(config);
		this.cache = new CacheManager(100);
		this.logger = new Logger({ component: componentName });
		this.cacheTtl = cacheTtl;
		this.pendingRequests = new Map();
	}

	/**
	 * Generic helper for fetching single entities by ID/slug with caching and stampede protection
	 * Handles 404 errors gracefully by returning null
	 *
	 * @param cacheKey - The cache key for this entity
	 * @param id - The unique identifier (ID or slug)
	 * @param fetchFn - Function to fetch the entity from the API
	 * @param logContext - Additional context for logging
	 * @returns Promise resolving to the entity or null if not found
	 *
	 * @example
	 * ```typescript
	 * async getMarketById(id: string): Promise<Market | null> {
	 *   return this.fetchSingleEntity(
	 *     `market:id:${id}`,
	 *     id,
	 *     (id) => this.client.fetchMarketById(id),
	 *     { id }
	 *   );
	 * }
	 * ```
	 */
	protected async fetchSingleEntity<T>(
		cacheKey: string,
		id: string,
		fetchFn: (id: string) => Promise<T>,
		logContext?: Record<string, unknown>
	): Promise<T | null> {
		const cached = this.cache.get<T>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for entity', logContext);
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', logContext);
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for entity, fetching from API', logContext);

		const fetchPromise = (async () => {
			try {
				const entity = await fetchFn(id);
				this.cache.set(cacheKey, entity, this.cacheTtl);
				return entity;
			} catch (error) {
				if (this.is404Error(error)) {
					this.logger.info('Entity not found', logContext);
					return null;
				}
				throw error;
			}
		})();

		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			return await fetchPromise;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	/**
	 * Builds parameter object by filtering out undefined values
	 * Converts filter objects to API-ready parameter objects
	 *
	 * @param filters - The filter object with potential undefined values
	 * @returns Clean parameter object with only defined values
	 *
	 * @example
	 * ```typescript
	 * const params = this.buildParams({
	 *   category: 'crypto',
	 *   active: true,
	 *   limit: undefined  // This will be filtered out
	 * });
	 * // Returns: { category: 'crypto', active: true }
	 * ```
	 */
	protected buildParams(
		filters: Record<string, unknown> | object
	): Record<string, string | number | boolean | string[]> {
		const params: Record<string, string | number | boolean | string[]> = {};

		Object.entries(filters).forEach(([key, value]) => {
			if (value !== undefined) {
				if (Array.isArray(value)) {
					params[key] = value;
				} else if (
					typeof value === 'string' ||
					typeof value === 'number' ||
					typeof value === 'boolean'
				) {
					params[key] = value;
				}
			}
		});

		return params;
	}

	/**
	 * Type guard to check if error is a 404 Not Found error
	 *
	 * @param error - The error to check
	 * @returns True if error is a 404, false otherwise
	 */
	protected is404Error(error: unknown): boolean {
		return (
			error !== null &&
			typeof error === 'object' &&
			'statusCode' in error &&
			(error as { statusCode: number }).statusCode === 404
		);
	}

	/**
	 * Clears the cache - useful for testing
	 * @internal This method is primarily for testing purposes
	 */
	clearCache(): void {
		this.cache.clear();
	}
}
