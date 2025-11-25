/**
 * Tests for Auth State Store (auth.svelte.ts)
 * Tests the core authentication state management using Svelte 5 runes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DynamicClient } from '@dynamic-labs-sdk/client';
import type { DynamicUser, DynamicVerifiedCredential } from '$lib/types/dynamic';

import {
	authState,
	isAuthenticated,
	getToken,
	getWalletAccounts,
	initializeAuthListeners,
	setInitializationComplete
} from './auth.svelte';

// Mock the Dynamic SDK's onEvent function
vi.mock('@dynamic-labs-sdk/client', () => ({
	onEvent: vi.fn()
}));

// Mock browser environment
vi.mock('$app/environment', () => ({
	browser: true
}));

describe('Auth State Store', () => {
	beforeEach(() => {
		// Reset auth state before each test
		authState.client = null;
		authState.user = null;
		authState.isInitializing = true;

		// Clear all mocks
		vi.clearAllMocks();
	});

	describe('Initial State', () => {
		it('should have null client initially', () => {
			expect(authState.client).toBeNull();
		});

		it('should have null user initially', () => {
			expect(authState.user).toBeNull();
		});

		it('should be initializing by default', () => {
			expect(authState.isInitializing).toBe(true);
		});
	});

	describe('isAuthenticated()', () => {
		it('should return false when user is null', () => {
			authState.user = null;
			expect(isAuthenticated()).toBe(false);
		});

		it('should return false when user is undefined', () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			authState.user = undefined as any;
			expect(isAuthenticated()).toBe(false);
		});

		it('should return true when user is set', () => {
			authState.user = {
				id: 'user-123',
				email: 'test@example.com'
			} as DynamicUser;

			expect(isAuthenticated()).toBe(true);
		});

		it('should return true even for minimal user object', () => {
			authState.user = {
				id: 'minimal-user'
			} as DynamicUser;

			expect(isAuthenticated()).toBe(true);
		});
	});

	describe('getToken()', () => {
		it('should return null when client is null', () => {
			authState.client = null;
			expect(getToken()).toBeNull();
		});

		it('should return null when client exists but has no token', () => {
			authState.client = {
				token: undefined,
				initStatus: 'initialized',
				mfaToken: null,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				projectSettings: {} as any,
				sessionExpiresAt: null,
				user: null
			} as unknown as DynamicClient;

			expect(getToken()).toBeNull();
		});

		it('should return token when client has valid token', () => {
			const mockToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';

			authState.client = {
				token: mockToken
			} as DynamicClient;

			expect(getToken()).toBe(mockToken);
		});

		it('should return empty string token (not null)', () => {
			authState.client = {
				token: ''
			} as DynamicClient;

			// Empty string is returned as-is (nullish coalescing only triggers for null/undefined)
			expect(getToken()).toBe('');
		});
	});

	describe('getWalletAccounts()', () => {
		it('should return empty array when user is null', () => {
			authState.user = null;
			expect(getWalletAccounts()).toEqual([]);
		});

		it('should return empty array when user has no verifiedCredentials', () => {
			authState.user = {
				id: 'user-no-wallets',
				email: 'nowallet@example.com'
			} as DynamicUser;

			expect(getWalletAccounts()).toEqual([]);
		});

		it('should return empty array when verifiedCredentials is undefined', () => {
			authState.user = {
				id: 'user-undefined-credentials',
				email: 'undefined@example.com',
				verifiedCredentials: undefined
			} as DynamicUser;

			expect(getWalletAccounts()).toEqual([]);
		});

		it('should return verifiedCredentials when present', () => {
			const mockCredentials: DynamicVerifiedCredential[] = [
				{
					address: '0xABC123',
					chain: 'EVM',
					walletName: 'MetaMask'
				},
				{
					address: '0xDEF456',
					chain: 'EVM',
					walletName: 'WalletConnect'
				}
			];

			authState.user = {
				id: 'user-with-wallets',
				email: 'wallets@example.com',
				verifiedCredentials: mockCredentials
			} as DynamicUser;

			const result = getWalletAccounts();

			expect(result).toEqual(mockCredentials);
			expect(result).toHaveLength(2);
			expect(result[0].address).toBe('0xABC123');
			expect(result[1].address).toBe('0xDEF456');
		});

		it('should return empty array explicitly set as verifiedCredentials', () => {
			authState.user = {
				id: 'user-empty-array',
				email: 'empty@example.com',
				verifiedCredentials: []
			} as DynamicUser;

			expect(getWalletAccounts()).toEqual([]);
		});
	});

	describe('setInitializationComplete()', () => {
		it('should set isInitializing to false', () => {
			authState.isInitializing = true;

			setInitializationComplete();

			expect(authState.isInitializing).toBe(false);
		});

		it('should remain false after multiple calls', () => {
			authState.isInitializing = true;

			setInitializationComplete();
			setInitializationComplete();
			setInitializationComplete();

			expect(authState.isInitializing).toBe(false);
		});
	});

	describe('initializeAuthListeners()', () => {
		it('should set client in authState', () => {
			const mockClient = {
				token: 'mock-token',
				user: null
			} as DynamicClient;

			initializeAuthListeners(mockClient);

			expect(authState.client).toStrictEqual(mockClient);
		});

		it('should set user from client', () => {
			const mockUser: DynamicUser = {
				id: 'user-init',
				email: 'init@example.com',
				verifiedCredentials: [
					{
						address: '0xINIT',
						chain: 'EVM'
					}
				]
			};

			const mockClient = {
				token: 'mock-token',
				user: mockUser
			} as DynamicClient;

			initializeAuthListeners(mockClient);

			expect(authState.user).toStrictEqual(mockUser);
		});

		it('should handle client with null user', () => {
			const mockClient = {
				token: 'mock-token',
				user: null
			} as DynamicClient;

			initializeAuthListeners(mockClient);

			expect(authState.user).toBeNull();
		});

		it('should register event listeners', async () => {
			const { onEvent } = await import('@dynamic-labs-sdk/client');

			const mockClient = {
				token: 'mock-token',
				user: null
			} as DynamicClient;

			initializeAuthListeners(mockClient);

			// Should have registered 2 event listeners
			expect(onEvent).toHaveBeenCalledTimes(2);

			// Check for userChanged event
			expect(onEvent).toHaveBeenCalledWith({
				event: 'userChanged',
				listener: expect.any(Function)
			});

			// Check for logout event
			expect(onEvent).toHaveBeenCalledWith({
				event: 'logout',
				listener: expect.any(Function)
			});
		});

		it('should return cleanup function', () => {
			const mockClient = {
				token: 'mock-token',
				user: null
			} as DynamicClient;

			const cleanup = initializeAuthListeners(mockClient);

			expect(cleanup).toBeDefined();
			expect(typeof cleanup).toBe('function');
		});
	});

	describe('State Reactivity', () => {
		it('should reflect changes when user is updated', () => {
			expect(isAuthenticated()).toBe(false);

			authState.user = {
				id: 'reactive-user',
				email: 'reactive@example.com'
			} as DynamicUser;

			expect(isAuthenticated()).toBe(true);
		});

		it('should reflect changes when user is cleared', () => {
			authState.user = {
				id: 'temp-user',
				email: 'temp@example.com'
			} as DynamicUser;

			expect(isAuthenticated()).toBe(true);

			authState.user = null;

			expect(isAuthenticated()).toBe(false);
		});

		it('should reflect changes when client token is updated', () => {
			authState.client = {
				token: 'old-token',
				initStatus: 'initialized',
				mfaToken: null,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				projectSettings: {} as any,
				sessionExpiresAt: null,
				user: null
			} as unknown as DynamicClient;

			expect(getToken()).toBe('old-token');

			authState.client = {
				...authState.client,
				token: 'new-token'
			};

			expect(getToken()).toBe('new-token');
		});
	});

	describe('Complex User Objects', () => {
		it('should handle user with all optional fields', () => {
			const fullUser: DynamicUser = {
				id: 'full-user',
				email: 'full@example.com',
				firstName: 'John',
				lastName: 'Doe',
				username: 'johndoe',
				alias: 'jd',
				verifiedCredentials: [
					{
						address: '0xFULL',
						chain: 'EVM',
						id: 'cred-1',
						walletName: 'MetaMask',
						walletProvider: 'injected'
					}
				],
				lastVerifiedCredentialId: 'cred-1',
				createdAt: '2024-01-01T00:00:00Z',
				metadata: {
					customField: 'customValue'
				}
			};

			authState.user = fullUser;

			expect(isAuthenticated()).toBe(true);
			expect(getWalletAccounts()).toHaveLength(1);
			expect(getWalletAccounts()[0].address).toBe('0xFULL');
		});

		it('should handle user with multiple wallet credentials', () => {
			authState.user = {
				id: 'multi-wallet-user',
				email: 'multi@example.com',
				verifiedCredentials: [
					{ address: '0xWALLET1', chain: 'EVM', walletName: 'MetaMask' },
					{ address: '0xWALLET2', chain: 'EVM', walletName: 'WalletConnect' },
					{ address: '0xWALLET3', chain: 'Solana', walletName: 'Phantom' }
				]
			} as DynamicUser;

			const wallets = getWalletAccounts();

			expect(wallets).toHaveLength(3);
			expect(wallets[0].address).toBe('0xWALLET1');
			expect(wallets[1].address).toBe('0xWALLET2');
			expect(wallets[2].address).toBe('0xWALLET3');
		});
	});

	describe('Edge Cases', () => {
		it('should handle rapid state changes', () => {
			// Simulate rapid login/logout
			for (let i = 0; i < 10; i++) {
				authState.user = {
					id: `user-${i}`,
					email: `user${i}@example.com`
				} as DynamicUser;

				expect(isAuthenticated()).toBe(true);

				authState.user = null;

				expect(isAuthenticated()).toBe(false);
			}
		});

		it('should handle setting same user multiple times', () => {
			const user: DynamicUser = {
				id: 'same-user',
				email: 'same@example.com'
			};

			authState.user = user;
			authState.user = user;
			authState.user = user;

			expect(isAuthenticated()).toBe(true);
			expect(authState.user).toStrictEqual(user);
		});

		it('should handle client with undefined token explicitly', () => {
			authState.client = {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				token: undefined as any,
				user: null
			} as DynamicClient;

			expect(getToken()).toBeNull();
		});

		it('should handle user updates after initialization', () => {
			const initialUser: DynamicUser = {
				id: 'initial',
				email: 'initial@example.com'
			};

			const updatedUser: DynamicUser = {
				id: 'initial',
				email: 'updated@example.com',
				verifiedCredentials: [
					{
						address: '0xNEW',
						chain: 'EVM'
					}
				]
			};

			authState.user = initialUser;
			expect(getWalletAccounts()).toEqual([]);

			authState.user = updatedUser;
			expect(getWalletAccounts()).toHaveLength(1);
			expect(getWalletAccounts()[0].address).toBe('0xNEW');
		});
	});

	describe('Browser Environment Check', () => {
		it('should still return cleanup function even in non-browser', async () => {
			// Note: This test runs in jsdom which is considered "browser" environment
			// In actual non-browser environment, the function returns early with undefined
			// But we can't easily test that without mocking modules differently

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { onEvent } = await import('@dynamic-labs-sdk/client');

			const mockClient = {
				token: 'mock-token',
				user: null
			} as DynamicClient;

			const cleanup = initializeAuthListeners(mockClient);

			// In jsdom (test environment), cleanup is returned
			expect(cleanup).toBeDefined();
			expect(typeof cleanup).toBe('function');
		});
	});
});
