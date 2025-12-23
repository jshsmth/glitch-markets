/**
 * Comment Service Layer
 * Coordinates between API client and server routes, handles caching and filtering
 */

import type { Comment } from '../api/polymarket-client.js';
import { BaseService } from './base-service.js';
import { buildCacheKey } from '../cache/cache-key-builder.js';
import { withCacheStampedeProtection } from '../cache/cache-stampede.js';
import { CACHE_TTL } from '$lib/config/constants.js';

export interface CommentFilters {
	limit?: number;
	offset?: number;
	order?: string;
	ascending?: boolean;
	parent_entity_type?: 'Event' | 'Series' | 'market';
	parent_entity_id?: number;
	get_positions?: boolean;
	holders_only?: boolean;
}

export interface UserCommentFilters {
	limit?: number;
	offset?: number;
	order?: string;
	ascending?: boolean;
}

/**
 * Service layer for comment operations
 * Coordinates between API client and server routes, handles caching and filtering
 *
 * @example
 * ```typescript
 * const service = new CommentService();
 * const comments = await service.getComments({ parent_entity_type: 'Event', parent_entity_id: 123 });
 * ```
 */
export class CommentService extends BaseService {
	/**
	 * Creates a new CommentService instance
	 * @param cacheTtl - Cache time-to-live in milliseconds (default: 1 minute)
	 */
	constructor(cacheTtl: number = CACHE_TTL.DEFAULT) {
		super('CommentService', cacheTtl);
	}

	/**
	 * Fetches comments with optional filtering
	 * Results are cached to improve performance
	 *
	 * @param filters - Optional filters to apply (parent entity, pagination, etc.)
	 * @returns Promise resolving to an array of comments matching the filters
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When filter parameters are invalid
	 *
	 * @example
	 * ```typescript
	 * // Get comments for an event
	 * const comments = await service.getComments({
	 *   parent_entity_type: 'Event',
	 *   parent_entity_id: 123,
	 *   limit: 10
	 * });
	 * ```
	 */
	async getComments(filters: CommentFilters = {}): Promise<Comment[]> {
		const cacheKey = buildCacheKey('comments:list', filters);

		return withCacheStampedeProtection({
			cacheKey,
			fetchFn: () => this.fetchAndCacheComments(cacheKey, filters),
			cache: this.cache,
			pendingRequests: this.pendingRequests as Map<string, Promise<Comment[]>>,
			logger: this.logger,
			logContext: { filters },
			cacheHitMessage: 'Cache hit for comments list',
			cacheMissMessage: 'Cache miss for comments list, fetching from API'
		});
	}

	/**
	 * Internal method to fetch and cache comments
	 * Separated for better cache stampede protection
	 */
	private async fetchAndCacheComments(
		cacheKey: string,
		filters: CommentFilters
	): Promise<Comment[]> {
		const params = this.buildParams(filters);

		const comments = await this.client.fetchComments({ params });
		this.cache.set(cacheKey, comments, this.cacheTtl);

		return comments;
	}

	/**
	 * Fetches a specific comment by its ID
	 * Results are cached to improve performance
	 *
	 * @param id - The unique comment ID
	 * @param getPositions - Whether to include position data (default: false)
	 * @returns Promise resolving to the comment, or null if not found
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When the ID is invalid
	 *
	 * @example
	 * ```typescript
	 * const comment = await service.getCommentById(123, true);
	 * if (comment) {
	 *   console.log(comment.body);
	 * }
	 * ```
	 */
	async getCommentById(id: number, getPositions: boolean = false): Promise<Comment | null> {
		const cacheKey = `comment:id:${id}:positions:${getPositions}`;

		return this.fetchSingleEntity<Comment>(
			cacheKey,
			String(id),
			() => {
				const params: Record<string, boolean> = {};
				if (getPositions) params.get_positions = true;
				return this.client.fetchCommentById(id, { params });
			},
			{ id, getPositions }
		);
	}

	/**
	 * Fetches comments by user address
	 * Results are cached to improve performance
	 *
	 * @param userAddress - The blockchain address of the user
	 * @param filters - Optional filters (pagination, ordering)
	 * @returns Promise resolving to an array of comments by the user
	 * @throws {ApiError} When the API request fails
	 * @throws {ValidationError} When the address or filters are invalid
	 *
	 * @example
	 * ```typescript
	 * const comments = await service.getCommentsByUser(
	 *   '0x1234567890123456789012345678901234567890',
	 *   { limit: 20, ascending: false }
	 * );
	 * console.log(`User has ${comments.length} comments`);
	 * ```
	 */
	async getCommentsByUser(
		userAddress: string,
		filters: UserCommentFilters = {}
	): Promise<Comment[]> {
		const cacheKey = buildCacheKey(`comments:user:${userAddress}`, filters);

		return withCacheStampedeProtection({
			cacheKey,
			fetchFn: () => this.fetchAndCacheUserComments(cacheKey, userAddress, filters),
			cache: this.cache,
			pendingRequests: this.pendingRequests as Map<string, Promise<Comment[]>>,
			logger: this.logger,
			logContext: { userAddress, filters },
			cacheHitMessage: 'Cache hit for comments by user',
			cacheMissMessage: 'Cache miss for comments by user, fetching from API'
		});
	}

	/**
	 * Internal method to fetch and cache user comments
	 * Separated for better cache stampede protection
	 */
	private async fetchAndCacheUserComments(
		cacheKey: string,
		userAddress: string,
		filters: UserCommentFilters
	): Promise<Comment[]> {
		const params = this.buildParams(filters);

		const comments = await this.client.fetchCommentsByUser(userAddress, { params });
		this.cache.set(cacheKey, comments, this.cacheTtl);

		return comments;
	}
}
