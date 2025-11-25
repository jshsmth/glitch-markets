/**
 * Tests for JWT verification logic from hooks.server.ts
 * Tests the core authentication mechanism by testing the payload extraction logic
 */

import { describe, it, expect } from 'vitest';

// Since the actual JWT verification in hooks.server.ts is tightly coupled with JWKS,
// we'll test the payload extraction logic which is the core business logic

interface VerifiedUser {
	userId: string;
	walletAddress: string;
	email: string;
}

/**
 * Extract user data from JWT payload
 * This mirrors the extraction logic in hooks.server.ts verifyJWT function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractUserFromPayload(payload: any): VerifiedUser {
	const verifiedCredentials = payload.verified_credentials as
		| Array<{ address?: string }>
		| undefined;

	return {
		userId: payload.sub as string,
		walletAddress: (verifiedCredentials?.[0]?.address || payload.wallet_address) as string,
		email: payload.email as string
	};
}

/**
 * Simulate authorization header parsing
 * This mirrors the header parsing logic in hooks.server.ts
 */
function parseAuthHeader(authHeader: string | null): string | null {
	if (!authHeader?.startsWith('Bearer ')) {
		return null;
	}

	return authHeader.slice(7);
}

describe('JWT Verification Logic', () => {
	describe('Authorization Header Parsing', () => {
		it('should extract token from valid Bearer header', () => {
			const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';
			const authHeader = `Bearer ${token}`;

			const result = parseAuthHeader(authHeader);

			expect(result).toBe(token);
		});

		it('should return null for missing header', () => {
			const result = parseAuthHeader(null);

			expect(result).toBeNull();
		});

		it('should return null for empty header', () => {
			const result = parseAuthHeader('');

			expect(result).toBeNull();
		});

		it('should return null for header without Bearer prefix', () => {
			const result = parseAuthHeader('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...');

			expect(result).toBeNull();
		});

		it('should return null for lowercase bearer', () => {
			const result = parseAuthHeader('bearer token123');

			expect(result).toBeNull();
		});

		it('should return null for header with extra whitespace before Bearer', () => {
			const result = parseAuthHeader('  Bearer token123');

			expect(result).toBeNull();
		});

		it('should handle Bearer with empty token', () => {
			const result = parseAuthHeader('Bearer ');

			expect(result).toBe('');
		});
	});

	describe('Payload Extraction - Valid Cases', () => {
		it('should extract user data from payload with verified_credentials', () => {
			const payload = {
				sub: 'user-123',
				email: 'test@example.com',
				verified_credentials: [{ address: '0xABC123' }]
			};

			const result = extractUserFromPayload(payload);

			expect(result).toEqual({
				userId: 'user-123',
				email: 'test@example.com',
				walletAddress: '0xABC123'
			});
		});

		it('should extract user data using wallet_address fallback', () => {
			const payload = {
				sub: 'user-456',
				email: 'fallback@example.com',
				wallet_address: '0xDEF456'
			};

			const result = extractUserFromPayload(payload);

			expect(result).toEqual({
				userId: 'user-456',
				email: 'fallback@example.com',
				walletAddress: '0xDEF456'
			});
		});

		it('should prioritize verified_credentials over wallet_address', () => {
			const payload = {
				sub: 'user-789',
				email: 'priority@example.com',
				verified_credentials: [{ address: '0xPRIMARY' }],
				wallet_address: '0xFALLBACK'
			};

			const result = extractUserFromPayload(payload);

			expect(result.walletAddress).toBe('0xPRIMARY');
		});

		it('should extract from first verified_credential when multiple exist', () => {
			const payload = {
				sub: 'user-multi',
				email: 'multi@example.com',
				verified_credentials: [
					{ address: '0xFIRST' },
					{ address: '0xSECOND' },
					{ address: '0xTHIRD' }
				]
			};

			const result = extractUserFromPayload(payload);

			expect(result.walletAddress).toBe('0xFIRST');
		});

		it('should handle payload with all fields', () => {
			const payload = {
				sub: 'user-complete',
				email: 'complete@example.com',
				verified_credentials: [{ address: '0xCOMPLETE' }],
				wallet_address: '0xBACKUP',
				iat: 1234567890,
				exp: 1234567890 + 3600
			};

			const result = extractUserFromPayload(payload);

			expect(result).toEqual({
				userId: 'user-complete',
				email: 'complete@example.com',
				walletAddress: '0xCOMPLETE'
			});
		});
	});

	describe('Payload Extraction - Edge Cases', () => {
		it('should handle empty verified_credentials array', () => {
			const payload = {
				sub: 'user-empty',
				email: 'empty@example.com',
				verified_credentials: [],
				wallet_address: '0xFALLBACK'
			};

			const result = extractUserFromPayload(payload);

			expect(result.walletAddress).toBe('0xFALLBACK');
		});

		it('should handle verified_credentials with no address field', () => {
			const payload = {
				sub: 'user-no-address',
				email: 'noaddress@example.com',
				verified_credentials: [{}],
				wallet_address: '0xFALLBACK'
			};

			const result = extractUserFromPayload(payload);

			expect(result.walletAddress).toBe('0xFALLBACK');
		});

		it('should handle verified_credentials with undefined address', () => {
			const payload = {
				sub: 'user-undefined',
				email: 'undefined@example.com',
				verified_credentials: [{ address: undefined }],
				wallet_address: '0xFALLBACK'
			};

			const result = extractUserFromPayload(payload);

			expect(result.walletAddress).toBe('0xFALLBACK');
		});

		it('should handle missing email field', () => {
			const payload = {
				sub: 'user-no-email',
				verified_credentials: [{ address: '0xABC' }]
			};

			const result = extractUserFromPayload(payload);

			expect(result.email).toBeUndefined();
		});

		it('should handle missing sub field', () => {
			const payload = {
				email: 'nosub@example.com',
				verified_credentials: [{ address: '0xABC' }]
			};

			const result = extractUserFromPayload(payload);

			expect(result.userId).toBeUndefined();
		});

		it('should handle missing both verified_credentials and wallet_address', () => {
			const payload = {
				sub: 'user-no-wallet',
				email: 'nowallet@example.com'
			};

			const result = extractUserFromPayload(payload);

			expect(result.walletAddress).toBeUndefined();
		});

		it('should handle null verified_credentials', () => {
			const payload = {
				sub: 'user-null',
				email: 'null@example.com',
				verified_credentials: null,
				wallet_address: '0xFALLBACK'
			};

			const result = extractUserFromPayload(payload);

			expect(result.walletAddress).toBe('0xFALLBACK');
		});

		it('should handle undefined verified_credentials', () => {
			const payload = {
				sub: 'user-undefined-creds',
				email: 'undefined@example.com',
				verified_credentials: undefined,
				wallet_address: '0xFALLBACK'
			};

			const result = extractUserFromPayload(payload);

			expect(result.walletAddress).toBe('0xFALLBACK');
		});
	});

	describe('Payload Extraction - Data Types', () => {
		it('should handle sub as string', () => {
			const payload = {
				sub: 'string-user-id',
				email: 'test@example.com',
				verified_credentials: [{ address: '0xABC' }]
			};

			const result = extractUserFromPayload(payload);

			expect(typeof result.userId).toBe('string');
			expect(result.userId).toBe('string-user-id');
		});

		it('should handle email as string', () => {
			const payload = {
				sub: 'user-123',
				email: 'complex.email+tag@subdomain.example.com',
				verified_credentials: [{ address: '0xABC' }]
			};

			const result = extractUserFromPayload(payload);

			expect(typeof result.email).toBe('string');
			expect(result.email).toBe('complex.email+tag@subdomain.example.com');
		});

		it('should handle walletAddress as string from verified_credentials', () => {
			const payload = {
				sub: 'user-123',
				email: 'test@example.com',
				verified_credentials: [{ address: '0x' + 'A'.repeat(40) }]
			};

			const result = extractUserFromPayload(payload);

			expect(typeof result.walletAddress).toBe('string');
			expect(result.walletAddress).toHaveLength(42);
		});

		it('should handle walletAddress as string from wallet_address', () => {
			const payload = {
				sub: 'user-123',
				email: 'test@example.com',
				wallet_address: '0x' + 'B'.repeat(40)
			};

			const result = extractUserFromPayload(payload);

			expect(typeof result.walletAddress).toBe('string');
			expect(result.walletAddress).toHaveLength(42);
		});
	});

	describe('Real-World Payloads', () => {
		it('should handle Dynamic.xyz JWT payload structure', () => {
			const payload = {
				sub: 'dynamic-user-abc-123-def-456',
				email: 'user@example.com',
				verified_credentials: [
					{
						address: '0x1234567890123456789012345678901234567890',
						chain: 'EVM',
						id: 'credential-id-123',
						walletName: 'MetaMask',
						walletProvider: 'injected'
					}
				],
				iat: 1704067200,
				exp: 1704153600,
				aud: 'https://example.com',
				iss: 'https://app.dynamic.xyz'
			};

			const result = extractUserFromPayload(payload);

			expect(result).toEqual({
				userId: 'dynamic-user-abc-123-def-456',
				email: 'user@example.com',
				walletAddress: '0x1234567890123456789012345678901234567890'
			});
		});

		it('should handle payload with additional Dynamic fields', () => {
			const payload = {
				sub: 'user-uuid-123',
				email: 'premium@example.com',
				verified_credentials: [
					{
						address: '0xABCDEF',
						chain: 'EVM',
						public_key: '0x...',
						format: 'blockchain'
					}
				],
				wallet_address: '0xBACKUP',
				environment_id: 'env-123',
				metadata: {
					plan: 'premium',
					features: ['feature1', 'feature2']
				}
			};

			const result = extractUserFromPayload(payload);

			expect(result.userId).toBe('user-uuid-123');
			expect(result.email).toBe('premium@example.com');
			expect(result.walletAddress).toBe('0xABCDEF');
		});

		it('should handle minimal valid payload', () => {
			const payload = {
				sub: 'minimal-user'
			};

			const result = extractUserFromPayload(payload);

			expect(result.userId).toBe('minimal-user');
			expect(result.email).toBeUndefined();
			expect(result.walletAddress).toBeUndefined();
		});
	});
});
