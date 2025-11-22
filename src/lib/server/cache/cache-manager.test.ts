import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { CacheManager } from './cache-manager';

describe('CacheManager', () => {
	let cache: CacheManager;

	beforeEach(() => {
		cache = new CacheManager();
		vi.useFakeTimers();
	});

	describe('basic operations', () => {
		it('should set and get values', () => {
			cache.set('key1', 'value1', 1000);
			expect(cache.get('key1')).toBe('value1');
		});

		it('should return null for non-existent keys', () => {
			expect(cache.get('nonexistent')).toBeNull();
		});

		it('should check if key exists', () => {
			cache.set('key1', 'value1', 1000);
			expect(cache.has('key1')).toBe(true);
			expect(cache.has('key2')).toBe(false);
		});

		it('should clear all entries', () => {
			cache.set('key1', 'value1', 1000);
			cache.set('key2', 'value2', 1000);
			cache.clear();
			expect(cache.get('key1')).toBeNull();
			expect(cache.get('key2')).toBeNull();
			expect(cache.size).toBe(0);
		});
	});

	describe('TTL and staleness', () => {
		it('should return null for stale entries', () => {
			cache.set('key1', 'value1', 1000);

			// Advance time beyond TTL
			vi.advanceTimersByTime(1001);

			expect(cache.get('key1')).toBeNull();
		});

		it('should detect stale entries', () => {
			cache.set('key1', 'value1', 1000);

			expect(cache.isStale('key1')).toBe(false);

			vi.advanceTimersByTime(1001);

			expect(cache.isStale('key1')).toBe(true);
		});

		it('should return fresh data within TTL', () => {
			cache.set('key1', 'value1', 1000);

			vi.advanceTimersByTime(500);

			expect(cache.get('key1')).toBe('value1');
		});
	});

	describe('LRU eviction', () => {
		it('should evict least recently used entry when at max size', () => {
			const smallCache = new CacheManager(3);

			smallCache.set('key1', 'value1', 10000);
			smallCache.set('key2', 'value2', 10000);
			smallCache.set('key3', 'value3', 10000);

			// key1 is least recently used
			// Adding key4 should evict key1
			smallCache.set('key4', 'value4', 10000);

			expect(smallCache.get('key1')).toBeNull();
			expect(smallCache.get('key2')).toBe('value2');
			expect(smallCache.get('key3')).toBe('value3');
			expect(smallCache.get('key4')).toBe('value4');
		});

		it('should update access order on get', () => {
			const smallCache = new CacheManager(3);

			smallCache.set('key1', 'value1', 10000);
			smallCache.set('key2', 'value2', 10000);
			smallCache.set('key3', 'value3', 10000);

			// Access key1, making it most recently used
			smallCache.get('key1');

			// Now key2 is least recently used
			// Adding key4 should evict key2
			smallCache.set('key4', 'value4', 10000);

			expect(smallCache.get('key1')).toBe('value1');
			expect(smallCache.get('key2')).toBeNull();
			expect(smallCache.get('key3')).toBe('value3');
			expect(smallCache.get('key4')).toBe('value4');
		});

		it('should not evict when updating existing key', () => {
			const smallCache = new CacheManager(3);

			smallCache.set('key1', 'value1', 10000);
			smallCache.set('key2', 'value2', 10000);
			smallCache.set('key3', 'value3', 10000);

			// Update key1 - should not evict anything
			smallCache.set('key1', 'updated', 10000);

			expect(smallCache.size).toBe(3);
			expect(smallCache.get('key1')).toBe('updated');
			expect(smallCache.get('key2')).toBe('value2');
			expect(smallCache.get('key3')).toBe('value3');
		});
	});

	/**
	 * Feature: polymarket-api-integration, Property 10: Cache hit behavior
	 * Validates: Requirements 5.1, 5.2
	 */
	describe('Property 10: Cache hit behavior', () => {
		it('for any request where fresh cached data exists, should return cached data without staleness', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.string({ minLength: 1 }),
					fc.anything(),
					fc.integer({ min: 1000, max: 10000 }),
					fc.integer({ min: 0, max: 999 }),
					async (key, value, ttl, timeElapsed) => {
						const testCache = new CacheManager();

						// Set value in cache
						testCache.set(key, value, ttl);

						// Advance time but stay within TTL
						vi.advanceTimersByTime(timeElapsed);

						// Get should return the cached value
						const result = testCache.get(key);

						// Should return the exact value we set
						expect(result).toEqual(value);

						// Should not be stale
						expect(testCache.isStale(key)).toBe(false);

						// Reset timers for next iteration
						vi.clearAllTimers();
						vi.useRealTimers();
						vi.useFakeTimers();
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: polymarket-api-integration, Property 11: Cache miss behavior
	 * Validates: Requirements 5.3, 5.4
	 */
	describe('Property 11: Cache miss behavior', () => {
		it('for any request where cached data is stale or does not exist, should return null', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.string({ minLength: 1 }),
					fc.anything(),
					fc.integer({ min: 100, max: 1000 }),
					fc.integer({ min: 1001, max: 5000 }),
					async (key, value, ttl, timeElapsed) => {
						const testCache = new CacheManager();

						// Set value in cache
						testCache.set(key, value, ttl);

						// Advance time beyond TTL to make it stale
						vi.advanceTimersByTime(timeElapsed);

						// Get should return null for stale data
						const result = testCache.get(key);

						expect(result).toBeNull();

						// Should be stale
						expect(testCache.isStale(key)).toBe(true);

						// Reset timers for next iteration
						vi.clearAllTimers();
						vi.useRealTimers();
						vi.useFakeTimers();
					}
				),
				{ numRuns: 100 }
			);
		});

		it('for any non-existent key, should return null', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1 }), async (key) => {
					const testCache = new CacheManager();

					// Get should return null for non-existent key
					const result = testCache.get(key);

					expect(result).toBeNull();

					// Should be considered stale
					expect(testCache.isStale(key)).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});
	});
});
