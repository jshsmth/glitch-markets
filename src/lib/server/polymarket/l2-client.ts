/**
 * Polymarket L2 Client Utilities
 * Handles L2 authenticated operations (trading, orders, etc.)
 *
 * L2 authentication uses API credentials (apiKey, secret, passphrase)
 * generated from L1 authentication
 */

import { ClobClient } from '@polymarket/clob-client';
import { Wallet } from '@ethersproject/wallet';
import { supabaseAdmin } from '$lib/supabase/admin';
import { decryptData } from '../utils/encryption';
import { Logger } from '../utils/logger';

const logger = new Logger({ component: 'L2Client' });

const CLOB_API_URL = 'https://clob.polymarket.com';
const CHAIN_ID = 137; // Polygon mainnet
const SIGNATURE_TYPE = 1; // POLY_PROXY signature type

interface DecryptedCredentials {
	apiKey: string;
	secret: string;
	passphrase: string;
	proxyWalletAddress: string;
}

/**
 * Get decrypted Polymarket credentials and server wallet for a user
 */
async function getUserCredentials(userId: string): Promise<DecryptedCredentials> {
	// Get both Polymarket credentials and server wallet key shares
	const { data: creds, error: credsError } = await supabaseAdmin
		.from('polymarket_credentials')
		.select('encrypted_api_key, encrypted_secret, encrypted_passphrase, proxy_wallet_address')
		.eq('user_id', userId)
		.single();

	if (credsError || !creds) {
		logger.error('Failed to get user credentials', { userId, error: credsError });
		throw new Error('Polymarket credentials not found. Please register first.');
	}

	// Decrypt credentials
	const apiKey = decryptData(creds.encrypted_api_key) as string;
	const secret = decryptData(creds.encrypted_secret) as string;
	const passphrase = decryptData(creds.encrypted_passphrase) as string;

	logger.info('Retrieved and decrypted user credentials', {
		userId,
		proxyWallet: creds.proxy_wallet_address
	});

	return {
		apiKey,
		secret,
		passphrase,
		proxyWalletAddress: creds.proxy_wallet_address
	};
}

/**
 * Get user's server wallet as an ethers Wallet instance
 */
async function getUserWallet(userId: string): Promise<Wallet> {
	const { data: user, error } = await supabaseAdmin
		.from('users')
		.select('encrypted_server_key_shares')
		.eq('id', userId)
		.single();

	if (error || !user?.encrypted_server_key_shares) {
		logger.error('Failed to get user wallet', { userId, error });
		throw new Error('Server wallet not found');
	}

	// Decrypt private key and create ethers Wallet
	const privateKey = decryptData(user.encrypted_server_key_shares) as string;
	return new Wallet(privateKey);
}

/**
 * Create L2 authenticated CLOB client for a user
 * Used for trading operations (orders, trades, cancellations, etc.)
 *
 * L2 client needs BOTH:
 * - Signer: To sign orders locally before submitting
 * - Credentials: To authenticate API requests
 *
 * @param userId - The user's Supabase auth ID
 * @returns Authenticated ClobClient ready for L2 operations
 *
 * @example
 * ```typescript
 * const client = await createL2Client(userId);
 * const orders = await client.getOpenOrders();
 * ```
 */
export async function createL2Client(userId: string): Promise<ClobClient> {
	const { apiKey, secret, passphrase, proxyWalletAddress } = await getUserCredentials(userId);

	// Get user's wallet for signing operations
	const wallet = await getUserWallet(userId);

	logger.info('Creating L2 CLOB client', { userId, proxyWallet: proxyWalletAddress });

	// Create L2 client with BOTH signer and credentials
	const client = new ClobClient(
		CLOB_API_URL,
		CHAIN_ID,
		wallet, // Signer for signing orders locally
		{
			key: apiKey,
			secret: secret,
			passphrase: passphrase
		},
		SIGNATURE_TYPE, // POLY_PROXY signature type
		proxyWalletAddress // Funder address (the proxy wallet holding funds)
	);

	logger.info('L2 CLOB client created successfully', { userId });

	return client;
}

/**
 * Update last_used_at timestamp for credentials
 */
export async function updateCredentialsUsage(userId: string): Promise<void> {
	await supabaseAdmin
		.from('polymarket_credentials')
		.update({ last_used_at: new Date().toISOString() })
		.eq('user_id', userId);
}
