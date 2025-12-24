/**
 * Simple memoization utility for expensive pure functions
 * Caches results based on a cache key
 */

export function memoize<T, Args extends unknown[]>(
	fn: (...args: Args) => T,
	getKey: (...args: Args) => string
): (...args: Args) => T {
	const cache = new Map<string, T>();

	return (...args: Args): T => {
		const key = getKey(...args);

		if (cache.has(key)) {
			return cache.get(key)!;
		}

		const result = fn(...args);
		cache.set(key, result);

		if (cache.size > 1000) {
			const firstKey = cache.keys().next().value;
			if (firstKey !== undefined) {
				cache.delete(firstKey);
			}
		}

		return result;
	};
}
