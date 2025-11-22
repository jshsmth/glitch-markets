interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

/**
 * In-memory cache manager with TTL support and LRU eviction
 *
 * Features:
 * - Automatic expiration based on TTL
 * - LRU (Least Recently Used) eviction when cache is full
 * - Type-safe generic interface
 *
 * @example
 * ```typescript
 * const cache = new CacheManager(100);
 *
 * // Store data with 60 second TTL
 * cache.set('key', { data: 'value' }, 60000);
 *
 * // Retrieve data
 * const data = cache.get('key');
 * ```
 */
export class CacheManager {
	private cache: Map<string, CacheEntry<unknown>>;
	private maxSize: number;
	private accessOrder: string[]; // Track access order for LRU

	/**
	 * Creates a new CacheManager instance
	 * @param maxSize - Maximum number of entries to store (default: 100)
	 */
	constructor(maxSize: number = 100) {
		this.cache = new Map();
		this.maxSize = maxSize;
		this.accessOrder = [];
	}

	/**
	 * Stores a value in the cache with a time-to-live
	 * If the cache is at maximum capacity, the least recently used entry will be evicted
	 *
	 * @param key - Unique identifier for the cached data
	 * @param data - The data to cache
	 * @param ttl - Time-to-live in milliseconds
	 *
	 * @example
	 * ```typescript
	 * cache.set('markets:crypto', markets, 60000); // Cache for 60 seconds
	 * ```
	 */
	set<T>(key: string, data: T, ttl: number): void {
		if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
			this.evictLRU();
		}

		const entry: CacheEntry<T> = {
			data,
			timestamp: Date.now(),
			ttl
		};

		this.cache.set(key, entry);
		this.updateAccessOrder(key);
	}

	/**
	 * Retrieves a value from the cache
	 * Returns null if the key doesn't exist or the data has expired
	 * Updates the access order for LRU tracking
	 *
	 * @param key - The cache key to retrieve
	 * @returns The cached data, or null if not found or expired
	 *
	 * @example
	 * ```typescript
	 * const markets = cache.get<Market[]>('markets:crypto');
	 * if (markets) {
	 *   console.log('Cache hit!');
	 * }
	 * ```
	 */
	get<T>(key: string): T | null {
		const entry = this.cache.get(key) as CacheEntry<T> | undefined;

		if (!entry) {
			return null;
		}

		if (this.isStale(key)) {
			this.cache.delete(key);
			this.removeFromAccessOrder(key);
			return null;
		}

		this.updateAccessOrder(key);
		return entry.data;
	}

	/**
	 * Checks if a key exists in the cache
	 * Note: Does not check if the entry is stale
	 *
	 * @param key - The cache key to check
	 * @returns True if the key exists, false otherwise
	 */
	has(key: string): boolean {
		return this.cache.has(key);
	}

	/**
	 * Removes all entries from the cache
	 * Resets the access order tracking
	 *
	 * @example
	 * ```typescript
	 * cache.clear(); // Remove all cached data
	 * ```
	 */
	clear(): void {
		this.cache.clear();
		this.accessOrder = [];
	}

	/**
	 * Checks if a cache entry has expired based on its TTL
	 *
	 * @param key - The cache key to check
	 * @returns True if the entry is stale or doesn't exist, false if still fresh
	 *
	 * @example
	 * ```typescript
	 * if (cache.isStale('markets:crypto')) {
	 *   // Fetch fresh data
	 * }
	 * ```
	 */
	isStale(key: string): boolean {
		const entry = this.cache.get(key);

		if (!entry) {
			return true;
		}

		const age = Date.now() - entry.timestamp;
		return age > entry.ttl;
	}

	private evictLRU(): void {
		if (this.accessOrder.length === 0) {
			return;
		}

		const lruKey = this.accessOrder[0];
		this.cache.delete(lruKey);
		this.accessOrder.shift();
	}

	private updateAccessOrder(key: string): void {
		this.removeFromAccessOrder(key);
		this.accessOrder.push(key);
	}

	private removeFromAccessOrder(key: string): void {
		const index = this.accessOrder.indexOf(key);
		if (index !== -1) {
			this.accessOrder.splice(index, 1);
		}
	}

	/**
	 * Gets the current number of entries in the cache
	 *
	 * @returns The number of cached entries
	 *
	 * @example
	 * ```typescript
	 * console.log(`Cache contains ${cache.size} entries`);
	 * ```
	 */
	get size(): number {
		return this.cache.size;
	}
}
