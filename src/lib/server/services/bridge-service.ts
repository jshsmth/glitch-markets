/**
 * Bridge Service Layer
 * Coordinates bridge operations, handles caching for supported assets
 */

import type { SupportedAssets, DepositAddresses } from '../api/polymarket-client.js';
import { PolymarketClient } from '../api/polymarket-client.js';
import { CacheManager } from '../cache/cache-manager.js';
import { loadConfig } from '../config/api-config.js';
import { Logger } from '../utils/logger.js';
import { validateEthereumAddress } from '../validation/input-validator.js';
import { CACHE_TTL } from '$lib/config/constants.js';

/**
 * Service layer for bridge operations
 * Provides caching for supported assets and cache stampede protection
 *
 * @example
 * ```typescript
 * const service = new BridgeService();
 * const assets = await service.getSupportedAssets();
 * const deposits = await service.createDeposit('0x1234...');
 * ```
 */
export class BridgeService {
	private client: PolymarketClient;
	private cache: CacheManager;
	private logger: Logger;
	private cacheTtl: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private pendingRequests: Map<string, Promise<any>>;

	/**
	 * Creates a new BridgeService instance
	 * @param cacheTtl - Cache time-to-live in milliseconds (default: 5 minutes)
	 */
	constructor(cacheTtl: number = CACHE_TTL.EXTENDED) {
		const config = loadConfig();
		this.client = new PolymarketClient(config);
		this.cache = new CacheManager(100);
		this.logger = new Logger({ component: 'BridgeService' });
		this.cacheTtl = cacheTtl;
		this.pendingRequests = new Map();
	}

	/**
	 * Creates deposit addresses for a user's wallet
	 * No caching - each request generates unique addresses
	 *
	 * @param address - Ethereum wallet address
	 * @returns Promise resolving to deposit addresses
	 * @throws {ValidationError} When the address format is invalid
	 * @throws {ApiError} When the API request fails
	 *
	 * @example
	 * ```typescript
	 * const result = await service.createDeposit('0x56687bf447db6ffa42ffe2204a05edaa20f55839');
	 * console.log(result.depositAddresses);
	 * ```
	 */
	async createDeposit(address: string): Promise<DepositAddresses> {
		// Validate address format
		const validatedAddress = validateEthereumAddress(address);

		this.logger.info('Creating deposit addresses', { address: validatedAddress });

		// No caching - each request should generate unique addresses
		const result = await this.client.createBridgeDeposit(validatedAddress);

		// Count how many address types were returned
		const addressTypes = Object.keys(result.address).length;

		this.logger.info('Deposit addresses created successfully', {
			address: validatedAddress,
			addressTypes,
			hasEvm: !!result.address.evm,
			hasSvm: !!result.address.svm,
			hasBtc: !!result.address.btc
		});

		return result;
	}

	/**
	 * Gets supported assets for bridging
	 * Results are cached with cache stampede protection
	 *
	 * @returns Promise resolving to supported assets
	 * @throws {ApiError} When the API request fails
	 *
	 * @example
	 * ```typescript
	 * const assets = await service.getSupportedAssets();
	 * console.log(`${assets.supportedAssets.length} chains supported`);
	 * ```
	 */
	async getSupportedAssets(): Promise<SupportedAssets> {
		const cacheKey = this.buildCacheKey();

		// Check cache first
		const cached = this.cache.get<SupportedAssets>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for supported assets');
			return cached;
		}

		// Check if request is already in flight (cache stampede protection)
		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result');
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for supported assets, fetching from API');

		// Create promise and store it
		const fetchPromise = this.fetchAndCacheSupportedAssets(cacheKey);
		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			const result = await fetchPromise;
			return result;
		} finally {
			// Clean up pending request
			this.pendingRequests.delete(cacheKey);
		}
	}

	/**
	 * Internal method to fetch and cache supported assets
	 * Separated for better cache stampede protection
	 */
	private async fetchAndCacheSupportedAssets(cacheKey: string): Promise<SupportedAssets> {
		const result = await this.client.fetchSupportedBridgeAssets();

		// Cache the result
		this.cache.set(cacheKey, result, this.cacheTtl);
		this.logger.info('Supported assets cached successfully', {
			assetCount: result.supportedAssets.length,
			ttl: this.cacheTtl
		});

		return result;
	}

	/**
	 * Builds cache key for supported assets
	 * Static key since endpoint has no parameters
	 */
	private buildCacheKey(): string {
		return 'bridge:supported-assets';
	}
}
