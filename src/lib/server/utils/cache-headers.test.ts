/**
 * Tests for cache headers utility
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	getCacheHeaders,
	getCustomCacheHeaders,
	validateCacheHeaders,
	type CacheProfile
} from './cache-headers';

describe('Cache Headers Utility', () => {
	/**
	 * Feature: cache-headers-markets
	 * Property: Markets list endpoints should have 60-second cache
	 */
	describe('getCacheHeaders - Markets', () => {
		it('should return 60-second cache for markets list', () => {
			const headers = getCacheHeaders('markets-list');

			expect(headers['Cache-Control']).toBe('public, max-age=60, s-maxage=60');
			expect(headers['CDN-Cache-Control']).toBe('public, max-age=60');
			expect(headers['Vercel-CDN-Cache-Control']).toBe('public, max-age=60');
		});

		it('should return 30-second cache for market detail', () => {
			const headers = getCacheHeaders('market-detail');

			expect(headers['Cache-Control']).toBe('public, max-age=30, s-maxage=30');
			expect(headers['CDN-Cache-Control']).toBe('public, max-age=30');
			expect(headers['Vercel-CDN-Cache-Control']).toBe('public, max-age=30');
		});
	});

	/**
	 * Feature: cache-headers-events
	 * Property: Events endpoints should have 60-second cache
	 */
	describe('getCacheHeaders - Events', () => {
		it('should return 60-second cache for events list', () => {
			const headers = getCacheHeaders('events-list');

			expect(headers['Cache-Control']).toBe('public, max-age=60, s-maxage=60');
			expect(headers['CDN-Cache-Control']).toBe('public, max-age=60');
			expect(headers['Vercel-CDN-Cache-Control']).toBe('public, max-age=60');
		});

		it('should return 60-second cache for event detail', () => {
			const headers = getCacheHeaders('event-detail');

			expect(headers['Cache-Control']).toBe('public, max-age=60, s-maxage=60');
			expect(headers['CDN-Cache-Control']).toBe('public, max-age=60');
			expect(headers['Vercel-CDN-Cache-Control']).toBe('public, max-age=60');
		});
	});

	/**
	 * Feature: cache-headers-search
	 * Property: Search results should have 5-minute cache
	 */
	describe('getCacheHeaders - Search', () => {
		it('should return 300-second cache for search results', () => {
			const headers = getCacheHeaders('search-results');

			expect(headers['Cache-Control']).toBe('public, max-age=300, s-maxage=300');
			expect(headers['CDN-Cache-Control']).toBe('public, max-age=300');
			expect(headers['Vercel-CDN-Cache-Control']).toBe('public, max-age=300');
		});
	});

	/**
	 * Feature: cache-headers-sports
	 * Property: Sports data should have appropriate caching
	 */
	describe('getCacheHeaders - Sports', () => {
		it('should return 300-second cache for sports teams', () => {
			const headers = getCacheHeaders('sports-teams');

			expect(headers['Cache-Control']).toBe('public, max-age=300, s-maxage=300');
			expect(headers['CDN-Cache-Control']).toBe('public, max-age=300');
			expect(headers['Vercel-CDN-Cache-Control']).toBe('public, max-age=300');
		});

		it('should return 3600-second cache for sports metadata', () => {
			const headers = getCacheHeaders('sports-metadata');

			expect(headers['Cache-Control']).toBe('public, max-age=3600, s-maxage=3600');
			expect(headers['CDN-Cache-Control']).toBe('public, max-age=3600');
			expect(headers['Vercel-CDN-Cache-Control']).toBe('public, max-age=3600');
		});
	});

	/**
	 * Feature: cache-headers-bridge
	 * Property: Bridge assets should have 5-minute cache
	 */
	describe('getCacheHeaders - Bridge', () => {
		it('should return 300-second cache for bridge assets', () => {
			const headers = getCacheHeaders('bridge-assets');

			expect(headers['Cache-Control']).toBe('public, max-age=300, s-maxage=300');
			expect(headers['CDN-Cache-Control']).toBe('public, max-age=300');
			expect(headers['Vercel-CDN-Cache-Control']).toBe('public, max-age=300');
		});
	});

	/**
	 * Feature: cache-headers-no-cache
	 * Property: No-cache profile should disable all caching
	 */
	describe('getCacheHeaders - No Cache', () => {
		it('should return no-cache headers for no-cache profile', () => {
			const headers = getCacheHeaders('no-cache');

			expect(headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
			expect(headers['CDN-Cache-Control']).toBe('no-store');
			expect(headers['Vercel-CDN-Cache-Control']).toBe('no-store');
		});
	});

	/**
	 * Feature: cache-headers-custom
	 * Property: Custom cache durations should work correctly
	 */
	describe('getCustomCacheHeaders', () => {
		it('should create headers with custom duration', () => {
			const headers = getCustomCacheHeaders(120);

			expect(headers['Cache-Control']).toBe('public, max-age=120, s-maxage=120');
			expect(headers['CDN-Cache-Control']).toBe('public, max-age=120');
			expect(headers['Vercel-CDN-Cache-Control']).toBe('public, max-age=120');
		});

		it('should return no-cache for zero duration', () => {
			const headers = getCustomCacheHeaders(0);

			expect(headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
			expect(headers['CDN-Cache-Control']).toBe('no-store');
			expect(headers['Vercel-CDN-Cache-Control']).toBe('no-store');
		});

		it('should return no-cache for negative duration', () => {
			const headers = getCustomCacheHeaders(-10);

			expect(headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
			expect(headers['CDN-Cache-Control']).toBe('no-store');
			expect(headers['Vercel-CDN-Cache-Control']).toBe('no-store');
		});

		it('should handle arbitrary positive durations', async () => {
			await fc.assert(
				fc.property(fc.integer({ min: 1, max: 86400 }), (duration) => {
					const headers = getCustomCacheHeaders(duration);

					expect(headers['Cache-Control']).toBe(
						`public, max-age=${duration}, s-maxage=${duration}`
					);
					expect(headers['CDN-Cache-Control']).toBe(`public, max-age=${duration}`);
					expect(headers['Vercel-CDN-Cache-Control']).toBe(`public, max-age=${duration}`);
				}),
				{ numRuns: 50 }
			);
		});
	});

	/**
	 * Feature: cache-headers-validation
	 * Property: Header validation should correctly identify matching headers
	 */
	describe('validateCacheHeaders', () => {
		it('should validate headers match the expected profile', () => {
			const headers = getCacheHeaders('markets-list');
			const isValid = validateCacheHeaders(headers, 'markets-list');

			expect(isValid).toBe(true);
		});

		it('should reject headers that do not match profile', () => {
			const headers = getCacheHeaders('markets-list');
			const isValid = validateCacheHeaders(headers, 'market-detail');

			expect(isValid).toBe(false);
		});

		it('should work with Headers object', () => {
			const headersObj = new Headers();
			headersObj.set('Cache-Control', 'public, max-age=60, s-maxage=60');
			headersObj.set('CDN-Cache-Control', 'public, max-age=60');
			headersObj.set('Vercel-CDN-Cache-Control', 'public, max-age=60');

			const isValid = validateCacheHeaders(headersObj, 'markets-list');
			expect(isValid).toBe(true);
		});

		it('should work with plain object', () => {
			const headers = {
				'Cache-Control': 'public, max-age=30, s-maxage=30',
				'CDN-Cache-Control': 'public, max-age=30',
				'Vercel-CDN-Cache-Control': 'public, max-age=30'
			};

			const isValid = validateCacheHeaders(headers, 'market-detail');
			expect(isValid).toBe(true);
		});

		it('should reject missing headers', () => {
			const headers = {
				'Cache-Control': 'public, max-age=60, s-maxage=60',
				'CDN-Cache-Control': '',
				'Vercel-CDN-Cache-Control': ''
			};

			const isValid = validateCacheHeaders(headers, 'markets-list');
			expect(isValid).toBe(false);
		});
	});

	/**
	 * Feature: cache-headers-consistency
	 * Property: All three header types should always be consistent
	 */
	describe('Property: Header consistency across all profiles', () => {
		it('should always return all three cache headers for any profile', () => {
			const profiles: CacheProfile[] = [
				'markets-list',
				'market-detail',
				'events-list',
				'event-detail',
				'search-results',
				'sports-teams',
				'sports-metadata',
				'bridge-assets',
				'no-cache'
			];

			profiles.forEach((profile) => {
				const headers = getCacheHeaders(profile);

				expect(headers).toHaveProperty('Cache-Control');
				expect(headers).toHaveProperty('CDN-Cache-Control');
				expect(headers).toHaveProperty('Vercel-CDN-Cache-Control');

				expect(typeof headers['Cache-Control']).toBe('string');
				expect(typeof headers['CDN-Cache-Control']).toBe('string');
				expect(typeof headers['Vercel-CDN-Cache-Control']).toBe('string');

				expect(headers['Cache-Control'].length).toBeGreaterThan(0);
				expect(headers['CDN-Cache-Control'].length).toBeGreaterThan(0);
				expect(headers['Vercel-CDN-Cache-Control'].length).toBeGreaterThan(0);
			});
		});

		it('should generate headers with consistent max-age values', () => {
			const profiles: CacheProfile[] = [
				'markets-list',
				'market-detail',
				'events-list',
				'event-detail',
				'search-results',
				'sports-teams',
				'sports-metadata',
				'bridge-assets'
			];

			profiles.forEach((profile) => {
				const headers = getCacheHeaders(profile);

				// Extract max-age from Cache-Control
				const cacheControlMatch = headers['Cache-Control'].match(/max-age=(\d+)/);
				const cdnCacheMatch = headers['CDN-Cache-Control'].match(/max-age=(\d+)/);
				const vercelCacheMatch = headers['Vercel-CDN-Cache-Control'].match(/max-age=(\d+)/);

				expect(cacheControlMatch).not.toBeNull();
				expect(cdnCacheMatch).not.toBeNull();
				expect(vercelCacheMatch).not.toBeNull();

				if (cacheControlMatch && cdnCacheMatch && vercelCacheMatch) {
					const cacheControlAge = parseInt(cacheControlMatch[1]);
					const cdnCacheAge = parseInt(cdnCacheMatch[1]);
					const vercelCacheAge = parseInt(vercelCacheMatch[1]);

					// All three should have the same max-age
					expect(cacheControlAge).toBe(cdnCacheAge);
					expect(cacheControlAge).toBe(vercelCacheAge);
					expect(cacheControlAge).toBeGreaterThan(0);
				}
			});
		});
	});
});
