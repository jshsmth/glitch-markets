/**
 * Series Service Layer
 * Coordinates between API client and server routes, handles caching and filtering
 */

import type { Series } from '../api/polymarket-client.js';
import { PolymarketClient } from '../api/polymarket-client.js';
import { CacheManager } from '../cache/cache-manager.js';
import { loadConfig } from '../config/api-config.js';
import { Logger } from '../utils/logger.js';
import { CACHE_TTL } from '$lib/config/constants.js';

export interface SeriesFilters {
	category?: string;
	active?: boolean;
	closed?: boolean;
	limit?: number;
	offset?: number;
}

export interface SeriesSearchOptions extends SeriesFilters {
	query?: string;
	sortBy?: 'volume' | 'liquidity' | 'createdAt';
	sortOrder?: 'asc' | 'desc';
}

/**
 * Service layer for series operations
 * Coordinates between API client and server routes, handles caching and filtering
 *
 * @example
 * ```typescript
 * const service = new SeriesService();
 * const series = await service.getSeries({ category: 'crypto', active: true });
 * ```
 */
export class SeriesService {
	private client: PolymarketClient;
	private cache: CacheManager;
	private logger: Logger;
	private cacheTtl: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private pendingRequests: Map<string, Promise<any>>;

	/**
	 * Creates a new SeriesService instance
	 * @param cacheTtl - Cache time-to-live in milliseconds (default: 1 minute)
	 */
	constructor(cacheTtl: number = CACHE_TTL.DEFAULT) {
		const config = loadConfig();
		this.client = new PolymarketClient(config);
		this.cache = new CacheManager(100);
		this.logger = new Logger({ component: 'SeriesService' });
		this.cacheTtl = cacheTtl;
		this.pendingRequests = new Map();
	}

	/**
	 * Fetches series with optional filtering
	 * Results are cached to improve performance
	 *
	 * @param filters - Optional filters to apply (category, active status, pagination, etc.)
	 * @returns Promise resolving to an array of series matching the filters
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When filter parameters are invalid
	 *
	 * @example
	 * ```typescript
	 * // Get active crypto series
	 * const series = await service.getSeries({
	 *   category: 'crypto',
	 *   active: true,
	 *   limit: 50
	 * });
	 * ```
	 */
	async getSeries(filters: SeriesFilters = {}): Promise<Series[]> {
		const cacheKey = `series:${JSON.stringify(filters)}`;

		const cached = this.cache.get<Series[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for series', { filters });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { filters });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for series, fetching from API', { filters });

		const fetchPromise = this.fetchAndCacheSeries(cacheKey, filters);
		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			const result = await fetchPromise;
			return result;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	/**
	 * Internal method to fetch and cache series
	 * Separated for better cache stampede protection
	 */
	private async fetchAndCacheSeries(cacheKey: string, filters: SeriesFilters): Promise<Series[]> {
		const params: Record<string, string | number | boolean> = {};
		if (filters.category !== undefined) params.category = filters.category;
		if (filters.active !== undefined) params.active = filters.active;
		if (filters.closed !== undefined) params.closed = filters.closed;
		if (filters.limit !== undefined) params.limit = filters.limit;
		if (filters.offset !== undefined) params.offset = filters.offset;

		const series = await this.client.fetchSeries({ params });
		const filtered = this.applyFilters(series, filters);
		this.cache.set(cacheKey, filtered, this.cacheTtl);

		return filtered;
	}

	private applyFilters(series: Series[], filters: SeriesFilters): Series[] {
		let filtered = series;

		if (filters.category !== undefined) {
			filtered = filtered.filter((s) => s.categories.some((cat) => cat.name === filters.category));
		}

		if (filters.active !== undefined) {
			filtered = filtered.filter((s) => s.active === filters.active);
		}

		if (filters.closed !== undefined) {
			filtered = filtered.filter((s) => s.closed === filters.closed);
		}

		return filtered;
	}

	/**
	 * Fetches a specific series by ID
	 * Results are cached to improve performance
	 *
	 * @param id - The unique series ID
	 * @returns Promise resolving to the series or null if not found
	 * @throws {ApiError} When the API request fails (except 404)
	 * @throws {ValidationError} When the ID is invalid
	 *
	 * @example
	 * ```typescript
	 * const series = await service.getSeriesById('series-123');
	 * if (series) {
	 *   console.log(series.title);
	 * }
	 * ```
	 */
	async getSeriesById(id: string): Promise<Series | null> {
		const cacheKey = `series:id:${id}`;

		const cached = this.cache.get<Series>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for series by ID', { id });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { id });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for series by ID, fetching from API', { id });

		const fetchPromise = this.fetchAndCacheSeriesById(cacheKey, id);
		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			const result = await fetchPromise;
			return result;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	/**
	 * Internal method to fetch and cache series by ID
	 * Separated for better cache stampede protection
	 */
	private async fetchAndCacheSeriesById(cacheKey: string, id: string): Promise<Series | null> {
		try {
			const series = await this.client.fetchSeriesById(id);
			this.cache.set(cacheKey, series, this.cacheTtl);
			return series;
		} catch (error) {
			if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
				this.logger.info('Series not found', { id });
				return null;
			}
			throw error;
		}
	}

	/**
	 * Searches series with advanced filtering, text search, and sorting
	 * Results are cached based on the filter parameters
	 *
	 * @param options - Search options including filters, query, sortBy, and sortOrder
	 * @returns Promise resolving to an array of series matching the search criteria
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When search parameters are invalid
	 *
	 * @example
	 * ```typescript
	 * // Search for active crypto series sorted by volume
	 * const series = await service.searchSeries({
	 *   query: 'bitcoin',
	 *   category: 'crypto',
	 *   active: true,
	 *   sortBy: 'volume',
	 *   sortOrder: 'desc'
	 * });
	 * ```
	 */
	async searchSeries(options: SeriesSearchOptions = {}): Promise<Series[]> {
		const filters: SeriesFilters = {
			category: options.category,
			active: options.active,
			closed: options.closed,
			limit: options.limit,
			offset: options.offset
		};

		let series = await this.getSeries(filters);

		if (options.query !== undefined && options.query.trim() !== '') {
			const queryLower = options.query.toLowerCase();
			series = series.filter((s) => s.title?.toLowerCase().includes(queryLower) ?? false);
		}

		if (options.sortBy) {
			series = this.sortSeries(series, options.sortBy, options.sortOrder || 'desc');
		}

		return series;
	}

	/**
	 * Sorts series by the specified field and order
	 * @private
	 */
	private sortSeries(
		series: Series[],
		sortBy: 'volume' | 'liquidity' | 'createdAt',
		sortOrder: 'asc' | 'desc'
	): Series[] {
		const sorted = [...series].sort((a, b) => {
			let aValue: number;
			let bValue: number;

			switch (sortBy) {
				case 'volume':
					aValue = a.volume ?? 0;
					bValue = b.volume ?? 0;
					break;
				case 'liquidity':
					aValue = a.liquidity ?? 0;
					bValue = b.liquidity ?? 0;
					break;
				case 'createdAt':
					aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
					bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
					break;
			}

			if (sortOrder === 'asc') {
				return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
			} else {
				return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
			}
		});

		return sorted;
	}
}
