/**
 * Deterministic Cache Key Builder
 *
 * Provides a reliable way to generate cache keys from objects that:
 * - Always produces the same key for equivalent objects (regardless of property order)
 * - Is faster than JSON.stringify for simple objects
 * - Handles nested objects, arrays, and primitive values
 * - Produces human-readable keys for debugging
 *
 * Replaces repeated `JSON.stringify()` calls throughout the codebase which:
 * - Are expensive (parsing + stringifying on every cache lookup)
 * - Can produce different keys for equivalent objects due to property order
 * - Don't handle undefined values consistently
 */

/**
 * Builds a deterministic cache key from an object
 *
 * Properties are sorted alphabetically to ensure consistent keys regardless of
 * object property order. Nested objects and arrays are handled recursively.
 *
 * @param prefix - The cache key prefix (e.g., 'markets', 'events')
 * @param params - The parameters object to serialize
 * @returns A deterministic cache key string
 *
 * @example
 * ```typescript
 * // These produce the same key:
 * buildCacheKey('markets', { active: true, limit: 50 });
 * buildCacheKey('markets', { limit: 50, active: true });
 * // => "markets:active=true&limit=50"
 *
 * // Handles nested objects:
 * buildCacheKey('search', {
 *   query: 'crypto',
 *   filters: { active: true, category: 'sports' }
 * });
 * // => "search:filters.active=true&filters.category=sports&query=crypto"
 * ```
 */
export function buildCacheKey(prefix: string, params?: Record<string, unknown> | object): string {
	if (!params || Object.keys(params).length === 0) {
		return prefix;
	}

	const parts = serializeObject(params as Record<string, unknown>);
	return `${prefix}:${parts}`;
}

/**
 * Serializes an object into a deterministic string representation
 * Sorts keys alphabetically and handles nested structures
 */
function serializeObject(obj: Record<string, unknown>, parentKey = ''): string {
	const keys = Object.keys(obj).sort();
	const parts: string[] = [];

	for (const key of keys) {
		const fullKey = parentKey ? `${parentKey}.${key}` : key;
		const value = obj[key];

		if (value === undefined || value === null) {
			continue;
		}

		if (Array.isArray(value)) {
			if (value.length > 0) {
				parts.push(`${fullKey}=${serializeArray(value)}`);
			}
		} else if (typeof value === 'object') {
			const nested = serializeObject(value as Record<string, unknown>, fullKey);
			if (nested) {
				parts.push(nested);
			}
		} else {
			parts.push(`${fullKey}=${String(value)}`);
		}
	}

	return parts.join('&');
}

/**
 * Serializes an array into a deterministic string representation
 */
function serializeArray(arr: unknown[]): string {
	return arr
		.map((item) => {
			if (item === null || item === undefined) {
				return '';
			}
			if (typeof item === 'object') {
				return Array.isArray(item)
					? `[${serializeArray(item)}]`
					: `{${serializeObject(item as Record<string, unknown>)}}`;
			}
			return String(item);
		})
		.filter(Boolean)
		.join(',');
}

/**
 * Alternative: Use JSON.stringify with sorted keys
 *
 * This is a simpler but slightly slower alternative for cases where
 * human-readable keys aren't important.
 *
 * @param prefix - The cache key prefix
 * @param params - The parameters object to serialize
 * @returns A deterministic cache key using sorted JSON
 *
 * @example
 * ```typescript
 * buildCacheKeyJSON('markets', { limit: 50, active: true });
 * // => 'markets:{"active":true,"limit":50}'
 * ```
 */
export function buildCacheKeyJSON(
	prefix: string,
	params?: Record<string, unknown> | object
): string {
	if (!params || Object.keys(params).length === 0) {
		return prefix;
	}

	return `${prefix}:${JSON.stringify(sortObjectKeys(params))}`;
}

/**
 * Recursively sorts object keys for consistent JSON serialization
 */
function sortObjectKeys(obj: unknown): unknown {
	if (obj === null || obj === undefined) {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(sortObjectKeys);
	}

	if (typeof obj === 'object') {
		const sorted: Record<string, unknown> = {};
		const keys = Object.keys(obj as Record<string, unknown>).sort();

		for (const key of keys) {
			sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
		}

		return sorted;
	}

	return obj;
}
