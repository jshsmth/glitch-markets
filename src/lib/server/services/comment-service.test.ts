/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { CommentService } from './comment-service';
import type { Comment } from '../api/polymarket-client';
import { loadConfig } from '../config/api-config';
import { arbitraries } from '$lib/tests/arbitraries/common-arbitraries.js';

// Mock the dependencies
vi.mock('../api/polymarket-client');
vi.mock('../cache/cache-manager');
vi.mock('../config/api-config');
vi.mock('$lib/utils/logger', () => ({
	Logger: class {
		info = vi.fn();
		error = vi.fn();
		warn = vi.fn();
		debug = vi.fn();
		child = vi.fn().mockReturnThis();
	}
}));

describe('CommentService', () => {
	let service: CommentService;

	beforeEach(() => {
		// Reset all mocks
		vi.resetAllMocks();

		// Mock loadConfig
		vi.mocked(loadConfig).mockReturnValue({
			baseUrl: 'https://test-api.com',
			dataApiUrl: 'https://data-api.polymarket.com',
			bridgeApiUrl: 'https://bridge.polymarket.com',
			clobApiUrl: 'https://clob.polymarket.com',
			timeout: 5000,
			cacheTtl: 60,
			enableCache: true
		});

		service = new CommentService();
	});

	/**
	 * Feature: comments-list-caching
	 * Property: Cache hit consistency for comment lists
	 */
	describe('Property: Cache hit consistency for comment lists', () => {
		it('for any valid filters, consecutive requests with identical filters should return cached results', async () => {
			// Generator for comment filters
			const filtersArb = fc.record({
				limit: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
				offset: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
				order: fc.option(fc.string(), { nil: undefined }),
				ascending: fc.option(fc.boolean(), { nil: undefined }),
				parent_entity_type: fc.option(
					fc.oneof(fc.constant('Event'), fc.constant('Series'), fc.constant('market')),
					{ nil: undefined }
				),
				parent_entity_id: fc.option(fc.integer({ min: 1 }), { nil: undefined }),
				get_positions: fc.option(fc.boolean(), { nil: undefined }),
				holders_only: fc.option(fc.boolean(), { nil: undefined })
			});

			// Generator for comment data
			const commentArb = fc.record({
				id: fc.integer({ min: 1 }),
				body: fc.string({ minLength: 1 }),
				userAddress: fc.string({ minLength: 1 }),
				createdAt: arbitraries.dateString(),
				parentEntityType: fc.oneof(
					fc.constant('Event'),
					fc.constant('Series'),
					fc.constant('market')
				),
				parentEntityID: fc.integer({ min: 1 })
			});

			await fc.assert(
				fc.asyncProperty(
					filtersArb,
					fc.array(commentArb, { minLength: 0, maxLength: 50 }),
					async (filters, mockData) => {
						// Setup mock - get client and cache instances
						const mockClient = vi.mocked((service as any).client);
						const mockCache = vi.mocked((service as any).cache);

						mockCache.get = vi.fn().mockReturnValue(null);
						mockClient.fetchComments = vi.fn().mockResolvedValue(mockData);

						// First call should hit API
						const result1 = await service.getComments(filters);

						// Second call with identical filters should use cache (return cached value)
						mockCache.get = vi.fn().mockReturnValue(mockData);
						const result2 = await service.getComments(filters);

						// Verify API was only called once
						expect(mockClient.fetchComments).toHaveBeenCalledTimes(1);

						// Verify both results are identical
						expect(result1).toEqual(result2);
						expect(result1).toEqual(mockData);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: comment-by-id-caching
	 * Property: Cache hit consistency for comment by ID
	 */
	describe('Property: Cache hit consistency for comment by ID', () => {
		it('consecutive requests for the same comment ID should return cached results', async () => {
			const commentIdArb = fc.integer({ min: 1, max: 10000 });
			const getPositionsArb = fc.boolean();

			const commentArb = fc.record({
				id: fc.integer({ min: 1 }),
				body: fc.string({ minLength: 1 }),
				userAddress: fc.string({ minLength: 1 }),
				createdAt: arbitraries.dateString(),
				parentEntityType: fc.oneof(
					fc.constant('Event'),
					fc.constant('Series'),
					fc.constant('market')
				),
				parentEntityID: fc.integer({ min: 1 })
			});

			await fc.assert(
				fc.asyncProperty(
					commentIdArb,
					getPositionsArb,
					commentArb,
					async (id, getPositions, mockData) => {
						// Setup mock - get client and cache instances
						const mockClient = vi.mocked((service as any).client);
						const mockCache = vi.mocked((service as any).cache);

						mockCache.get = vi.fn().mockReturnValue(null);
						mockClient.fetchCommentById = vi.fn().mockResolvedValue(mockData);

						// First call should hit API
						const result1 = await service.getCommentById(id, getPositions);

						// Second call with same ID should use cache (return cached value)
						mockCache.get = vi.fn().mockReturnValue(mockData);
						const result2 = await service.getCommentById(id, getPositions);

						// Verify API was only called once
						expect(mockClient.fetchCommentById).toHaveBeenCalledTimes(1);

						// Verify both results are identical
						expect(result1).toEqual(result2);
						expect(result1).toEqual(mockData);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should return null for 404 errors without caching', async () => {
			const mockClient = vi.mocked((service as any).client);
			const notFoundError = { statusCode: 404, message: 'Not found' };

			mockClient.fetchCommentById = vi.fn().mockRejectedValue(notFoundError);

			const result = await service.getCommentById(9999, false);

			expect(result).toBeNull();
			expect(mockClient.fetchCommentById).toHaveBeenCalledTimes(1);
		});
	});

	/**
	 * Feature: comments-by-user-caching
	 * Property: Cache hit consistency for comments by user
	 */
	describe('Property: Cache hit consistency for comments by user', () => {
		it('consecutive requests for the same user should return cached results', async () => {
			const userAddressArb = fc
				.array(fc.integer({ min: 0, max: 15 }), { minLength: 40, maxLength: 40 })
				.map((arr) => '0x' + arr.map((n) => n.toString(16)).join(''));
			const filtersArb = fc.record({
				limit: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
				offset: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
				order: fc.option(fc.string(), { nil: undefined }),
				ascending: fc.option(fc.boolean(), { nil: undefined })
			});

			const commentArb = fc.array(
				fc.record({
					id: fc.integer({ min: 1 }),
					body: fc.string({ minLength: 1 }),
					userAddress: fc.string({ minLength: 1 }),
					createdAt: arbitraries.dateString(),
					parentEntityType: fc.oneof(
						fc.constant('Event'),
						fc.constant('Series'),
						fc.constant('market')
					),
					parentEntityID: fc.integer({ min: 1 })
				}),
				{ minLength: 0, maxLength: 50 }
			);

			await fc.assert(
				fc.asyncProperty(
					userAddressArb,
					filtersArb,
					commentArb,
					async (userAddress, filters, mockData) => {
						// Setup mock - get client and cache instances
						const mockClient = vi.mocked((service as any).client);
						const mockCache = vi.mocked((service as any).cache);

						mockCache.get = vi.fn().mockReturnValue(null);
						mockClient.fetchCommentsByUser = vi.fn().mockResolvedValue(mockData);

						// First call should hit API
						const result1 = await service.getCommentsByUser(userAddress, filters);

						// Second call with same user should use cache (return cached value)
						mockCache.get = vi.fn().mockReturnValue(mockData);
						const result2 = await service.getCommentsByUser(userAddress, filters);

						// Verify API was only called once
						expect(mockClient.fetchCommentsByUser).toHaveBeenCalledTimes(1);

						// Verify both results are identical
						expect(result1).toEqual(result2);
						expect(result1).toEqual(mockData);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: comments-cache-isolation
	 * Property: Different filters produce different cache keys
	 */
	describe('Property: Cache isolation for different filters', () => {
		it('requests with different filters should not share cached results', async () => {
			const mockClient = vi.mocked((service as any).client);

			const mockData1: Comment[] = [
				{
					id: 1,
					body: 'Comment 1',
					userAddress: '0xabc',
					createdAt: '2025-01-01T00:00:00Z',
					parentEntityType: 'Event',
					parentEntityID: 1,
					parentCommentID: null,
					replyAddress: null,
					updatedAt: null,
					profile: null,
					reactions: null,
					reportCount: null,
					reactionCount: null
				}
			];
			const mockData2: Comment[] = [
				{
					id: 2,
					body: 'Comment 2',
					userAddress: '0xdef',
					createdAt: '2025-01-02T00:00:00Z',
					parentEntityType: 'Event',
					parentEntityID: 2,
					parentCommentID: null,
					replyAddress: null,
					updatedAt: null,
					profile: null,
					reactions: null,
					reportCount: null,
					reactionCount: null
				}
			];

			mockClient.fetchComments = vi
				.fn()
				.mockResolvedValueOnce(mockData1)
				.mockResolvedValueOnce(mockData2);

			// Request with entity ID 1
			const result1 = await service.getComments({
				parent_entity_type: 'Event',
				parent_entity_id: 1
			});

			// Request with entity ID 2 (different filter)
			const result2 = await service.getComments({
				parent_entity_type: 'Event',
				parent_entity_id: 2
			});

			// API should be called twice (different cache keys)
			expect(mockClient.fetchComments).toHaveBeenCalledTimes(2);

			// Results should be different
			expect(result1).toEqual(mockData1);
			expect(result2).toEqual(mockData2);
		});
	});

	/**
	 * Feature: comments-request-deduplication
	 * Property: Concurrent identical requests should only trigger one API call
	 */
	describe('Property: Request deduplication', () => {
		it('concurrent identical comment list requests should only call API once', async () => {
			const mockClient = vi.mocked((service as any).client);
			const mockData: Comment[] = [
				{
					id: 1,
					body: 'Comment 1',
					userAddress: '0xabc',
					createdAt: '2025-01-01T00:00:00Z',
					parentEntityType: 'Event',
					parentEntityID: 1,
					parentCommentID: null,
					replyAddress: null,
					updatedAt: null,
					profile: null,
					reactions: null,
					reportCount: null,
					reactionCount: null
				}
			];

			// Simulate slow API response
			mockClient.fetchComments = vi
				.fn()
				.mockImplementation(
					() => new Promise((resolve) => setTimeout(() => resolve(mockData), 50))
				);

			const filters = { parent_entity_type: 'Event' as const, parent_entity_id: 1 };

			// Fire 5 concurrent requests
			const results = await Promise.all([
				service.getComments(filters),
				service.getComments(filters),
				service.getComments(filters),
				service.getComments(filters),
				service.getComments(filters)
			]);

			// API should only be called once
			expect(mockClient.fetchComments).toHaveBeenCalledTimes(1);

			// All results should be identical
			results.forEach((result) => {
				expect(result).toEqual(mockData);
			});
		});
	});

	/**
	 * Feature: comments-error-propagation
	 * Property: API errors should propagate correctly to callers
	 */
	describe('Property: Error propagation', () => {
		it('comments list API errors should propagate to caller', async () => {
			const mockClient = vi.mocked((service as any).client);
			const testError = new Error('API Error');

			mockClient.fetchComments = vi.fn().mockRejectedValue(testError);

			await expect(service.getComments({ limit: 10 })).rejects.toThrow('API Error');
		});

		it('comment by ID API errors (non-404) should propagate to caller', async () => {
			const mockClient = vi.mocked((service as any).client);
			const testError = new Error('Server Error');

			mockClient.fetchCommentById = vi.fn().mockRejectedValue(testError);

			await expect(service.getCommentById(123)).rejects.toThrow('Server Error');
		});

		it('comments by user API errors should propagate to caller', async () => {
			const mockClient = vi.mocked((service as any).client);
			const testError = new Error('API Error');

			mockClient.fetchCommentsByUser = vi.fn().mockRejectedValue(testError);

			await expect(
				service.getCommentsByUser('0x1234567890123456789012345678901234567890')
			).rejects.toThrow('API Error');
		});
	});
});
