/**
 * Property-based tests for POST /api/auth/register server route
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { authArbitraries, ethereumArbitraries } from '$lib/tests/arbitraries/common-arbitraries.js';

// Mock database module
const mockDbQuery = {
	users: {
		findFirst: vi.fn()
	}
};
const mockWhere = vi.fn();
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockDbUpdate = vi.fn(() => ({ set: mockSet }));
const mockValues = vi.fn();
const mockDbInsert = vi.fn(() => ({ values: mockValues }));

vi.mock('$lib/server/db', () => ({
	db: {
		query: mockDbQuery,
		update: mockDbUpdate,
		insert: mockDbInsert
	}
}));

// Mock server wallet creation
const mockCreateServerWallet = vi.fn();
vi.mock('$lib/server/wallet/server-wallet', () => ({
	createServerWallet: mockCreateServerWallet
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

const { POST } = await import('../../routes/api/auth/register/+server');

/**
 * Arbitraries for user data
 */
const userIdArbitrary = fc.uuid();
const serverWalletArbitrary = fc.record({
	accountAddress: ethereumArbitraries.validAddress(),
	walletId: fc.uuid(),
	encryptedKeyShares: fc.base64String({ minLength: 50, maxLength: 200 }),
	publicKeyHex: fc.base64String({ minLength: 64, maxLength: 128 })
});

describe('POST /api/auth/register', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockDbQuery.users.findFirst.mockReset();
		mockDbUpdate.mockReset();
		mockSet.mockReset();
		mockWhere.mockReset();
		mockDbInsert.mockReset();
		mockValues.mockReset();
		mockCreateServerWallet.mockReset();

		// Reset mock return values for chaining
		mockSet.mockReturnValue({ where: mockWhere });
		mockDbUpdate.mockReturnValue({ set: mockSet });
		mockDbInsert.mockReturnValue({ values: mockValues });
	});

	/**
	 * Feature: auth-registration
	 * Property: Unauthorized access rejection
	 *
	 * Any request without authentication (no locals.user) must be rejected with 401
	 */
	describe('Property: Authentication requirement', () => {
		it('should return 401 when locals.user is missing', async () => {
			const mockRequest = {
				locals: {}
			} as any;

			const response = await POST(mockRequest);
			expect(response.status).toBe(401);

			const body = await response.json();
			expect(body).toHaveProperty('error', 'Unauthorized');
		});
	});

	/**
	 * Feature: auth-registration
	 * Property: Existing user login update
	 *
	 * For any authenticated user that already exists in the database,
	 * the endpoint should update their lastLoginAt timestamp and return
	 * their existing data without creating a new wallet.
	 */
	describe('Property: Existing user handling', () => {
		it('should update lastLoginAt for existing users', async () => {
			const userId = 'user-123';
			const email = 'test@example.com';
			const serverWalletAddress = '0x1234567890abcdef1234567890abcdef12345678';

			// Mock existing user in database
			const existingUser = {
				id: userId,
				email,
				serverWalletAddress,
				serverWalletId: 'wallet-123',
				lastLoginAt: new Date('2024-01-01')
			};
			mockDbQuery.users.findFirst.mockResolvedValue(existingUser);

			const mockRequest = {
				locals: { user: { userId, email } }
			} as any;

			const response = await POST(mockRequest);
			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body).toHaveProperty('success', true);
			expect(body).toHaveProperty('message', 'User login updated');
			expect(body.user).toHaveProperty('userId', userId);
			expect(body.user).toHaveProperty('email', email);
			expect(body.user).toHaveProperty('serverWalletAddress', serverWalletAddress);
			expect(body.user).toHaveProperty('hasServerWallet', true);

			// Verify update was called
			expect(mockDbUpdate).toHaveBeenCalled();

			// Verify new wallet was NOT created
			expect(mockCreateServerWallet).not.toHaveBeenCalled();
		});
	});

	/**
	 * Feature: auth-registration
	 * Property: New user creation with server wallet
	 *
	 * For any authenticated user that doesn't exist in the database,
	 * the endpoint should create a server wallet and insert a new user record.
	 */
	describe('Property: New user creation', () => {
		it('should create server wallet and user record for new users', async () => {
			await fc.assert(
				fc.asyncProperty(
					userIdArbitrary,
					authArbitraries.email(),
					serverWalletArbitrary,
					async (userId, email, serverWallet) => {
						// Mock no existing user
						mockDbQuery.users.findFirst.mockResolvedValue(null);

						// Mock successful wallet creation
						mockCreateServerWallet.mockResolvedValue(serverWallet);

						const mockRequest = {
							locals: { user: { userId, email } }
						} as any;

						const response = await POST(mockRequest);
						expect(response.status).toBe(200);

						const body = await response.json();
						expect(body).toHaveProperty('success', true);
						expect(body).toHaveProperty('message', 'User created successfully with server wallet');
						expect(body.user).toHaveProperty('userId', userId);
						expect(body.user).toHaveProperty('email', email);
						expect(body.user).toHaveProperty('serverWalletAddress', serverWallet.accountAddress);
						expect(body.user).toHaveProperty('hasServerWallet', true);

						// Verify wallet creation was called
						expect(mockCreateServerWallet).toHaveBeenCalledWith(userId);

						// Verify insert was called
						expect(mockDbInsert).toHaveBeenCalled();
						expect(mockValues).toHaveBeenCalled();

						// Verify the inserted data structure (use last call)
						const calls = mockValues.mock.calls;
						const insertCall = calls[calls.length - 1][0];
						expect(insertCall).toHaveProperty('id', userId);
						expect(insertCall).toHaveProperty('email', email);
						expect(insertCall).toHaveProperty('serverWalletAddress', serverWallet.accountAddress);
						expect(insertCall).toHaveProperty('serverWalletId', serverWallet.walletId);
						expect(insertCall).toHaveProperty(
							'encryptedServerKeyShares',
							serverWallet.encryptedKeyShares
						);
						expect(insertCall).toHaveProperty('serverWalletPublicKey', serverWallet.publicKeyHex);
						expect(insertCall).toHaveProperty('createdAt');
						expect(insertCall).toHaveProperty('lastLoginAt');
					}
				),
				{ numRuns: 20 }
			);
		});
	});

	/**
	 * Feature: auth-registration
	 * Property: Error handling for wallet creation failures
	 *
	 * If server wallet creation fails, the endpoint should return 500
	 * with error details and an error ID for support.
	 */
	describe('Property: Wallet creation error handling', () => {
		it('should return 500 with error ID when wallet creation fails', async () => {
			await fc.assert(
				fc.asyncProperty(
					userIdArbitrary,
					authArbitraries.email(),
					fc.string({ minLength: 10, maxLength: 100 }),
					async (userId, email, errorMessage) => {
						// Mock no existing user
						mockDbQuery.users.findFirst.mockResolvedValue(null);

						// Mock wallet creation failure
						mockCreateServerWallet.mockRejectedValue(new Error(errorMessage));

						const mockRequest = {
							locals: { user: { userId, email } }
						} as any;

						const response = await POST(mockRequest);
						expect(response.status).toBe(500);

						const body = await response.json();
						expect(body).toHaveProperty('error', 'Failed to register user');
						expect(body).toHaveProperty('message', errorMessage);
						expect(body).toHaveProperty('errorId');
						expect(typeof body.errorId).toBe('string');
						expect(body.errorId.length).toBeGreaterThan(0);

						// Verify insert was NOT called
						expect(mockDbInsert).not.toHaveBeenCalled();
					}
				),
				{ numRuns: 50 }
			);
		});
	});

	/**
	 * Feature: auth-registration
	 * Property: Error handling for database failures
	 *
	 * If database operations fail, the endpoint should return 500
	 * with error details and an error ID for support.
	 */
	describe('Property: Database error handling', () => {
		it('should return 500 with error ID when database query fails', async () => {
			await fc.assert(
				fc.asyncProperty(
					userIdArbitrary,
					authArbitraries.email(),
					fc.string({ minLength: 10, maxLength: 100 }),
					async (userId, email, errorMessage) => {
						// Mock database query failure
						mockDbQuery.users.findFirst.mockRejectedValue(new Error(errorMessage));

						const mockRequest = {
							locals: { user: { userId, email } }
						} as any;

						const response = await POST(mockRequest);
						expect(response.status).toBe(500);

						const body = await response.json();
						expect(body).toHaveProperty('error', 'Failed to register user');
						expect(body).toHaveProperty('message', errorMessage);
						expect(body).toHaveProperty('errorId');
						expect(typeof body.errorId).toBe('string');
					}
				),
				{ numRuns: 50 }
			);
		});
	});

	/**
	 * Feature: auth-registration
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
					authArbitraries.email(),
					fc.boolean(), // existing user or new user
					async (userId, email, isExistingUser) => {
						if (isExistingUser) {
							mockDbQuery.users.findFirst.mockResolvedValue({
								id: userId,
								email,
								serverWalletAddress: '0xabc123',
								lastLoginAt: new Date()
							});
						} else {
							mockDbQuery.users.findFirst.mockResolvedValue(null);
							mockCreateServerWallet.mockResolvedValue({
								accountAddress: '0xabc123',
								walletId: 'wallet-123',
								encryptedKeyShares: 'encrypted',
								publicKeyHex: 'pubkey'
							});
						}

						const mockRequest = {
							locals: { user: { userId, email } }
						} as any;

						const response = await POST(mockRequest);
						expect(response.status).toBe(200);

						const body = await response.json();

						// Verify required fields
						expect(body).toHaveProperty('success');
						expect(body).toHaveProperty('user');
						expect(body).toHaveProperty('message');
						expect(typeof body.success).toBe('boolean');
						expect(typeof body.message).toBe('string');

						// Verify user object structure
						expect(body.user).toHaveProperty('userId');
						expect(body.user).toHaveProperty('email');
						expect(body.user).toHaveProperty('serverWalletAddress');
						expect(body.user).toHaveProperty('hasServerWallet');
						expect(typeof body.user.userId).toBe('string');
						expect(typeof body.user.email).toBe('string');
						expect(typeof body.user.serverWalletAddress).toBe('string');
						expect(typeof body.user.hasServerWallet).toBe('boolean');
					}
				),
				{ numRuns: 20 }
			);
		});
	});
});
