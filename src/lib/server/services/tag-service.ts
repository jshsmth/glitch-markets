/**
 * Tag Service Layer
 * Coordinates between API client and server routes, handles caching
 */

import type { Tag, TagRelationship } from '../api/polymarket-client.js';
import { PolymarketClient } from '../api/polymarket-client.js';
import { CacheManager } from '../cache/cache-manager.js';
import { loadConfig } from '../config/api-config.js';
import { Logger } from '../utils/logger.js';

/**
 * Service layer for tag operations
 * Coordinates between API client and server routes, handles caching
 *
 * @example
 * ```typescript
 * const service = new TagService();
 * const tags = await service.getTags();
 * ```
 */
export class TagService {
	private client: PolymarketClient;
	private cache: CacheManager;
	private logger: Logger;
	private cacheTtl: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private pendingRequests: Map<string, Promise<any>>;

	/**
	 * Creates a new TagService instance
	 * @param cacheTtl - Cache time-to-live in milliseconds (default: 60000ms = 1 minute)
	 */
	constructor(cacheTtl: number = 60000) {
		const config = loadConfig();
		this.client = new PolymarketClient(config);
		this.cache = new CacheManager(100);
		this.logger = new Logger({ component: 'TagService' });
		this.cacheTtl = cacheTtl;
		this.pendingRequests = new Map();
	}

	/**
	 * Fetches all tags
	 * Results are cached to improve performance
	 *
	 * @returns Promise resolving to an array of tags
	 * @throws {ApiError} When the API request fails
	 *
	 * @example
	 * ```typescript
	 * const tags = await service.getTags();
	 * ```
	 */
	async getTags(): Promise<Tag[]> {
		const cacheKey = 'tags:all';

		const cached = this.cache.get<Tag[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for tags');
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result');
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for tags, fetching from API');

		const fetchPromise = this.fetchAndCacheTags(cacheKey);

		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			const result = await fetchPromise;
			return result;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	/**
	 * Internal method to fetch and cache tags
	 * Separated for better cache stampede protection
	 */
	private async fetchAndCacheTags(cacheKey: string): Promise<Tag[]> {
		const tags = await this.client.fetchTags();
		this.cache.set(cacheKey, tags, this.cacheTtl);
		return tags;
	}

	/**
	 * Fetches a specific tag by its unique identifier
	 * Results are cached to improve performance
	 *
	 * @param id - The unique tag ID
	 * @returns Promise resolving to the tag, or null if not found
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When the ID is invalid
	 *
	 * @example
	 * ```typescript
	 * const tag = await service.getTagById('tag-123');
	 * if (tag) {
	 *   console.log(tag.label);
	 * }
	 * ```
	 */
	async getTagById(id: string): Promise<Tag | null> {
		const cacheKey = `tag:id:${id}`;

		const cached = this.cache.get<Tag>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for tag by ID', { id });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { id });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for tag by ID, fetching from API', { id });

		const fetchPromise = (async () => {
			try {
				const tag = await this.client.fetchTagById(id);
				this.cache.set(cacheKey, tag, this.cacheTtl);
				return tag;
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
	 * Fetches a specific tag by its URL-friendly slug
	 * Results are cached to improve performance
	 *
	 * @param slug - The URL-friendly tag identifier
	 * @returns Promise resolving to the tag, or null if not found
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When the slug is invalid
	 *
	 * @example
	 * ```typescript
	 * const tag = await service.getTagBySlug('crypto');
	 * if (tag) {
	 *   console.log(tag.label);
	 * }
	 * ```
	 */
	async getTagBySlug(slug: string): Promise<Tag | null> {
		const cacheKey = `tag:slug:${slug}`;

		const cached = this.cache.get<Tag>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for tag by slug', { slug });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { slug });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for tag by slug, fetching from API', { slug });

		const fetchPromise = (async () => {
			try {
				const tag = await this.client.fetchTagBySlug(slug);
				this.cache.set(cacheKey, tag, this.cacheTtl);
				return tag;
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
	 * Fetches tag relationships by tag ID
	 * Results are cached to improve performance
	 *
	 * @param id - The unique tag ID
	 * @returns Promise resolving to an array of tag relationships
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When the ID is invalid
	 *
	 * @example
	 * ```typescript
	 * const relationships = await service.getTagRelationshipsById('tag-123');
	 * relationships.forEach(rel => console.log(rel.relatedTagID));
	 * ```
	 */
	async getTagRelationshipsById(id: string): Promise<TagRelationship[]> {
		const cacheKey = `tag:relationships:id:${id}`;

		const cached = this.cache.get<TagRelationship[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for tag relationships by ID', { id });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { id });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for tag relationships by ID, fetching from API', { id });

		const fetchPromise = (async () => {
			try {
				const relationships = await this.client.fetchTagRelationshipsById(id);
				this.cache.set(cacheKey, relationships, this.cacheTtl);
				return relationships;
			} catch (error) {
				if (
					error &&
					typeof error === 'object' &&
					'statusCode' in error &&
					error.statusCode === 404
				) {
					throw error;
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
	 * Fetches tag relationships by tag slug
	 * Results are cached to improve performance
	 *
	 * @param slug - The URL-friendly tag identifier
	 * @returns Promise resolving to an array of tag relationships
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When the slug is invalid
	 *
	 * @example
	 * ```typescript
	 * const relationships = await service.getTagRelationshipsBySlug('crypto');
	 * relationships.forEach(rel => console.log(rel.relatedTagID));
	 * ```
	 */
	async getTagRelationshipsBySlug(slug: string): Promise<TagRelationship[]> {
		const cacheKey = `tag:relationships:slug:${slug}`;

		const cached = this.cache.get<TagRelationship[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for tag relationships by slug', { slug });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { slug });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for tag relationships by slug, fetching from API', { slug });

		const fetchPromise = (async () => {
			try {
				const relationships = await this.client.fetchTagRelationshipsBySlug(slug);
				this.cache.set(cacheKey, relationships, this.cacheTtl);
				return relationships;
			} catch (error) {
				if (
					error &&
					typeof error === 'object' &&
					'statusCode' in error &&
					error.statusCode === 404
				) {
					throw error;
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
	 * Fetches related tags by tag ID
	 * Returns full Tag objects that are related to the specified tag
	 * Results are cached to improve performance
	 *
	 * @param id - The unique tag ID
	 * @returns Promise resolving to an array of related tags
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When the ID is invalid
	 *
	 * @example
	 * ```typescript
	 * const relatedTags = await service.getRelatedTagsById('tag-123');
	 * relatedTags.forEach(tag => console.log(tag.label));
	 * ```
	 */
	async getRelatedTagsById(id: string): Promise<Tag[]> {
		const cacheKey = `tag:related:id:${id}`;

		const cached = this.cache.get<Tag[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for related tags by ID', { id });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { id });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for related tags by ID, fetching from API', { id });

		const fetchPromise = (async () => {
			try {
				const relatedTags = await this.client.fetchRelatedTagsById(id);
				this.cache.set(cacheKey, relatedTags, this.cacheTtl);
				return relatedTags;
			} catch (error) {
				if (
					error &&
					typeof error === 'object' &&
					'statusCode' in error &&
					error.statusCode === 404
				) {
					throw error;
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
	 * Fetches related tags by tag slug
	 * Returns full Tag objects that are related to the specified tag
	 * Results are cached to improve performance
	 *
	 * @param slug - The URL-friendly tag identifier
	 * @returns Promise resolving to an array of related tags
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When the slug is invalid
	 *
	 * @example
	 * ```typescript
	 * const relatedTags = await service.getRelatedTagsBySlug('crypto');
	 * relatedTags.forEach(tag => console.log(tag.label));
	 * ```
	 */
	async getRelatedTagsBySlug(slug: string): Promise<Tag[]> {
		const cacheKey = `tag:related:slug:${slug}`;

		const cached = this.cache.get<Tag[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for related tags by slug', { slug });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { slug });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for related tags by slug, fetching from API', { slug });

		const fetchPromise = (async () => {
			try {
				const relatedTags = await this.client.fetchRelatedTagsBySlug(slug);
				this.cache.set(cacheKey, relatedTags, this.cacheTtl);
				return relatedTags;
			} catch (error) {
				if (
					error &&
					typeof error === 'object' &&
					'statusCode' in error &&
					error.statusCode === 404
				) {
					throw error;
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
}
