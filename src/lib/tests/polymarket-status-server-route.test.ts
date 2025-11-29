/**
 * Tests for GET /api/polymarket/status server route
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ethereumArbitraries } from '$lib/tests/arbitraries/common-arbitraries.js';

// Mock database module
const mockDbQuery = {
	polymarketCredentials: {
		findFirst: vi.fn()
	}
};

vi.mock('$lib/server/db', () => ({
	db: {
		query: mockDbQuery
	}
}));

// Mock logger to avoid console noise
vi.mock('$lib/server/utils/logger', () => ({
	Logger: class {
		info = vi.fn();
		error = vi.fn();
		warn = vi.fn();
		debug = vi.fn();
	}
}));

const { GET } = await import('../../routes/api/polymarket/status/+server');

/**
 * Arbitraries for Polymarket credentials
 */
const userIdArbitrary = fc.uuid();

describe('GET /api/polymarket/status', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockDbQuery.polymarketCredentials.findFirst.mockReset();
	});

	/**
	 * Feature: polymarket-status
	 * Property: Unauthorized access rejection
	 *
	 * Any request without authentication (no locals.user) must be rejected with 401
	 */
	describe('Property: Authentication requirement', () => {
		it('should return 401 when locals.user is missing', async () => {
			const mockRequest = {
				locals: {}
			} as any;

			const response = await GET(mockRequest);
			expect(response.status).toBe(401);

			const body = await response.json();
			expect(body).toHaveProperty('error', 'Unauthorized');
		});
	});

	/**
	 * Feature: polymarket-status
	 * Property: Registered user status
	 *
	 * For any authenticated user with Polymarket credentials,
	 * the endpoint should return registered: true and their wallet address.
	 */
	describe('Property: Registered user handling', () => {
		it('should return registered status and wallet address for registered users', async () => {
			await fc.assert(
				fc.asyncProperty(
					userIdArbitrary,
					ethereumArbitraries.validAddress(),
					async (userId, walletAddress) => {
						// Mock existing credentials
						const credentials = {
							userId,
							walletAddress,
							apiKey: 'test-key',
							apiSecret: 'test-secret',
							createdAt: new Date()
						};
						mockDbQuery.polymarketCredentials.findFirst.mockResolvedValue(credentials);

						const mockRequest = {
							locals: { user: { userId } }
						} as any;

						const response = await GET(mockRequest);
						expect(response.status).toBe(200);

						const body = await response.json();
						expect(body).toHaveProperty('registered', true);
						expect(body).toHaveProperty('walletAddress', walletAddress);

						// Verify query was called correctly
						expect(mockDbQuery.polymarketCredentials.findFirst).toHaveBeenCalled();
					}
				),
				{ numRuns: 20 }
			);
		});
	});

	/**
	 * Feature: polymarket-status
	 * Property: Unregistered user status
	 *
	 * For any authenticated user without Polymarket credentials,
	 * the endpoint should return registered: false and null wallet address.
	 */
	describe('Property: Unregistered user handling', () => {
		it('should return unregistered status for users without credentials', async () => {
			await fc.assert(
				fc.asyncProperty(userIdArbitrary, async (userId) => {
					// Mock no credentials found
					mockDbQuery.polymarketCredentials.findFirst.mockResolvedValue(null);

					const mockRequest = {
						locals: { user: { userId } }
					} as any;

					const response = await GET(mockRequest);
					expect(response.status).toBe(200);

					const body = await response.json();
					expect(body).toHaveProperty('registered', false);
					expect(body).toHaveProperty('walletAddress', null);
				}),
				{ numRuns: 20 }
			);
		});
	});

	/**
	 * Feature: polymarket-status
	 * Property: Database error handling
	 *
	 * If database operations fail, the endpoint should return 500
	 * with error details.
	 */
	describe('Property: Database error handling', () => {
		it('should return 500 when database query fails', async () => {
			await fc.assert(
				fc.asyncProperty(
					userIdArbitrary,
					fc.string({ minLength: 10, maxLength: 100 }),
					async (userId, errorMessage) => {
						// Mock database query failure
						mockDbQuery.polymarketCredentials.findFirst.mockRejectedValue(new Error(errorMessage));

						const mockRequest = {
							locals: { user: { userId } }
						} as any;

						const response = await GET(mockRequest);
						expect(response.status).toBe(500);

						const body = await response.json();
						expect(body).toHaveProperty('error', 'Failed to check Polymarket status');
						expect(body).toHaveProperty('message', errorMessage);
					}
				),
				{ numRuns: 20 }
			);
		});
	});

	/**
	 * Feature: polymarket-status
	 * Property: Response structure consistency
	 *
	 * All successful responses should have consistent structure
	 * with required fields properly typed.
	 */
	describe('Property: Response structure', () => {
		it('should return consistent structure for all successful requests', async () => {
			await fc.assert(
				fc.asyncProperty(
					userIdArbitrary,
					fc.boolean(), // registered or not
					fc.option(ethereumArbitraries.validAddress()), // optional wallet address
					async (userId, isRegistered, walletAddress) => {
						if (isRegistered && walletAddress) {
							mockDbQuery.polymarketCredentials.findFirst.mockResolvedValue({
								userId,
								walletAddress,
								apiKey: 'test',
								apiSecret: 'test'
							});
						} else {
							mockDbQuery.polymarketCredentials.findFirst.mockResolvedValue(null);
						}

						const mockRequest = {
							locals: { user: { userId } }
						} as any;

						const response = await GET(mockRequest);
						expect(response.status).toBe(200);

						const body = await response.json();

						// Verify required fields
						expect(body).toHaveProperty('registered');
						expect(body).toHaveProperty('walletAddress');
						expect(typeof body.registered).toBe('boolean');

						// Verify walletAddress is either string or null
						if (body.walletAddress !== null) {
							expect(typeof body.walletAddress).toBe('string');
						}
					}
				),
				{ numRuns: 20 }
			);
		});
	});

	/**
	 * Feature: polymarket-status
	 * Property: Boolean consistency
	 *
	 * The registered field should correctly reflect credential existence
	 */
	describe('Property: Boolean consistency', () => {
		it('should return registered=true when credentials exist', async () => {
			const userId = 'user-123';
			const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';

			mockDbQuery.polymarketCredentials.findFirst.mockResolvedValue({
				userId,
				walletAddress,
				apiKey: 'key',
				apiSecret: 'secret'
			});

			const mockRequest = {
				locals: { user: { userId } }
			} as any;

			const response = await GET(mockRequest);
			const body = await response.json();

			expect(body.registered).toBe(true);
			expect(body.walletAddress).toBe(walletAddress);
		});

		it('should return registered=false when credentials do not exist', async () => {
			const userId = 'user-456';

			mockDbQuery.polymarketCredentials.findFirst.mockResolvedValue(null);

			const mockRequest = {
				locals: { user: { userId } }
			} as any;

			const response = await GET(mockRequest);
			const body = await response.json();

			expect(body.registered).toBe(false);
			expect(body.walletAddress).toBe(null);
		});
	});
});
