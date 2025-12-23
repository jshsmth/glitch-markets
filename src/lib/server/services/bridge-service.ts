/**
 * Bridge Service Layer
 * Coordinates bridge operations, handles caching for supported assets
 */

import type { SupportedAssets, DepositAddresses } from '../api/polymarket-client.js';
import { BaseService } from './base-service.js';
import { withCacheStampedeProtection } from '../cache/cache-stampede.js';
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
export class BridgeService extends BaseService {
	/**
	 * Creates a new BridgeService instance
	 * @param cacheTtl - Cache time-to-live in milliseconds (default: 5 minutes)
	 */
	constructor(cacheTtl: number = CACHE_TTL.EXTENDED) {
		super('BridgeService', cacheTtl);
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
		const validatedAddress = validateEthereumAddress(address);

		this.logger.info('Creating deposit addresses', { address: validatedAddress });

		const result = await this.client.createBridgeDeposit(validatedAddress);
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

		return withCacheStampedeProtection({
			cacheKey,
			fetchFn: () => this.fetchAndCacheSupportedAssets(cacheKey),
			cache: this.cache,
			pendingRequests: this.pendingRequests as Map<string, Promise<SupportedAssets>>,
			logger: this.logger,
			cacheHitMessage: 'Cache hit for supported assets',
			cacheMissMessage: 'Cache miss for supported assets, fetching from API'
		});
	}

	/**
	 * Internal method to fetch and cache supported assets
	 * Separated for better cache stampede protection
	 */
	private async fetchAndCacheSupportedAssets(cacheKey: string): Promise<SupportedAssets> {
		const result = await this.client.fetchSupportedBridgeAssets();

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
