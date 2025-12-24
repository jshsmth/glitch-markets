/**
 * Market Service Layer
 * Coordinates between API client and server routes, handles caching and filtering
 */

import type { Market } from '../api/polymarket-client.js';
import { buildCacheKey } from '../cache/cache-key-builder.js';
import { withCacheStampedeProtection } from '../cache/cache-stampede.js';
import { CACHE_TTL } from '$lib/config/constants.js';
import { BaseService } from './base-service.js';
import { genericSort, parseDateForSort } from '../utils/sort-utils.js';

export interface MarketFilters {
	// Pagination
	limit?: number;
	offset?: number;
	// Sorting
	order?: string;
	ascending?: boolean;
	// Identifiers
	id?: number[];
	slug?: string[];
	clob_token_ids?: string[];
	condition_ids?: string[];
	market_maker_address?: string[];
	question_ids?: string[];
	// Metrics
	liquidity_num_min?: number;
	liquidity_num_max?: number;
	volume_num_min?: number;
	volume_num_max?: number;
	// Time
	start_date_min?: string;
	start_date_max?: string;
	end_date_min?: string;
	end_date_max?: string;
	// Categories & Tags
	tag_id?: number;
	related_tags?: boolean;
	sports_market_types?: string[];
	// Status & Type
	uma_resolution_status?: string;
	game_id?: string;
	rewards_min_size?: number;
	cyom?: boolean;
	closed?: boolean;
	active?: boolean;
	include_tag?: boolean;
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
export class MarketService extends BaseService {
	/**
	 * Creates a new MarketService instance
	 * @param cacheTtl - Cache time-to-live in milliseconds (default: 1 minute)
	 */
	constructor(cacheTtl: number = CACHE_TTL.DEFAULT) {
		super('MarketService', cacheTtl);
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
		const cacheKey = buildCacheKey('markets', filters);

		return withCacheStampedeProtection({
			cacheKey,
			fetchFn: () => this.fetchAndCacheMarkets(cacheKey, filters),
			cache: this.cache,
			pendingRequests: this.pendingRequests as Map<string, Promise<Market[]>>,
			logger: this.logger,
			logContext: { filters },
			cacheHitMessage: 'Cache hit for markets',
			cacheMissMessage: 'Cache miss for markets, fetching from API'
		});
	}

	/**
	 * Internal method to fetch and cache markets
	 * Separated for better cache stampede protection
	 */
	private async fetchAndCacheMarkets(cacheKey: string, filters: MarketFilters): Promise<Market[]> {
		const params = this.buildParams(filters);

		const markets = await this.client.fetchMarkets({ params });
		this.cache.set(cacheKey, markets, this.cacheTtl);

		return markets;
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
		return this.fetchSingleEntity<Market>(
			`market:id:${id}`,
			id,
			(id) => this.client.fetchMarketById(id),
			{ id }
		);
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
		return this.fetchSingleEntity<Market>(
			`market:slug:${slug}`,
			slug,
			(slug) => this.client.fetchMarketBySlug(slug),
			{ slug }
		);
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
		return this.fetchSingleEntity<import('../api/polymarket-client.js').Tag[]>(
			`market:tags:${id}`,
			id,
			(id) => this.client.fetchMarketTags(id),
			{ id }
		);
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

	private sortMarkets(
		markets: Market[],
		sortBy: 'volume' | 'liquidity' | 'createdAt',
		sortOrder: 'asc' | 'desc'
	): Market[] {
		return genericSort(markets, sortBy, sortOrder, {
			volume: (m) => m.volumeNum ?? 0,
			liquidity: (m) => m.liquidityNum ?? 0,
			createdAt: (m) => parseDateForSort(m.endDate)
		});
	}
}
