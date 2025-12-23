interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

/**
 * Node in the doubly-linked list for LRU tracking
 */
class LRUNode {
	key: string;
	prev: LRUNode | null;
	next: LRUNode | null;

	constructor(key: string) {
		this.key = key;
		this.prev = null;
		this.next = null;
	}
}

/**
 * In-memory cache manager with TTL support and efficient LRU eviction
 *
 * Features:
 * - Automatic expiration based on TTL
 * - O(1) LRU (Least Recently Used) eviction when cache is full
 * - Type-safe generic interface
 * - Efficient operations using doubly-linked list
 *
 * Performance:
 * - get(): O(1)
 * - set(): O(1)
 * - eviction: O(1)
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
	private nodeMap: Map<string, LRUNode>; // Maps keys to DLL nodes
	private head: LRUNode | null; // Most recently used (MRU)
	private tail: LRUNode | null; // Least recently used (LRU)
	private maxSize: number;

	/**
	 * Creates a new CacheManager instance
	 * @param maxSize - Maximum number of entries to store (default: 100)
	 */
	constructor(maxSize: number = 100) {
		this.cache = new Map();
		this.nodeMap = new Map();
		this.head = null;
		this.tail = null;
		this.maxSize = maxSize;
	}

	/**
	 * Stores a value in the cache with a time-to-live
	 * If the cache is at maximum capacity, the least recently used entry will be evicted
	 * O(1) complexity
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
		this.markAsRecentlyUsed(key);
	}

	/**
	 * Retrieves a value from the cache
	 * Returns null if the key doesn't exist or the data has expired
	 * Updates the access order for LRU tracking in O(1) time
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
			this.removeNode(key);
			return null;
		}

		this.markAsRecentlyUsed(key);
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
		this.nodeMap.clear();
		this.head = null;
		this.tail = null;
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

	/**
	 * Evicts the least recently used entry from the cache
	 * O(1) complexity using doubly-linked list
	 */
	private evictLRU(): void {
		if (!this.tail) {
			return;
		}

		const lruKey = this.tail.key;
		this.cache.delete(lruKey);
		this.removeNode(lruKey);
	}

	/**
	 * Marks a key as recently used by moving it to the head of the list
	 * O(1) complexity
	 */
	private markAsRecentlyUsed(key: string): void {
		let node = this.nodeMap.get(key);

		if (node) {
			this.removeNode(key);
		}

		node = new LRUNode(key);
		this.nodeMap.set(key, node);

		if (!this.head) {
			this.head = node;
			this.tail = node;
		} else {
			node.next = this.head;
			this.head.prev = node;
			this.head = node;
		}
	}

	/**
	 * Removes a node from the doubly-linked list
	 * O(1) complexity
	 */
	private removeNode(key: string): void {
		const node = this.nodeMap.get(key);

		if (!node) {
			return;
		}

		if (node.prev) {
			node.prev.next = node.next;
		} else {
			this.head = node.next;
		}

		if (node.next) {
			node.next.prev = node.prev;
		} else {
			this.tail = node.prev;
		}

		this.nodeMap.delete(key);
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

/**
 * Pre-configured cache TTL constants (in milliseconds)
 */
export const CACHE_TTL = {
	/** 1 minute - suitable for frequently updated data */
	DEFAULT: 60_000,

	/** 5 minutes - suitable for semi-static data */
	MEDIUM: 300_000,

	/** 1 hour - suitable for rarely changing data */
	LONG: 3_600_000,

	/** 5 seconds - suitable for real-time data */
	SHORT: 5_000
} as const;
