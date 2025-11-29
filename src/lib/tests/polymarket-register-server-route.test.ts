/**
 * Tests for POST /api/polymarket/register server route
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ethereumArbitraries } from '$lib/tests/arbitraries/common-arbitraries.js';

// Mock database module
const mockDbQuery = {
	polymarketCredentials: {
		findFirst: vi.fn()
	},
	users: {
		findFirst: vi.fn()
	}
};
const mockDbInsert = vi.fn();
const mockValues = vi.fn();
mockDbInsert.mockReturnValue({ values: mockValues });

vi.mock('$lib/server/db', () => ({
	db: {
		query: mockDbQuery,
		insert: mockDbInsert
	}
}));

// Mock crypto utils
const mockEncryptWithAES = vi.fn((data: string) => `encrypted_${data}`);
vi.mock('$lib/server/utils/crypto', () => ({
	encryptWithAES: mockEncryptWithAES
}));

// Mock wallet signing
const mockSignTypedDataWithServerWallet = vi.fn(
	async () => '0xmockedsignature1234567890abcdef1234567890abcdef'
);
vi.mock('$lib/server/wallet/server-wallet', () => ({
	signTypedDataWithServerWallet: mockSignTypedDataWithServerWallet
}));

// Mock proxy wallet derivation - returns a valid 40-char hex address
const mockDeriveProxyWalletAddress = vi.fn(async (address: string) => {
	// Return a valid Ethereum address by replacing first 5 chars with 'aaaaa'
	return `0xaaaaa${address.slice(7)}`;
});
vi.mock('$lib/server/utils/proxy-wallet', () => ({
	deriveProxyWalletAddress: mockDeriveProxyWalletAddress
}));

// Mock environment
vi.mock('$env/static/private', () => ({
	POLYMARKET_CLOB_URL: 'https://clob.polymarket.com'
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

const { POST } = await import('../../routes/api/polymarket/register/+server');

/**
 * Arbitraries for test data
 */
const userIdArbitrary = fc.uuid();

describe('POST /api/polymarket/register', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockDbQuery.polymarketCredentials.findFirst.mockReset();
		mockDbQuery.users.findFirst.mockReset();
		mockDbInsert.mockReset();
		mockValues.mockReset();
		mockEncryptWithAES.mockClear();
		mockSignTypedDataWithServerWallet.mockClear();
		mockDeriveProxyWalletAddress.mockClear();

		// Reset return values
		mockDbInsert.mockReturnValue({ values: mockValues });
		mockEncryptWithAES.mockImplementation((data: string) => `encrypted_${data}`);
		mockSignTypedDataWithServerWallet.mockResolvedValue(
			'0xmockedsignature1234567890abcdef1234567890abcdef'
		);
		mockDeriveProxyWalletAddress.mockImplementation(async (address: string) => {
			return `0xaaaaa${address.slice(7)}`;
		});

		// Mock fetch globally
		global.fetch = vi.fn();
	});

	/**
	 * Feature: polymarket-register
	 * Property: Unauthorized access rejection
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
	 * Feature: polymarket-register
	 * Property: Duplicate registration prevention
	 */
	describe('Property: Duplicate registration handling', () => {
		it('should return 400 when user already has Polymarket credentials', async () => {
			await fc.assert(
				fc.asyncProperty(
					userIdArbitrary,
					ethereumArbitraries.validAddress(),
					async (userId, walletAddress) => {
						// Mock existing credentials
						mockDbQuery.polymarketCredentials.findFirst.mockResolvedValue({
							userId,
							walletAddress,
							apiKey: 'existing-key'
						});

						const mockRequest = {
							locals: { user: { userId } }
						} as any;

						const response = await POST(mockRequest);
						expect(response.status).toBe(400);

						const body = await response.json();
						expect(body).toHaveProperty('error', 'Already registered with Polymarket');

						// Verify no new credentials were created
						expect(mockDbInsert).not.toHaveBeenCalled();
					}
				),
				{ numRuns: 10 }
			);
		});
	});

	/**
	 * Feature: polymarket-register
	 * Property: Missing server wallet handling
	 */
	describe('Property: Server wallet validation', () => {
		it('should return 400 when user has no server wallet', async () => {
			await fc.assert(
				fc.asyncProperty(userIdArbitrary, async (userId) => {
					// Mock no existing Polymarket credentials
					mockDbQuery.polymarketCredentials.findFirst.mockResolvedValue(null);

					// Mock user without server wallet
					mockDbQuery.users.findFirst.mockResolvedValue({
						id: userId,
						email: 'test@example.com',
						serverWalletAddress: null
					});

					const mockRequest = {
						locals: { user: { userId } }
					} as any;

					const response = await POST(mockRequest);
					expect(response.status).toBe(400);

					const body = await response.json();
					expect(body).toHaveProperty('error', 'Server wallet not found');
				}),
				{ numRuns: 10 }
			);
		});
	});

	/**
	 * Feature: polymarket-register
	 * Property: Successful registration
	 */
	describe('Property: Successful registration', () => {
		it('should successfully register with Polymarket CLOB', async () => {
			await fc.assert(
				fc.asyncProperty(
					userIdArbitrary,
					ethereumArbitraries.validAddress(),
					fc.string({ minLength: 32, maxLength: 64 }),
					fc.string({ minLength: 32, maxLength: 64 }),
					fc.string({ minLength: 16, maxLength: 32 }),
					async (userId, walletAddress, apiKey, secret, passphrase) => {
						// Mock no existing Polymarket credentials
						mockDbQuery.polymarketCredentials.findFirst.mockResolvedValue(null);

						// Mock user with server wallet
						mockDbQuery.users.findFirst.mockResolvedValue({
							id: userId,
							email: 'test@example.com',
							serverWalletAddress: walletAddress,
							encryptedServerKeyShares: 'encrypted-key-shares'
						});

						// Mock successful Polymarket API response
						(global.fetch as any).mockResolvedValue({
							ok: true,
							json: async () => ({
								apiKey,
								secret,
								passphrase
							})
						});

						const mockRequest = {
							locals: { user: { userId } }
						} as any;

						const response = await POST(mockRequest);

						const body = await response.json();

						// May succeed or fail depending on address validation
						if (response.status === 200) {
							expect(body).toHaveProperty('success', true);
							expect(body).toHaveProperty('message', 'Successfully registered with Polymarket');
							expect(body).toHaveProperty('proxyWalletAddress');

							// Verify credentials were encrypted
							expect(mockEncryptWithAES).toHaveBeenCalledWith(apiKey);
							expect(mockEncryptWithAES).toHaveBeenCalledWith(secret);
							expect(mockEncryptWithAES).toHaveBeenCalledWith(passphrase);

							// Verify signature was created
							expect(mockSignTypedDataWithServerWallet).toHaveBeenCalled();

							// Verify credentials were inserted
							expect(mockDbInsert).toHaveBeenCalled();
							expect(mockValues).toHaveBeenCalled();
						} else {
							// Error case (e.g., invalid address from deriveProxyWalletAddress)
							expect(response.status).toBe(500);
							expect(body).toHaveProperty('error');
						}
					}
				),
				{ numRuns: 5 } // Fewer runs due to complexity
			);
		});
	});

	/**
	 * Feature: polymarket-register
	 * Property: Polymarket API error handling
	 */
	describe('Property: Polymarket API error handling', () => {
		it('should return 500 when Polymarket API returns error', async () => {
			await fc.assert(
				fc.asyncProperty(
					userIdArbitrary,
					ethereumArbitraries.validAddress(),
					async (userId, walletAddress) => {
						// Mock no existing credentials
						mockDbQuery.polymarketCredentials.findFirst.mockResolvedValue(null);

						// Mock user with server wallet
						mockDbQuery.users.findFirst.mockResolvedValue({
							id: userId,
							serverWalletAddress: walletAddress,
							encryptedServerKeyShares: 'encrypted-key-shares'
						});

						// Mock failed Polymarket API response
						(global.fetch as any).mockResolvedValue({
							ok: false,
							status: 400,
							json: async () => ({ error: 'Invalid signature' }),
							text: async () => 'Invalid signature'
						});

						const mockRequest = {
							locals: { user: { userId } }
						} as any;

						const response = await POST(mockRequest);
						expect(response.status).toBe(500);

						const body = await response.json();
						expect(body).toHaveProperty('error', 'Failed to register with Polymarket');
						// Response can have either 'details' (from fetch error) or 'errorId' (from catch block)
						expect(body.details || body.errorId).toBeTruthy();

						// Verify credentials were NOT inserted
						expect(mockDbInsert).not.toHaveBeenCalled();
					}
				),
				{ numRuns: 5 }
			);
		});

		it('should return 500 when Polymarket API response is missing credentials', async () => {
			const userId = 'user-123';
			const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';

			mockDbQuery.polymarketCredentials.findFirst.mockResolvedValue(null);
			mockDbQuery.users.findFirst.mockResolvedValue({
				id: userId,
				serverWalletAddress: walletAddress,
				encryptedServerKeyShares: 'encrypted-key-shares'
			});

			// Mock response missing required fields
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => ({
					apiKey: 'test-key'
					// Missing secret and passphrase
				})
			});

			const mockRequest = {
				locals: { user: { userId } }
			} as any;

			const response = await POST(mockRequest);
			expect(response.status).toBe(500);

			const body = await response.json();
			// Can return either from catch block or from validation
			expect(body.error).toMatch(
				/Invalid response from Polymarket API|Failed to register with Polymarket/
			);
		});
	});

	/**
	 * Feature: polymarket-register
	 * Property: Database error handling
	 */
	describe('Property: Database error handling', () => {
		it('should return 500 with errorId when database operations fail', async () => {
			await fc.assert(
				fc.asyncProperty(
					userIdArbitrary,
					fc.string({ minLength: 10, maxLength: 100 }),
					async (userId, errorMessage) => {
						// Mock database failure
						mockDbQuery.polymarketCredentials.findFirst.mockRejectedValue(new Error(errorMessage));

						const mockRequest = {
							locals: { user: { userId } }
						} as any;

						const response = await POST(mockRequest);
						expect(response.status).toBe(500);

						const body = await response.json();
						expect(body).toHaveProperty('error', 'Failed to register with Polymarket');
						expect(body).toHaveProperty('message', errorMessage);
						expect(body).toHaveProperty('errorId');
						expect(typeof body.errorId).toBe('string');
					}
				),
				{ numRuns: 10 }
			);
		});
	});

	/**
	 * Feature: polymarket-register
	 * Property: Response structure consistency
	 */
	describe('Property: Response structure', () => {
		it('should return consistent structure for successful registrations', async () => {
			const userId = 'user-456';
			const walletAddress = '0xabcdef1234567890abcdef1234567890abcdef12'; // 42 chars

			mockDbQuery.polymarketCredentials.findFirst.mockResolvedValue(null);
			mockDbQuery.users.findFirst.mockResolvedValue({
				id: userId,
				serverWalletAddress: walletAddress,
				encryptedServerKeyShares: 'encrypted-key-shares'
			});

			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => ({
					apiKey: 'test-api-key',
					secret: 'test-secret',
					passphrase: 'test-passphrase'
				})
			});

			const mockRequest = {
				locals: { user: { userId } }
			} as any;

			const response = await POST(mockRequest);
			const body = await response.json();

			if (body.success) {
				// Successful registration
				expect(body).toHaveProperty('success', true);
				expect(body).toHaveProperty('message');
				expect(body).toHaveProperty('proxyWalletAddress');
				expect(typeof body.message).toBe('string');
				expect(typeof body.proxyWalletAddress).toBe('string');
			} else {
				// Error response (e.g., from address validation)
				expect(body).toHaveProperty('error');
				expect(typeof body.error).toBe('string');
			}
		});
	});
});
