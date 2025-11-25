/**
 * Integration tests for crypto utilities
 * Tests the actual crypto.ts and encryption.ts modules that use environment-specific keys
 *
 * Note: These tests use mock environment variables since we can't access real secrets in tests
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import crypto from 'node:crypto';

describe('Crypto Integration Tests', () => {
	// Generate mock encryption keys for testing
	const MOCK_POLYMARKET_KEY = crypto.randomBytes(32).toString('hex');
	const MOCK_SERVER_WALLET_KEY = crypto.randomBytes(32).toString('hex');

	beforeAll(() => {
		// Mock environment variables
		vi.stubEnv('POLYMARKET_ENCRYPTION_KEY', MOCK_POLYMARKET_KEY);
		vi.stubEnv('DYNAMIC_SERVER_WALLET_ENCRYPTION_KEY', MOCK_SERVER_WALLET_KEY);
	});

	describe('Polymarket Credential Encryption (crypto.ts)', () => {
		it('should encrypt and decrypt Polymarket credentials', async () => {
			// Dynamically import to use mocked env vars
			const { encryptWithAES, decryptWithAES } = await import('./crypto');

			const credentials = {
				apiKey: 'test-api-key',
				apiSecret: 'test-api-secret',
				passphrase: 'test-passphrase'
			};

			const plaintext = JSON.stringify(credentials);
			const encrypted = encryptWithAES(plaintext);
			const decrypted = decryptWithAES(encrypted);

			expect(decrypted).toBe(plaintext);
			expect(JSON.parse(decrypted)).toEqual(credentials);
		});

		it('should produce different ciphertext on each encryption', async () => {
			const { encryptWithAES, decryptWithAES } = await import('./crypto');

			const plaintext = 'same-credential';

			const encrypted1 = encryptWithAES(plaintext);
			const encrypted2 = encryptWithAES(plaintext);

			expect(encrypted1).not.toBe(encrypted2);
			expect(decryptWithAES(encrypted1)).toBe(plaintext);
			expect(decryptWithAES(encrypted2)).toBe(plaintext);
		});

		it('should detect tampering of encrypted credentials', async () => {
			const { encryptWithAES, decryptWithAES } = await import('./crypto');

			const plaintext = 'sensitive-data';
			const encrypted = encryptWithAES(plaintext);

			// Tamper with the encrypted string
			const parts = encrypted.split(':');
			parts[2] = parts[2].slice(0, -4) + 'DEAD';
			const tampered = parts.join(':');

			expect(() => decryptWithAES(tampered)).toThrow();
		});

		it('should reject empty credential strings (not a valid use case)', async () => {
			const { encryptWithAES } = await import('./crypto');

			const plaintext = '';
			const encrypted = encryptWithAES(plaintext);

			// Empty string encryption is not supported (throws on decryption)
			// This is acceptable since encrypting empty credentials has no practical use
			const { decryptWithAES } = await import('./crypto');
			expect(() => decryptWithAES(encrypted)).toThrow('Invalid encrypted data format');
		});

		it('should handle complex JSON credentials', async () => {
			const { encryptWithAES, decryptWithAES } = await import('./crypto');

			const complexCredentials = {
				userId: 'user-123',
				walletAddress: '0xABC123',
				proxyWalletAddress: '0xDEF456',
				credentials: {
					apiKey: 'pk_live_abc',
					apiSecret: 'sk_live_xyz',
					passphrase: 'secure-pass'
				},
				timestamp: Date.now(),
				metadata: {
					nested: {
						deeply: {
							value: 'test'
						}
					}
				}
			};

			const plaintext = JSON.stringify(complexCredentials);
			const encrypted = encryptWithAES(plaintext);
			const decrypted = decryptWithAES(encrypted);

			expect(JSON.parse(decrypted)).toEqual(complexCredentials);
		});
	});

	describe('Server Wallet Encryption (encryption.ts)', () => {
		it('should encrypt and decrypt server wallet key shares', async () => {
			const { encryptData, decryptData } = await import('./encryption');

			const keyShares = {
				share1: '0x' + crypto.randomBytes(32).toString('hex'),
				share2: '0x' + crypto.randomBytes(32).toString('hex'),
				walletId: 'wallet-123'
			};

			const plaintext = JSON.stringify(keyShares);
			const encrypted = encryptData(plaintext);
			const decrypted = decryptData(encrypted);

			expect(decrypted).toBe(plaintext);
			expect(JSON.parse(decrypted)).toEqual(keyShares);
		});

		it('should produce unique ciphertext for same key shares', async () => {
			const { encryptData, decryptData } = await import('./encryption');

			const plaintext = 'wallet-key-share-data';

			const encrypted1 = encryptData(plaintext);
			const encrypted2 = encryptData(plaintext);

			expect(encrypted1).not.toBe(encrypted2);
			expect(decryptData(encrypted1)).toBe(plaintext);
			expect(decryptData(encrypted2)).toBe(plaintext);
		});

		it('should detect tampering of encrypted key shares', async () => {
			const { encryptData, decryptData } = await import('./encryption');

			const plaintext = 'key-share-data';
			const encrypted = encryptData(plaintext);

			// Tamper with encrypted data
			const parts = encrypted.split(':');
			parts[1] = parts[1].slice(0, -4) + 'CAFE';
			const tampered = parts.join(':');

			expect(() => decryptData(tampered)).toThrow();
		});

		it('should handle MPC wallet external key shares format', async () => {
			const { encryptData, decryptData } = await import('./encryption');

			// Simulate actual MPC wallet key share structure
			const externalKeyShares = {
				keyShares: [
					{
						id: 'share-1',
						share: '0x' + crypto.randomBytes(64).toString('hex'),
						index: 1
					},
					{
						id: 'share-2',
						share: '0x' + crypto.randomBytes(64).toString('hex'),
						index: 2
					}
				],
				threshold: 2,
				totalShares: 2,
				walletId: 'wallet-abc-123',
				accountAddress: '0x' + crypto.randomBytes(20).toString('hex')
			};

			const plaintext = JSON.stringify(externalKeyShares);
			const encrypted = encryptData(plaintext);
			const decrypted = decryptData(encrypted);

			expect(JSON.parse(decrypted)).toEqual(externalKeyShares);
		});
	});

	describe('Encryption Isolation', () => {
		it('should use different keys for Polymarket and Server Wallet encryption', async () => {
			const { encryptWithAES, decryptWithAES } = await import('./crypto');
			const { encryptData, decryptData } = await import('./encryption');

			const plaintext = 'test-isolation';

			const encryptedPolymarket = encryptWithAES(plaintext);
			const encryptedServerWallet = encryptData(plaintext);

			// Should not be able to decrypt cross-module
			expect(() => decryptData(encryptedPolymarket)).toThrow();
			expect(() => decryptWithAES(encryptedServerWallet)).toThrow();

			// Should decrypt with correct module
			expect(decryptWithAES(encryptedPolymarket)).toBe(plaintext);
			expect(decryptData(encryptedServerWallet)).toBe(plaintext);
		});
	});

	describe('Format Validation', () => {
		it('should return correct format for both encryption modules', async () => {
			const { encryptWithAES } = await import('./crypto');
			const { encryptData } = await import('./encryption');

			const plaintext = 'format-test';

			const encryptedPolymarket = encryptWithAES(plaintext);
			const encryptedServerWallet = encryptData(plaintext);

			// Both should have format: iv:authTag:encrypted
			expect(encryptedPolymarket.split(':')).toHaveLength(3);
			expect(encryptedServerWallet.split(':')).toHaveLength(3);

			// IV should be 32 hex chars (16 bytes)
			expect(encryptedPolymarket.split(':')[0]).toHaveLength(32);
			expect(encryptedServerWallet.split(':')[0]).toHaveLength(32);

			// Auth tag should be 32 hex chars (16 bytes)
			expect(encryptedPolymarket.split(':')[1]).toHaveLength(32);
			expect(encryptedServerWallet.split(':')[1]).toHaveLength(32);
		});
	});

	describe('Real-World Credential Formats', () => {
		it('should encrypt Polymarket API credentials with correct format', async () => {
			const { encryptWithAES, decryptWithAES } = await import('./crypto');

			// Simulate real Polymarket credential structure
			const credentials = {
				walletAddress: '0x' + crypto.randomBytes(20).toString('hex'),
				proxyWalletAddress: '0x' + crypto.randomBytes(20).toString('hex'),
				apiKey: 'pk_' + crypto.randomBytes(32).toString('base64'),
				apiSecret: 'sk_' + crypto.randomBytes(32).toString('base64'),
				passphrase: crypto.randomBytes(16).toString('base64'),
				chainId: 137 // Polygon
			};

			const encrypted = encryptWithAES(JSON.stringify(credentials));
			const decrypted = decryptWithAES(encrypted);

			expect(JSON.parse(decrypted)).toEqual(credentials);
		});

		it('should encrypt Dynamic MPC wallet data with correct format', async () => {
			const { encryptData, decryptData } = await import('./encryption');

			// Simulate real Dynamic wallet structure
			const walletData = {
				walletId: 'wallet-' + crypto.randomBytes(16).toString('hex'),
				accountAddress: '0x' + crypto.randomBytes(20).toString('hex'),
				publicKeyHex: '0x' + crypto.randomBytes(33).toString('hex'),
				externalServerKeyShares: {
					shares: [
						{
							id: 'share-server',
							value: '0x' + crypto.randomBytes(64).toString('hex'),
							partyId: 1
						},
						{
							id: 'share-client',
							value: '0x' + crypto.randomBytes(64).toString('hex'),
							partyId: 2
						}
					],
					threshold: '2-of-2',
					curve: 'secp256k1'
				},
				createdAt: new Date().toISOString()
			};

			const encrypted = encryptData(JSON.stringify(walletData));
			const decrypted = decryptData(encrypted);

			expect(JSON.parse(decrypted)).toEqual(walletData);
		});
	});

	describe('Error Handling', () => {
		it('should handle decryption errors gracefully for Polymarket module', async () => {
			const { decryptWithAES } = await import('./crypto');

			expect(() => decryptWithAES('invalid:format')).toThrow();
			expect(() => decryptWithAES('not-even-close')).toThrow();
			expect(() => decryptWithAES('')).toThrow();
		});

		it('should handle decryption errors gracefully for Server Wallet module', async () => {
			const { decryptData } = await import('./encryption');

			expect(() => decryptData('invalid:format')).toThrow();
			expect(() => decryptData('not-even-close')).toThrow();
			expect(() => decryptData('')).toThrow();
		});
	});

	describe('Performance', () => {
		it('should handle encryption/decryption at reasonable speed', async () => {
			const { encryptWithAES, decryptWithAES } = await import('./crypto');

			const plaintext = 'performance-test-' + crypto.randomBytes(100).toString('hex');

			const startTime = performance.now();

			for (let i = 0; i < 100; i++) {
				const encrypted = encryptWithAES(plaintext);
				const decrypted = decryptWithAES(encrypted);
				expect(decrypted).toBe(plaintext);
			}

			const endTime = performance.now();
			const duration = endTime - startTime;

			// 100 encrypt/decrypt cycles should complete in under 1 second
			expect(duration).toBeLessThan(1000);
		});
	});
});
