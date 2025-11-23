/**
 * Event Service Layer
 * Coordinates between API client and server routes, handles caching and filtering
 */

import type { Event } from '../api/polymarket-client.js';
import { PolymarketClient } from '../api/polymarket-client.js';
import { CacheManager } from '../cache/cache-manager.js';
import { loadConfig } from '../config/api-config.js';
import { Logger } from '../utils/logger.js';

export interface EventFilters {
	category?: string;
	active?: boolean;
	closed?: boolean;
	limit?: number;
	offset?: number;
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
	 * @param cacheTtl - Cache time-to-live in milliseconds (default: 60000ms = 1 minute)
	 */
	constructor(cacheTtl: number = 60000) {
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
		const cacheKey = `events:${JSON.stringify(filters)}`;

		const cached = this.cache.get<Event[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for events', { filters });
			return cached;
		}

		// Check if request is already in-flight (cache stampede protection)
		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { filters });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for events, fetching from API', { filters });

		// Create the promise for fetching data
		const fetchPromise = this.fetchAndCacheEvents(cacheKey, filters);

		// Store the promise so concurrent requests can wait for it
		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			const result = await fetchPromise;
			return result;
		} finally {
			// Clean up the pending request
			this.pendingRequests.delete(cacheKey);
		}
	}

	/**
	 * Internal method to fetch and cache events
	 * Separated for better cache stampede protection
	 */
	private async fetchAndCacheEvents(cacheKey: string, filters: EventFilters): Promise<Event[]> {
		const params: Record<string, string | number | boolean> = {};
		if (filters.category !== undefined) params.category = filters.category;
		if (filters.active !== undefined) params.active = filters.active;
		if (filters.closed !== undefined) params.closed = filters.closed;
		if (filters.limit !== undefined) params.limit = filters.limit;
		if (filters.offset !== undefined) params.offset = filters.offset;

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

		// Check if request is already in-flight (cache stampede protection)
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

		// Check if request is already in-flight (cache stampede protection)
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
}
