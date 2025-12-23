/**
 * Event Service Layer
 * Coordinates between API client and server routes, handles caching and filtering
 */

import type { Event } from '../api/polymarket-client.js';
import { PolymarketClient } from '../api/polymarket-client.js';
import { CacheManager } from '../cache/cache-manager.js';
import { buildCacheKey } from '../cache/cache-key-builder.js';
import { withCacheStampedeProtection } from '../cache/cache-stampede.js';
import { loadConfig } from '../config/api-config.js';
import { Logger } from '../utils/logger.js';
import { CACHE_TTL } from '$lib/config/constants.js';

export interface EventFilters {
	category?: string;
	tag_slug?: string;
	active?: boolean;
	closed?: boolean;
	archived?: boolean;
	limit?: number;
	offset?: number;
	order?: string;
	ascending?: boolean;
	exclude_tag_id?: string | string[];
	featured_order?: boolean;
}

export interface EventSearchOptions extends EventFilters {
	query?: string;
	sortBy?: 'volume' | 'liquidity' | 'createdAt';
	sortOrder?: 'asc' | 'desc';
}

/**
 * Service layer for event operations
 * Coordinates between API client and server routes, handles caching and filtering
 *
 * @example
 * ```typescript
 * const service = new EventService();
 * const events = await service.getEvents({ category: 'crypto', active: true });
 * ```
 */
export class EventService {
	private client: PolymarketClient;
	private cache: CacheManager;
	private logger: Logger;
	private cacheTtl: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private pendingRequests: Map<string, Promise<any>>;

	/**
	 * Creates a new EventService instance
	 * @param cacheTtl - Cache time-to-live in milliseconds (default: 1 minute)
	 */
	constructor(cacheTtl: number = CACHE_TTL.DEFAULT) {
		const config = loadConfig();
		this.client = new PolymarketClient(config);
		this.cache = new CacheManager(100);
		this.logger = new Logger({ component: 'EventService' });
		this.cacheTtl = cacheTtl;
		this.pendingRequests = new Map();
	}

	/**
	 * Fetches events with optional filtering
	 * Results are cached to improve performance
	 *
	 * @param filters - Optional filters to apply (category, active status, pagination, etc.)
	 * @returns Promise resolving to an array of events matching the filters
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When filter parameters are invalid
	 *
	 * @example
	 * ```typescript
	 * // Get active crypto events
	 * const events = await service.getEvents({
	 *   category: 'crypto',
	 *   active: true,
	 *   limit: 50
	 * });
	 * ```
	 */
	async getEvents(filters: EventFilters = {}): Promise<Event[]> {
		const cacheKey = buildCacheKey('events', filters);

		return withCacheStampedeProtection({
			cacheKey,
			fetchFn: () => this.fetchAndCacheEvents(cacheKey, filters),
			cache: this.cache,
			pendingRequests: this.pendingRequests as Map<string, Promise<Event[]>>,
			logger: this.logger,
			logContext: { filters },
			cacheHitMessage: 'Cache hit for events',
			cacheMissMessage: 'Cache miss for events, fetching from API'
		});
	}

	/**
	 * Internal method to fetch and cache events
	 * Separated for better cache stampede protection
	 */
	private async fetchAndCacheEvents(cacheKey: string, filters: EventFilters): Promise<Event[]> {
		const params: Record<string, string | number | boolean | string[]> = {};
		if (filters.category !== undefined) params.category = filters.category;
		if (filters.tag_slug !== undefined) params.tag_slug = filters.tag_slug;
		if (filters.active !== undefined) params.active = filters.active;
		if (filters.closed !== undefined) params.closed = filters.closed;
		if (filters.archived !== undefined) params.archived = filters.archived;
		if (filters.limit !== undefined) params.limit = filters.limit;
		if (filters.offset !== undefined) params.offset = filters.offset;
		if (filters.order !== undefined) params.order = filters.order;
		if (filters.ascending !== undefined) params.ascending = filters.ascending;
		if (filters.exclude_tag_id !== undefined) params.exclude_tag_id = filters.exclude_tag_id;
		if (filters.featured_order !== undefined) params.featured_order = filters.featured_order;

		const events = await this.client.fetchEvents({ params });
		const filtered = this.applyFilters(events, filters);
		this.cache.set(cacheKey, filtered, this.cacheTtl);

		return filtered;
	}

	/**
	 * Fetches a specific event by its unique identifier
	 * Results are cached to improve performance
	 *
	 * @param id - The unique event ID
	 * @returns Promise resolving to the event, or null if not found
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When the ID is invalid
	 *
	 * @example
	 * ```typescript
	 * const event = await service.getEventById('event-123');
	 * if (event) {
	 *   console.log(event.title);
	 * }
	 * ```
	 */
	async getEventById(id: string): Promise<Event | null> {
		const cacheKey = `event:id:${id}`;

		const cached = this.cache.get<Event>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for event by ID', { id });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { id });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for event by ID, fetching from API', { id });

		const fetchPromise = (async () => {
			try {
				const event = await this.client.fetchEventById(id);
				this.cache.set(cacheKey, event, this.cacheTtl);
				return event;
			} catch (error) {
				if (
					error &&
					typeof error === 'object' &&
					'statusCode' in error &&
					error.statusCode === 404
				) {
					return null;
				}
				throw error;
			}
		})();

		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			return await fetchPromise;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	/**
	 * Fetches a specific event by its URL-friendly slug
	 * Results are cached to improve performance
	 *
	 * @param slug - The URL-friendly event identifier
	 * @returns Promise resolving to the event, or null if not found
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When the slug is invalid
	 *
	 * @example
	 * ```typescript
	 * const event = await service.getEventBySlug('bitcoin-predictions-2024');
	 * if (event) {
	 *   console.log(event.title);
	 * }
	 * ```
	 */
	async getEventBySlug(slug: string): Promise<Event | null> {
		const cacheKey = `event:slug:${slug}`;

		const cached = this.cache.get<Event>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for event by slug', { slug });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { slug });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for event by slug, fetching from API', { slug });

		const fetchPromise = (async () => {
			try {
				const event = await this.client.fetchEventBySlug(slug);
				this.cache.set(cacheKey, event, this.cacheTtl);
				return event;
			} catch (error) {
				if (
					error &&
					typeof error === 'object' &&
					'statusCode' in error &&
					error.statusCode === 404
				) {
					return null;
				}
				throw error;
			}
		})();

		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			return await fetchPromise;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	/**
	 * Fetches tags associated with a specific event
	 * Results are cached to improve performance
	 *
	 * @param id - The unique event ID
	 * @returns Promise resolving to an array of tags, or null if event not found
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When the ID is invalid
	 *
	 * @example
	 * ```typescript
	 * const tags = await service.getEventTags('event-123');
	 * if (tags) {
	 *   console.log(tags.map(t => t.label));
	 * }
	 * ```
	 */
	async getEventTags(id: string): Promise<import('../api/polymarket-client.js').Tag[] | null> {
		const cacheKey = `event:tags:${id}`;

		const cached = this.cache.get<import('../api/polymarket-client.js').Tag[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for event tags', { id });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { id });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for event tags, fetching from API', { id });

		const fetchPromise = (async () => {
			try {
				const tags = await this.client.fetchEventTags(id);
				this.cache.set(cacheKey, tags, this.cacheTtl);
				return tags;
			} catch (error) {
				if (
					error &&
					typeof error === 'object' &&
					'statusCode' in error &&
					error.statusCode === 404
				) {
					return null;
				}
				throw error;
			}
		})();

		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			return await fetchPromise;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	/**
	 * Searches events with text query, filtering, and sorting
	 * Performs case-insensitive partial text matching on event titles
	 *
	 * @param options - Search options including query, filters, and sort parameters
	 * @returns Promise resolving to an array of events matching the search criteria
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When search parameters are invalid
	 *
	 * @example
	 * ```typescript
	 * // Search for bitcoin events sorted by volume
	 * const events = await service.searchEvents({
	 *   query: 'bitcoin',
	 *   sortBy: 'volume',
	 *   sortOrder: 'desc',
	 *   active: true
	 * });
	 * ```
	 */
	async searchEvents(options: EventSearchOptions = {}): Promise<Event[]> {
		const events = await this.getEvents(options);

		let filtered = events;
		if (options.query) {
			const queryLower = options.query.toLowerCase();
			filtered = events.filter((event) => event.title?.toLowerCase().includes(queryLower) ?? false);
		}

		if (options.sortBy) {
			filtered = this.sortEvents(filtered, options.sortBy, options.sortOrder || 'desc');
		}

		return filtered;
	}

	private applyFilters(events: Event[], filters: EventFilters): Event[] {
		let filtered = events;

		if (filters.category !== undefined) {
			filtered = filtered.filter((event) => event.category === filters.category);
		}

		if (filters.active !== undefined) {
			filtered = filtered.filter((event) => event.active === filters.active);
		}

		if (filters.closed !== undefined) {
			filtered = filtered.filter((event) => event.closed === filters.closed);
		}

		return filtered;
	}

	private sortEvents(
		events: Event[],
		sortBy: 'volume' | 'liquidity' | 'createdAt',
		sortOrder: 'asc' | 'desc'
	): Event[] {
		const sorted = [...events];

		sorted.sort((a, b) => {
			let aValue: number;
			let bValue: number;

			switch (sortBy) {
				case 'volume':
					aValue = a.volume ?? 0;
					bValue = b.volume ?? 0;
					break;
				case 'liquidity':
					aValue = a.liquidity ?? 0;
					bValue = b.liquidity ?? 0;
					break;
				case 'createdAt':
					// Parse creationDate for sorting
					aValue = a.creationDate ? new Date(a.creationDate).getTime() : 0;
					bValue = b.creationDate ? new Date(b.creationDate).getTime() : 0;
					break;
				default:
					return 0;
			}

			const comparison = aValue - bValue;
			return sortOrder === 'asc' ? comparison : -comparison;
		});

		return sorted;
	}

	/**
	 * Clears the cache - useful for testing
	 * @internal This method is primarily for testing purposes
	 */
	clearCache(): void {
		this.cache.clear();
	}
}
