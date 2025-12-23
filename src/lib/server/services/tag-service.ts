/**
 * Tag Service Layer
 * Coordinates between API client and server routes, handles caching
 */

import type { Tag, TagRelationship } from '../api/polymarket-client.js';
import { BaseService } from './base-service.js';
import { withCacheStampedeProtection } from '../cache/cache-stampede.js';
import { CACHE_TTL } from '$lib/config/constants.js';

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
export class TagService extends BaseService {
	/**
	 * Creates a new TagService instance
	 * @param cacheTtl - Cache time-to-live in milliseconds (default: 1 minute)
	 */
	constructor(cacheTtl: number = CACHE_TTL.DEFAULT) {
		super('TagService', cacheTtl);
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

		return withCacheStampedeProtection({
			cacheKey,
			fetchFn: () => this.fetchAndCacheTags(cacheKey),
			cache: this.cache,
			pendingRequests: this.pendingRequests as Map<string, Promise<Tag[]>>,
			logger: this.logger,
			cacheHitMessage: 'Cache hit for tags',
			cacheMissMessage: 'Cache miss for tags, fetching from API'
		});
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
		return this.fetchSingleEntity<Tag>(`tag:id:${id}`, id, (id) => this.client.fetchTagById(id), {
			id
		});
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
		return this.fetchSingleEntity<Tag>(
			`tag:slug:${slug}`,
			slug,
			(slug) => this.client.fetchTagBySlug(slug),
			{ slug }
		);
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
