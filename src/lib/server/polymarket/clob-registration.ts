/**
 * Polymarket CLOB Registration
 * Handles registration with Polymarket's CLOB (Central Limit Order Book)
 * and creation of API credentials for trading
 *
 * Uses direct REST API calls instead of broken npm package
 */

import { Logger } from '../utils/logger';
import { deriveProxyWalletAddress } from '../utils/proxy-wallet';
import { signTypedDataWithServerWallet } from '../wallet/server-wallet';
import { supabaseAdmin } from '$lib/supabase/admin';

const logger = new Logger({ component: 'CLOBRegistration' });

const CLOB_API_URL = 'https://clob.polymarket.com';
const CHAIN_ID = 137; // Polygon mainnet

export interface PolymarketCredentials {
	apiKey: string;
	secret: string;
	passphrase: string;
	proxyWalletAddress: string;
}

/**
 * Create EIP-712 signature for CLOB authentication
 */
async function createClobAuthSignature(
	walletAddress: string,
	timestamp: number,
	encryptedKeyShares?: string
): Promise<string> {
	// EIP-712 domain for Polymarket CLOB
	const domain = {
		name: 'ClobAuthDomain',
		version: '1',
		chainId: CHAIN_ID
	};

	// EIP-712 types
	const types = {
		ClobAuth: [
			{ name: 'address', type: 'address' },
			{ name: 'timestamp', type: 'string' },
			{ name: 'nonce', type: 'uint256' },
			{ name: 'message', type: 'string' }
		]
	};

	// Message to sign
	const message = {
		address: walletAddress,
		timestamp: timestamp.toString(),
		nonce: 0,
		message: 'This message attests that I control the given wallet'
	};

	// Sign using Dynamic's server wallet
	const signature = await signTypedDataWithServerWallet(
		walletAddress,
		domain,
		types,
		message,
		encryptedKeyShares
	);

	return signature;
}

/**
 * Register user with Polymarket CLOB and create API credentials
 * This allows the user to trade on Polymarket
 */
export async function registerWithPolymarket(userId: string): Promise<PolymarketCredentials> {
	try {
		logger.info('Starting Polymarket CLOB registration', { userId });

		// Get user data from Supabase
		const { data: user, error: userError } = await supabaseAdmin
			.from('users')
			.select('server_wallet_address, encrypted_server_key_shares')
			.eq('id', userId)
			.single();

		if (userError || !user || !user.server_wallet_address) {
			throw new Error('User or server wallet not found');
		}

		const { server_wallet_address, encrypted_server_key_shares } = user;

		logger.info('Retrieved user wallet info', {
			userId,
			address: server_wallet_address
		});

		// Derive the proxy wallet address (deterministic based on server wallet)
		const proxyWalletAddress = await deriveProxyWalletAddress(server_wallet_address);

		logger.info('Derived proxy wallet address', {
			userId,
			serverWallet: server_wallet_address,
			proxyWallet: proxyWalletAddress
		});

		// Create EIP-712 signature for L1 authentication
		const timestamp = Math.floor(Date.now() / 1000);
		const signature = await createClobAuthSignature(
			server_wallet_address,
			timestamp,
			encrypted_server_key_shares || undefined
		);

		logger.info('Created CLOB auth signature', { userId });

		// Call Polymarket CLOB API to create/derive API key
		const response = await fetch(`${CLOB_API_URL}/auth/api-key`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'POLY-ADDRESS': server_wallet_address,
				'POLY-SIGNATURE': signature,
				'POLY-TIMESTAMP': timestamp.toString(),
				'POLY-NONCE': '0'
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`CLOB API error: ${response.status} - ${errorText}`);
		}

		const apiCreds = await response.json();

		logger.info('Successfully created/derived API credentials', {
			userId,
			proxyWallet: proxyWalletAddress,
			hasApiKey: !!apiCreds.apiKey,
			hasSecret: !!apiCreds.secret,
			hasPassphrase: !!apiCreds.passphrase
		});

		return {
			apiKey: apiCreds.apiKey,
			secret: apiCreds.secret,
			passphrase: apiCreds.passphrase,
			proxyWalletAddress
		};
	} catch (error) {
		logger.error('Failed to register with Polymarket CLOB', {
			userId,
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined
		});
		throw new Error(
			`Failed to register with Polymarket: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}
