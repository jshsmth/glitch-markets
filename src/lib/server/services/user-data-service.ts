/**
 * User Data Service Layer
 * Coordinates between API client and server routes, handles caching and filtering for user data
 */

import type {
	Position,
	Trade,
	Activity,
	MarketHolders,
	PortfolioValue,
	ClosedPosition
} from '../api/polymarket-client.js';
import { PolymarketClient } from '../api/polymarket-client.js';
import { CacheManager } from '../cache/cache-manager.js';
import { loadConfig } from '../config/api-config.js';
import { Logger } from '../utils/logger.js';

/**
 * Service layer for user data operations
 * Coordinates between API client and server routes, handles caching and filtering
 *
 * @example
 * ```typescript
 * const service = new UserDataService();
 * const positions = await service.getCurrentPositions('0x123...', ['market1']);
 * ```
 */
export class UserDataService {
	private client: PolymarketClient;
	private cache: CacheManager;
	private logger: Logger;
	private cacheTtl: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private pendingRequests: Map<string, Promise<any>>;

	/**
	 * Creates a new UserDataService instance
	 * @param cacheTtl - Cache time-to-live in milliseconds (default: 60000ms = 1 minute)
	 */
	constructor(cacheTtl: number = 60000) {
		const config = loadConfig();
		this.client = new PolymarketClient(config);
		this.cache = new CacheManager(100);
		this.logger = new Logger({ component: 'UserDataService' });
		this.cacheTtl = cacheTtl;
		this.pendingRequests = new Map();
	}

	/**
	 * Fetches current positions for a user with optional market filtering
	 * Results are cached to improve performance
	 *
	 * @param user - The user's proxy wallet address
	 * @param markets - Optional array of market token identifiers to filter by
	 * @returns Promise resolving to an array of positions
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When parameters are invalid
	 *
	 * @example
	 * ```typescript
	 * const positions = await service.getCurrentPositions('0x123...', ['market1']);
	 * ```
	 */
	async getCurrentPositions(user: string, markets?: string[]): Promise<Position[]> {
		const cacheKey = `positions:${JSON.stringify({ user, markets })}`;

		const cached = this.cache.get<Position[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for positions', { user, markets });
			return cached;
		}

		// Check if request is already in-flight (cache stampede protection)
		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { user, markets });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for positions, fetching from API', { user, markets });

		const fetchPromise = this.fetchAndCachePositions(cacheKey, user, markets);
		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			return await fetchPromise;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	private async fetchAndCachePositions(
		cacheKey: string,
		user: string,
		markets?: string[]
	): Promise<Position[]> {
		const positions = await this.client.fetchCurrentPositions(user, markets);
		const filtered = markets ? this.filterPositionsByMarkets(positions, markets) : positions;
		this.cache.set(cacheKey, filtered, this.cacheTtl);
		return filtered;
	}

	private filterPositionsByMarkets(positions: Position[], markets: string[]): Position[] {
		const marketSet = new Set(markets.map((m) => m.toLowerCase()));
		return positions.filter(
			(position) =>
				marketSet.has(position.conditionId.toLowerCase()) ||
				marketSet.has(position.slug.toLowerCase())
		);
	}

	/**
	 * Fetches trades with optional user and market filtering
	 * Results are cached to improve performance
	 *
	 * @param user - Optional user's proxy wallet address
	 * @param markets - Optional array of market token identifiers
	 * @returns Promise resolving to an array of trades
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When parameters are invalid or both are missing
	 *
	 * @example
	 * ```typescript
	 * const trades = await service.getTrades('0x123...', ['market1']);
	 * ```
	 */
	async getTrades(user?: string, markets?: string[]): Promise<Trade[]> {
		const cacheKey = `trades:${JSON.stringify({ user, markets })}`;

		const cached = this.cache.get<Trade[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for trades', { user, markets });
			return cached;
		}

		// Check if request is already in-flight (cache stampede protection)
		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { user, markets });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for trades, fetching from API', { user, markets });

		const fetchPromise = this.fetchAndCacheTrades(cacheKey, user, markets);
		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			return await fetchPromise;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	private async fetchAndCacheTrades(
		cacheKey: string,
		user?: string,
		markets?: string[]
	): Promise<Trade[]> {
		const trades = await this.client.fetchTrades(user, markets);
		const filtered = this.filterTrades(trades, user, markets);
		this.cache.set(cacheKey, filtered, this.cacheTtl);
		return filtered;
	}

	private filterTrades(trades: Trade[], user?: string, markets?: string[]): Trade[] {
		let filtered = trades;

		if (user) {
			const userLower = user.toLowerCase();
			filtered = filtered.filter((trade) => trade.proxyWallet.toLowerCase() === userLower);
		}

		if (markets && markets.length > 0) {
			const marketSet = new Set(markets.map((m) => m.toLowerCase()));
			filtered = filtered.filter(
				(trade) =>
					marketSet.has(trade.conditionId.toLowerCase()) || marketSet.has(trade.slug.toLowerCase())
			);
		}

		return filtered;
	}

	/**
	 * Fetches activity history for a user
	 * Results are cached to improve performance
	 *
	 * @param user - The user's proxy wallet address
	 * @returns Promise resolving to an array of activity records
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When the user parameter is invalid
	 *
	 * @example
	 * ```typescript
	 * const activity = await service.getUserActivity('0x123...');
	 * ```
	 */
	async getUserActivity(user: string): Promise<Activity[]> {
		const cacheKey = `activity:${user}`;

		const cached = this.cache.get<Activity[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for activity', { user });
			return cached;
		}

		// Check if request is already in-flight (cache stampede protection)
		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { user });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for activity, fetching from API', { user });

		const fetchPromise = this.fetchAndCacheActivity(cacheKey, user);
		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			return await fetchPromise;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	private async fetchAndCacheActivity(cacheKey: string, user: string): Promise<Activity[]> {
		const activity = await this.client.fetchUserActivity(user);
		this.cache.set(cacheKey, activity, this.cacheTtl);
		return activity;
	}

	/**
	 * Fetches top holders for specific markets
	 * Results are cached to improve performance
	 *
	 * @param markets - Array of market token identifiers
	 * @returns Promise resolving to an array of market holders
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When the markets parameter is invalid or empty
	 *
	 * @example
	 * ```typescript
	 * const holders = await service.getTopHolders(['market1', 'market2']);
	 * ```
	 */
	async getTopHolders(markets: string[]): Promise<MarketHolders[]> {
		const cacheKey = `holders:${JSON.stringify(markets)}`;

		const cached = this.cache.get<MarketHolders[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for holders', { markets });
			return cached;
		}

		// Check if request is already in-flight (cache stampede protection)
		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { markets });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for holders, fetching from API', { markets });

		const fetchPromise = this.fetchAndCacheHolders(cacheKey, markets);
		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			return await fetchPromise;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	private async fetchAndCacheHolders(
		cacheKey: string,
		markets: string[]
	): Promise<MarketHolders[]> {
		const holders = await this.client.fetchTopHolders(markets);
		this.cache.set(cacheKey, holders, this.cacheTtl);
		return holders;
	}

	/**
	 * Fetches portfolio value for a user with optional market filtering
	 * Results are cached to improve performance
	 *
	 * @param user - The user's proxy wallet address
	 * @param markets - Optional array of market token identifiers to filter by
	 * @returns Promise resolving to an array of portfolio values
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When parameters are invalid
	 *
	 * @example
	 * ```typescript
	 * const value = await service.getPortfolioValue('0x123...', ['market1']);
	 * ```
	 */
	async getPortfolioValue(user: string, markets?: string[]): Promise<PortfolioValue[]> {
		const cacheKey = `value:${JSON.stringify({ user, markets })}`;

		const cached = this.cache.get<PortfolioValue[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for portfolio value', { user, markets });
			return cached;
		}

		// Check if request is already in-flight (cache stampede protection)
		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { user, markets });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for portfolio value, fetching from API', { user, markets });

		const fetchPromise = this.fetchAndCachePortfolioValue(cacheKey, user, markets);
		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			return await fetchPromise;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	private async fetchAndCachePortfolioValue(
		cacheKey: string,
		user: string,
		markets?: string[]
	): Promise<PortfolioValue[]> {
		const values = await this.client.fetchPortfolioValue(user, markets);
		this.cache.set(cacheKey, values, this.cacheTtl);
		return values;
	}

	/**
	 * Fetches closed positions for a user
	 * Results are cached to improve performance
	 *
	 * @param user - The user's proxy wallet address
	 * @returns Promise resolving to an array of closed positions
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When the user parameter is invalid
	 *
	 * @example
	 * ```typescript
	 * const closedPositions = await service.getClosedPositions('0x123...');
	 * ```
	 */
	async getClosedPositions(user: string): Promise<ClosedPosition[]> {
		const cacheKey = `closed-positions:${user}`;

		const cached = this.cache.get<ClosedPosition[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for closed positions', { user });
			return cached;
		}

		// Check if request is already in-flight (cache stampede protection)
		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { user });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for closed positions, fetching from API', { user });

		const fetchPromise = this.fetchAndCacheClosedPositions(cacheKey, user);
		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			return await fetchPromise;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	private async fetchAndCacheClosedPositions(
		cacheKey: string,
		user: string
	): Promise<ClosedPosition[]> {
		const closedPositions = await this.client.fetchClosedPositions(user);
		this.cache.set(cacheKey, closedPositions, this.cacheTtl);
		return closedPositions;
	}
}
