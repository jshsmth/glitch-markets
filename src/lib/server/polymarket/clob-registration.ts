/**
 * Polymarket CLOB Registration
 * Handles registration with Polymarket's CLOB (Central Limit Order Book)
 * and creation of API credentials for trading
 *
 * Uses official @polymarket/clob-client SDK
 */

import { ClobClient } from '@polymarket/clob-client';
import { Wallet } from '@ethersproject/wallet';
import { Logger } from '../utils/logger';
import { deriveProxyWalletAddress } from '../utils/proxy-wallet';
import { decryptData } from '../utils/encryption';
import { supabaseAdmin } from '$lib/supabase/admin';
import { deployProxyWallet } from './proxy-deployment';

const logger = new Logger({ component: 'CLOBRegistration' });

const CLOB_API_URL = 'https://clob.polymarket.com';
const CHAIN_ID = 137;

export interface PolymarketCredentials {
	apiKey: string;
	secret: string;
	passphrase: string;
	proxyWalletAddress: string;
	deployed: boolean;
	transactionHash?: string;
}

/**
 * Create an ethers Wallet from encrypted key shares for CLOB client
 */
function createEthersWallet(encryptedKeyShares: string): Wallet {
	const privateKey = decryptData(encryptedKeyShares) as string;
	return new Wallet(privateKey);
}

/**
 * Create L1 authenticated CLOB client for API key management
 */
function createL1Client(encryptedKeyShares: string): ClobClient {
	const wallet = createEthersWallet(encryptedKeyShares);
	return new ClobClient(CLOB_API_URL, CHAIN_ID, wallet);
}

/**
 * Register user with Polymarket CLOB and deploy their proxy wallet
 */
export async function registerWithPolymarket(userId: string): Promise<PolymarketCredentials> {
	try {
		logger.info('Starting Polymarket CLOB registration', { userId });

		const { data: user, error: userError } = await supabaseAdmin
			.from('users')
			.select('server_wallet_address, encrypted_server_key_shares')
			.eq('id', userId)
			.single();

		if (userError || !user || !user.server_wallet_address) {
			throw new Error('User or server wallet not found');
		}

		const { server_wallet_address, encrypted_server_key_shares } = user;

		if (!encrypted_server_key_shares) {
			throw new Error('Encrypted key shares not found');
		}

		logger.info('Retrieved user wallet info', {
			userId,
			address: server_wallet_address
		});

		const proxyWalletAddress = await deriveProxyWalletAddress(server_wallet_address);

		logger.info('Derived proxy wallet address', {
			userId,
			serverWallet: server_wallet_address,
			proxyWallet: proxyWalletAddress
		});

		const client = createL1Client(encrypted_server_key_shares);

		logger.info('Created L1 CLOB client', { userId });

		const apiCreds = await client.createOrDeriveApiKey();

		logger.info('Successfully created/derived API credentials via CLOB client', {
			userId,
			proxyWallet: proxyWalletAddress,
			hasApiKey: !!apiCreds.key,
			hasSecret: !!apiCreds.secret,
			hasPassphrase: !!apiCreds.passphrase
		});

		logger.info('Deploying proxy wallet on-chain', { userId, proxyWalletAddress });

		const deploymentResult = await deployProxyWallet(
			encrypted_server_key_shares,
			proxyWalletAddress
		);

		logger.info('Proxy wallet deployment completed', {
			userId,
			proxyWalletAddress,
			deployed: deploymentResult.deployed,
			alreadyDeployed: deploymentResult.alreadyDeployed,
			transactionHash: deploymentResult.transactionHash
		});

		return {
			apiKey: apiCreds.key,
			secret: apiCreds.secret,
			passphrase: apiCreds.passphrase,
			proxyWalletAddress,
			deployed: deploymentResult.deployed,
			transactionHash: deploymentResult.transactionHash
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
