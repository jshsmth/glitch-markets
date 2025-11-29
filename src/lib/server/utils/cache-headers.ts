/**
 * Cache Headers Utility
 * Centralized cache header configuration for API endpoints
 */

export type CacheProfile =
	| 'markets-list'
	| 'market-detail'
	| 'events-list'
	| 'event-detail'
	| 'search-results'
	| 'sports-teams'
	| 'sports-metadata'
	| 'bridge-assets'
	| 'no-cache';

export interface CacheHeaders extends Record<string, string> {
	'Cache-Control': string;
	'CDN-Cache-Control': string;
	'Vercel-CDN-Cache-Control': string;
}

/**
 * Cache durations in seconds
 */
const CACHE_DURATIONS: Record<CacheProfile, number> = {
	'markets-list': 60, // 1 minute
	'market-detail': 30, // 30 seconds
	'events-list': 60, // 1 minute
	'event-detail': 60, // 1 minute
	'search-results': 300, // 5 minutes
	'sports-teams': 300, // 5 minutes (changes infrequently)
	'sports-metadata': 3600, // 1 hour (very stable data)
	'bridge-assets': 300, // 5 minutes
	'no-cache': 0 // No caching
};

/**
 * Get cache headers for a specific endpoint profile
 *
 * @param profile - The cache profile to use
 * @returns Cache headers object ready to be set on a Response
 *
 * @example
 * ```typescript
 * import { getCacheHeaders } from '$lib/server/utils/cache-headers';
 *
 * export async function GET() {
 *   const headers = getCacheHeaders('markets-list');
 *   return json(data, { headers });
 * }
 * ```
 */
export function getCacheHeaders(profile: CacheProfile): CacheHeaders {
	const maxAge = CACHE_DURATIONS[profile];

	if (maxAge === 0) {
		return {
			'Cache-Control': 'no-store, no-cache, must-revalidate',
			'CDN-Cache-Control': 'no-store',
			'Vercel-CDN-Cache-Control': 'no-store'
		};
	}

	return {
		'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
		'CDN-Cache-Control': `public, max-age=${maxAge}`,
		'Vercel-CDN-Cache-Control': `public, max-age=${maxAge}`
	};
}

/**
 * Get custom cache headers with a specific duration
 *
 * @param maxAge - Cache duration in seconds
 * @returns Cache headers object
 *
 * @example
 * ```typescript
 * const headers = getCustomCacheHeaders(120); // 2 minutes
 * return json(data, { headers });
 * ```
 */
export function getCustomCacheHeaders(maxAge: number): CacheHeaders {
	if (maxAge <= 0) {
		return getCacheHeaders('no-cache');
	}

	return {
		'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
		'CDN-Cache-Control': `public, max-age=${maxAge}`,
		'Vercel-CDN-Cache-Control': `public, max-age=${maxAge}`
	};
}

/**
 * Check if cache headers are set correctly
 *
 * @param headers - Headers object to validate
 * @param expectedProfile - Expected cache profile
 * @returns true if headers match the profile
 */
export function validateCacheHeaders(
	headers: Headers | Record<string, string>,
	expectedProfile: CacheProfile
): boolean {
	const expected = getCacheHeaders(expectedProfile);
	const actual =
		headers instanceof Headers
			? {
					'Cache-Control': headers.get('Cache-Control') || '',
					'CDN-Cache-Control': headers.get('CDN-Cache-Control') || '',
					'Vercel-CDN-Cache-Control': headers.get('Vercel-CDN-Cache-Control') || ''
				}
			: headers;

	return (
		actual['Cache-Control'] === expected['Cache-Control'] &&
		actual['CDN-Cache-Control'] === expected['CDN-Cache-Control'] &&
		actual['Vercel-CDN-Cache-Control'] === expected['Vercel-CDN-Cache-Control']
	);
}
