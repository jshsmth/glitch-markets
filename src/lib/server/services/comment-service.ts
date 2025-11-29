/**
 * Comment Service Layer
 * Coordinates between API client and server routes, handles caching and filtering
 */

import type { Comment } from '../api/polymarket-client.js';
import { PolymarketClient } from '../api/polymarket-client.js';
import { CacheManager } from '../cache/cache-manager.js';
import { loadConfig } from '../config/api-config.js';
import { Logger } from '../utils/logger.js';
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
export class CommentService {
	private client: PolymarketClient;
	private cache: CacheManager;
	private logger: Logger;
	private cacheTtl: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private pendingRequests: Map<string, Promise<any>>;

	/**
	 * Creates a new CommentService instance
	 * @param cacheTtl - Cache time-to-live in milliseconds (default: 1 minute)
	 */
	constructor(cacheTtl: number = CACHE_TTL.DEFAULT) {
		const config = loadConfig();
		this.client = new PolymarketClient(config);
		this.cache = new CacheManager(100);
		this.logger = new Logger({ component: 'CommentService' });
		this.cacheTtl = cacheTtl;
		this.pendingRequests = new Map();
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
		const cacheKey = `comments:list:${JSON.stringify(filters)}`;

		const cached = this.cache.get<Comment[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for comments list', { filters });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { filters });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for comments list, fetching from API', { filters });

		const fetchPromise = this.fetchAndCacheComments(cacheKey, filters);

		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			const result = await fetchPromise;
			return result;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	/**
	 * Internal method to fetch and cache comments
	 * Separated for better cache stampede protection
	 */
	private async fetchAndCacheComments(
		cacheKey: string,
		filters: CommentFilters
	): Promise<Comment[]> {
		const params: Record<string, string | number | boolean> = {};

		if (filters.limit !== undefined) params.limit = filters.limit;
		if (filters.offset !== undefined) params.offset = filters.offset;
		if (filters.order !== undefined) params.order = filters.order;
		if (filters.ascending !== undefined) params.ascending = filters.ascending;
		if (filters.parent_entity_type !== undefined)
			params.parent_entity_type = filters.parent_entity_type;
		if (filters.parent_entity_id !== undefined) params.parent_entity_id = filters.parent_entity_id;
		if (filters.get_positions !== undefined) params.get_positions = filters.get_positions;
		if (filters.holders_only !== undefined) params.holders_only = filters.holders_only;

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

		const cached = this.cache.get<Comment>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for comment by ID', { id, getPositions });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { id, getPositions });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for comment by ID, fetching from API', { id, getPositions });

		const fetchPromise = (async () => {
			try {
				const params: Record<string, boolean> = {};
				if (getPositions) params.get_positions = true;

				const comment = await this.client.fetchCommentById(id, { params });
				this.cache.set(cacheKey, comment, this.cacheTtl);
				return comment;
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
		const cacheKey = `comments:user:${userAddress}:${JSON.stringify(filters)}`;

		const cached = this.cache.get<Comment[]>(cacheKey);
		if (cached) {
			this.logger.info('Cache hit for comments by user', { userAddress, filters });
			return cached;
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.info('Request already in-flight, waiting for result', { userAddress, filters });
			return this.pendingRequests.get(cacheKey)!;
		}

		this.logger.info('Cache miss for comments by user, fetching from API', {
			userAddress,
			filters
		});

		const fetchPromise = this.fetchAndCacheUserComments(cacheKey, userAddress, filters);

		this.pendingRequests.set(cacheKey, fetchPromise);

		try {
			const result = await fetchPromise;
			return result;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
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
		const params: Record<string, string | number | boolean> = {};

		if (filters.limit !== undefined) params.limit = filters.limit;
		if (filters.offset !== undefined) params.offset = filters.offset;
		if (filters.order !== undefined) params.order = filters.order;
		if (filters.ascending !== undefined) params.ascending = filters.ascending;

		const comments = await this.client.fetchCommentsByUser(userAddress, { params });
		this.cache.set(cacheKey, comments, this.cacheTtl);

		return comments;
	}
}
