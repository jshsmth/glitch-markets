/**
 * Event Service Layer
 * Coordinates between API client and server routes, handles caching and filtering
 */

import type { Event } from '../api/polymarket-client.js';
import { BaseService } from './base-service.js';
import { buildCacheKey } from '../cache/cache-key-builder.js';
import { withCacheStampedeProtection } from '../cache/cache-stampede.js';
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
export class EventService extends BaseService {
	/**
	 * Creates a new EventService instance
	 * @param cacheTtl - Cache time-to-live in milliseconds (default: 1 minute)
	 */
	constructor(cacheTtl: number = CACHE_TTL.DEFAULT) {
		super('EventService', cacheTtl);
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
		const params = this.buildParams(filters);

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
		return this.fetchSingleEntity<Event>(
			`event:id:${id}`,
			id,
			(id) => this.client.fetchEventById(id),
			{ id }
		);
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
		return this.fetchSingleEntity<Event>(
			`event:slug:${slug}`,
			slug,
			(slug) => this.client.fetchEventBySlug(slug),
			{ slug }
		);
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
		return this.fetchSingleEntity<import('../api/polymarket-client.js').Tag[]>(
			`event:tags:${id}`,
			id,
			(id) => this.client.fetchEventTags(id),
			{ id }
		);
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
