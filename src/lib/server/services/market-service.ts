/**
 * Market Service Layer
 * Coordinates between API client and server routes, handles caching and filtering
 */

import type { Market } from '../api/polymarket-client.js';
import { PolymarketClient } from '../api/polymarket-client.js';
import { CacheManager } from '../cache/cache-manager.js';
import { loadConfig } from '../config/api-config.js';
import { Logger } from '../utils/logger.js';

export interface MarketFilters {
	category?: string;
	active?: boolean;
	closed?: boolean;
	limit?: number;
	offset?: number;
}

export interface MarketSearchOptions extends MarketFilters {
	query?: string;
	sortBy?: 'volume' | 'liquidity' | 'createdAt';
	sortOrder?: 'asc' | 'desc';
}

/**
 * Service layer for market operations
 * Coordinates between API client and server routes, handles caching and filtering
 *
 * @example
 * ```typescript
 * const service = new MarketService();
 * const markets = await service.getMarkets({ category: 'crypto', active: true });
 * ```
 */
export class MarketService {
	private client: PolymarketClient;
	private cache: CacheManager;
	private logger: Logger;
	private cacheTtl: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private pendingRequests: Map<string, Promise<any>>;

	/**
	 * Creates a new MarketService instance
	 * @param cacheTtl - Cache time-to-live in milliseconds (default: 60000ms = 1 minute)
	 */
	constructor(cacheTtl: number = 60000) {
		const config = loadConfig();
		this.client = new PolymarketClient(config);
		this.cache = new CacheManager(100);
		this.logger = new Logger({ component: 'MarketService' });
		this.cacheTtl = cacheTtl;
		this.pendingRequests = new Map();
	}

	/**
	 * Fetches markets with optional filtering
	 * Results are cached to improve performance
	 *
	 * @param filters - Optional filters to apply (category, active status, pagination, etc.)
	 * @returns Promise resolving to an array of markets matching the filters
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When filter parameters are invalid
	 *
	 * @example
	 * ```typescript
	 * // Get active crypto markets
	 * const markets = await service.getMarkets({
	 *   category: 'crypto',
	 *   active: true,
	 *   limit: 50
	 * });
	 * ```
	 */
	async getMarkets(filters: MarketFilters = {}): Promise<Market[]> {
		const cacheKey = `markets:${JSON.stringify(filters)}`;

		const cached = this.cache.get<Market[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for markets', { filters });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { filters });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for markets, fetching from API', { filters });

		const fetchPromise = this.fetchAndCacheMarkets(cacheKey, filters);

		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			const result = await fetchPromise;
			return result;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	/**
	 * Internal method to fetch and cache markets
	 * Separated for better cache stampede protection
	 */
	private async fetchAndCacheMarkets(cacheKey: string, filters: MarketFilters): Promise<Market[]> {
		const params: Record<string, string | number | boolean> = {};
		if (filters.category !== undefined) params.category = filters.category;
		if (filters.active !== undefined) params.active = filters.active;
		if (filters.closed !== undefined) params.closed = filters.closed;
		if (filters.limit !== undefined) params.limit = filters.limit;
		if (filters.offset !== undefined) params.offset = filters.offset;

		const markets = await this.client.fetchMarkets({ params });
		const filtered = this.applyFilters(markets, filters);
		this.cache.set(cacheKey, filtered, this.cacheTtl);

		return filtered;
	}

	/**
	 * Fetches a specific market by its unique identifier
	 * Results are cached to improve performance
	 *
	 * @param id - The unique market ID
	 * @returns Promise resolving to the market, or null if not found
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When the ID is invalid
	 *
	 * @example
	 * ```typescript
	 * const market = await service.getMarketById('0x123...');
	 * if (market) {
	 *   console.log(market.question);
	 * }
	 * ```
	 */
	async getMarketById(id: string): Promise<Market | null> {
		const cacheKey = `market:id:${id}`;

		const cached = this.cache.get<Market>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for market by ID', { id });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { id });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for market by ID, fetching from API', { id });

		const fetchPromise = (async () => {
			try {
				const market = await this.client.fetchMarketById(id);
				this.cache.set(cacheKey, market, this.cacheTtl);
				return market;
			} catch (error) {
				if (
					error &&
					typeof error === 'object' &&
					'statusCode' in error &&
					error.statusCode === 404
				) {
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
	 * Fetches a specific market by its URL-friendly slug
	 * Results are cached to improve performance
	 *
	 * @param slug - The URL-friendly market identifier
	 * @returns Promise resolving to the market, or null if not found
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When the slug is invalid
	 *
	 * @example
	 * ```typescript
	 * const market = await service.getMarketBySlug('bitcoin-100k-2024');
	 * if (market) {
	 *   console.log(market.question);
	 * }
	 * ```
	 */
	async getMarketBySlug(slug: string): Promise<Market | null> {
		const cacheKey = `market:slug:${slug}`;

		const cached = this.cache.get<Market>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for market by slug', { slug });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { slug });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for market by slug, fetching from API', { slug });

		const fetchPromise = (async () => {
			try {
				const market = await this.client.fetchMarketBySlug(slug);
				this.cache.set(cacheKey, market, this.cacheTtl);
				return market;
			} catch (error) {
				if (
					error &&
					typeof error === 'object' &&
					'statusCode' in error &&
					error.statusCode === 404
				) {
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
	 * Fetches tags associated with a specific market
	 * Results are cached to improve performance
	 *
	 * @param id - The unique market ID
	 * @returns Promise resolving to an array of tags, or null if market not found
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When the ID is invalid
	 *
	 * @example
	 * ```typescript
	 * const tags = await service.getMarketTags('12');
	 * if (tags) {
	 *   console.log(tags.map(t => t.label));
	 * }
	 * ```
	 */
	async getMarketTags(id: string): Promise<import('../api/polymarket-client.js').Tag[] | null> {
		const cacheKey = `market:tags:${id}`;

		const cached = this.cache.get<import('../api/polymarket-client.js').Tag[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for market tags', { id });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { id });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for market tags, fetching from API', { id });

		const fetchPromise = (async () => {
			try {
				const tags = await this.client.fetchMarketTags(id);
				this.cache.set(cacheKey, tags, this.cacheTtl);
				return tags;
			} catch (error) {
				if (
					error &&
					typeof error === 'object' &&
					'statusCode' in error &&
					error.statusCode === 404
				) {
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
	 * Searches markets with text query, filtering, and sorting
	 * Performs case-insensitive partial text matching on market questions
	 *
	 * @param options - Search options including query, filters, and sort parameters
	 * @returns Promise resolving to an array of markets matching the search criteria
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When search parameters are invalid
	 *
	 * @example
	 * ```typescript
	 * // Search for bitcoin markets sorted by volume
	 * const markets = await service.searchMarkets({
	 *   query: 'bitcoin',
	 *   sortBy: 'volume',
	 *   sortOrder: 'desc',
	 *   active: true
	 * });
	 * ```
	 */
	async searchMarkets(options: MarketSearchOptions = {}): Promise<Market[]> {
		const markets = await this.getMarkets(options);

		let filtered = markets;
		if (options.query) {
			const queryLower = options.query.toLowerCase();
			filtered = markets.filter(
				(market) => market.question?.toLowerCase().includes(queryLower) ?? false
			);
		}

		if (options.sortBy) {
			filtered = this.sortMarkets(filtered, options.sortBy, options.sortOrder || 'desc');
		}

		return filtered;
	}

	private applyFilters(markets: Market[], filters: MarketFilters): Market[] {
		let filtered = markets;

		if (filters.category !== undefined) {
			filtered = filtered.filter((market) => market.category === filters.category);
		}

		if (filters.active !== undefined) {
			filtered = filtered.filter((market) => market.active === filters.active);
		}

		if (filters.closed !== undefined) {
			filtered = filtered.filter((market) => market.closed === filters.closed);
		}

		return filtered;
	}

	private sortMarkets(
		markets: Market[],
		sortBy: 'volume' | 'liquidity' | 'createdAt',
		sortOrder: 'asc' | 'desc'
	): Market[] {
		const sorted = [...markets];

		sorted.sort((a, b) => {
			let aValue: number;
			let bValue: number;

			switch (sortBy) {
				case 'volume':
					aValue = a.volumeNum ?? 0;
					bValue = b.volumeNum ?? 0;
					break;
				case 'liquidity':
					aValue = a.liquidityNum ?? 0;
					bValue = b.liquidityNum ?? 0;
					break;
				case 'createdAt':
					// Parse endDate as a proxy for creation date
					aValue = a.endDate ? new Date(a.endDate).getTime() : 0;
					bValue = b.endDate ? new Date(b.endDate).getTime() : 0;
					break;
				default:
					return 0;
			}

			const comparison = aValue - bValue;
			return sortOrder === 'asc' ? comparison : -comparison;
		});

		return sorted;
	}
}
