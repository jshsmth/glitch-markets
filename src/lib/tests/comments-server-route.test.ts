/**
 * Property-based tests for /api/comments server routes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import type { RequestEvent } from '@sveltejs/kit';
import type { Comment } from '$lib/server/api/polymarket-client';
import { arbitraries } from '$lib/tests/arbitraries/common-arbitraries.js';

const mockGetComments = vi.fn();
const mockGetCommentById = vi.fn();
const mockGetCommentsByUser = vi.fn();

vi.mock('$lib/server/services/comment-service', () => {
	return {
		CommentService: class {
			getComments = mockGetComments;
			getCommentById = mockGetCommentById;
			getCommentsByUser = mockGetCommentsByUser;
		}
	};
});

const { GET: getComments } = await import('../../routes/api/comments/+server');
const { GET: getCommentById } = await import('../../routes/api/comments/[id]/+server');
const { GET: getCommentsByUser } = await import('../../routes/api/comments/user/[address]/+server');

const commentArbitrary = fc.record({
	id: arbitraries.id(),
	body: arbitraries.nonEmptyString(),
	author: arbitraries.nonEmptyString(),
	timestamp: arbitraries.dateString(),
	parentEntityType: arbitraries.entityType(),
	parentEntityId: arbitraries.id()
}) as unknown as fc.Arbitrary<Comment>;

describe('Comments Server Routes', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockGetComments.mockReset();
		mockGetCommentById.mockReset();
		mockGetCommentsByUser.mockReset();
	});

	afterEach(() => {
		vi.resetAllMocks();
		mockGetComments.mockReset();
		mockGetCommentById.mockReset();
		mockGetCommentsByUser.mockReset();
	});

	describe('GET /api/comments', () => {
		it('should return valid JSON for any valid request with filters', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						limit: arbitraries.limit(),
						offset: arbitraries.offset(),
						parent_entity_type: fc.option(arbitraries.entityType()),
						parent_entity_id: fc.option(arbitraries.id())
					}),
					fc.array(commentArbitrary, { minLength: 0, maxLength: 50 }),
					async (filters, comments: Comment[]) => {
						mockGetComments.mockReset();
						mockGetComments.mockResolvedValue(comments);

						const params = new URLSearchParams();
						if (filters.limit !== null) params.set('limit', filters.limit.toString());
						if (filters.offset !== null) params.set('offset', filters.offset.toString());
						if (filters.parent_entity_type !== null)
							params.set('parent_entity_type', filters.parent_entity_type);
						if (filters.parent_entity_id !== null)
							params.set('parent_entity_id', filters.parent_entity_id.toString());

						const mockRequest = {
							url: new URL(`http://localhost/api/comments?${params.toString()}`)
						} as RequestEvent;

						const response = await getComments(mockRequest);
						expect(response.status).toBe(200);

						const body = await response.json();
						expect(Array.isArray(body)).toBe(true);
						expect(body).toEqual(comments);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should handle service errors gracefully', async () => {
			mockGetComments.mockRejectedValue(new Error('Service error'));

			const mockRequest = {
				url: new URL('http://localhost/api/comments')
			} as RequestEvent;

			const response = await getComments(mockRequest);
			expect(response.status).toBe(500);
		});
	});

	describe('GET /api/comments/[id]', () => {
		it('should return comment for valid ID', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.integer({ min: 1, max: 10000 }),
					commentArbitrary,
					async (id, comment: Comment) => {
						mockGetCommentById.mockReset();
						mockGetCommentById.mockResolvedValue(comment);

						const mockRequest = {
							url: new URL(`http://localhost/api/comments/${id}`),
							params: { id: id.toString() }
						} as RequestEvent;

						const response = await getCommentById(mockRequest);
						expect(response.status).toBe(200);

						const body = await response.json();
						expect(body).toEqual(comment);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should return 404 when comment not found', async () => {
			mockGetCommentById.mockResolvedValue(null);

			const mockRequest = {
				url: new URL('http://localhost/api/comments/9999'),
				params: { id: '9999' }
			} as RequestEvent;

			const response = await getCommentById(mockRequest);
			expect(response.status).toBe(404);
		});
	});

	describe('GET /api/comments/user/[address]', () => {
		it('should return comments for valid user address', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc
						.array(fc.integer({ min: 0, max: 15 }), { minLength: 40, maxLength: 40 })
						.map((arr) => '0x' + arr.map((n) => n.toString(16)).join('')),
					fc.array(commentArbitrary, { minLength: 0, maxLength: 50 }),
					async (address, comments: Comment[]) => {
						mockGetCommentsByUser.mockReset();
						mockGetCommentsByUser.mockResolvedValue(comments);

						const mockRequest = {
							url: new URL(`http://localhost/api/comments/user/${address}`),
							params: { address }
						} as RequestEvent;

						const response = await getCommentsByUser(mockRequest);
						expect(response.status).toBe(200);

						const body = await response.json();
						expect(Array.isArray(body)).toBe(true);
						expect(body).toEqual(comments);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should handle service errors gracefully', async () => {
			mockGetCommentsByUser.mockRejectedValue(new Error('Service error'));

			const mockRequest = {
				url: new URL(
					'http://localhost/api/comments/user/0x1234567890123456789012345678901234567890'
				),
				params: { address: '0x1234567890123456789012345678901234567890' }
			} as RequestEvent;

			const response = await getCommentsByUser(mockRequest);
			expect(response.status).toBe(500);
		});
	});
});
