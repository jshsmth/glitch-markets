/**
 * TypeScript types for Dynamic SDK
 * Based on Dynamic's client SDK structure
 */

export interface DynamicVerifiedCredential {
	address: string;
	chain?: string;
	id?: string;
	walletName?: string;
	walletProvider?: string;
}

export interface DynamicUser {
	id: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	username?: string;
	alias?: string;
	verifiedCredentials?: DynamicVerifiedCredential[];
	lastVerifiedCredentialId?: string;
	createdAt?: string;
	metadata?: Record<string, unknown>;
}

export interface DynamicAuthToken {
	token: string;
	expiresAt?: number;
}
