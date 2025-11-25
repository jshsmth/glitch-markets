/**
 * JWT Verification Utilities
 * Shared utilities for verifying Dynamic JWT tokens
 */

import { jwtVerify, createRemoteJWKSet } from 'jose';
import { DYNAMIC_ENVIRONMENT_ID } from '$env/static/private';

// Create JWKS client for Dynamic JWT verification
// This automatically fetches and caches public keys from Dynamic
const JWKS = createRemoteJWKSet(
	new URL(`https://app.dynamic.xyz/api/v0/sdk/${DYNAMIC_ENVIRONMENT_ID}/.well-known/jwks`)
);

export interface VerifiedUser {
	userId: string;
	walletAddress?: string;
	email?: string;
	sub?: string;
	[key: string]: unknown;
}

/**
 * Verify Dynamic JWT token
 * @param token JWT token string
 * @returns Verified user data or null if verification fails
 */
export async function verifyDynamicJWT(token: string): Promise<VerifiedUser | null> {
	try {
		// Verify JWT with Dynamic's public key
		const { payload } = await jwtVerify(token, JWKS, {
			algorithms: ['RS256']
		});

		// Type assertion for verified_credentials
		const verifiedCredentials = payload.verified_credentials as
			| Array<{ address?: string }>
			| undefined;

		return {
			userId: payload.sub as string,
			sub: payload.sub as string,
			walletAddress: (verifiedCredentials?.[0]?.address || payload.wallet_address) as
				| string
				| undefined,
			email: payload.email as string | undefined,
			...payload
		};
	} catch (error) {
		console.error('JWT verification failed:', error);
		return null;
	}
}
