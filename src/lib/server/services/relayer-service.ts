/**
 * Relayer Service
 * Handles gasless transactions through Polymarket's builder relayer
 *
 * Supports:
 * - USDC transfers (withdrawals)
 * - CTF operations (merge, redeem, split)
 * - Token approvals
 * - Proxy wallet deployment
 */

import { RelayClient, RelayerTxType } from '@polymarket/builder-relayer-client';
import { BuilderConfig } from '@polymarket/builder-signing-sdk';
import { Wallet } from '@ethersproject/wallet';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Logger } from '$lib/utils/logger';
import { env } from '$env/dynamic/private';
import { encodeFunctionData } from 'viem';
import { decryptData } from '../utils/encryption.js';
import { supabaseAdmin } from '$lib/supabase/admin';

const log = Logger.forComponent('RelayerService');

const POLYGON_CHAIN_ID = 137;
const RELAYER_URL = 'https://relayer-v2.polymarket.com';

export interface TransferParams {
	from: string;
	to: string;
	amount: string;
	tokenAddress: string;
}

export interface RelayerResponse {
	success: boolean;
	transactionHash?: string;
	transactionId?: string;
	error?: string;
}

/**
 * Create Ethers provider for Polygon
 */
function createEthersProvider(): JsonRpcProvider {
	const rpcUrl = env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
	return new JsonRpcProvider(rpcUrl);
}

/**
 * Create Ethers Wallet from encrypted key shares
 * Follows the pattern from proxy-deployment.ts
 */
function createEthersWallet(encryptedKeyShares: string): Wallet {
	const privateKey = decryptData(encryptedKeyShares) as string;
	const provider = createEthersProvider();
	return new Wallet(privateKey, provider);
}

/**
 * Get builder configuration from environment variables
 */
function getBuilderConfig(): BuilderConfig {
	const apiKey = env.BUILDER_API_KEY;
	const apiSecret = env.BUILDER_SECRET;
	const apiPassphrase = env.BUILDER_PASSPHRASE;

	if (!apiKey || !apiSecret || !apiPassphrase) {
		throw new Error(
			'Builder credentials not configured. Set BUILDER_API_KEY, BUILDER_SECRET, and BUILDER_PASSPHRASE environment variables.'
		);
	}

	return new BuilderConfig({
		localBuilderCreds: {
			key: apiKey,
			secret: apiSecret,
			passphrase: apiPassphrase
		}
	});
}

/**
 * Create RelayClient for a specific user
 * Each user gets their own client with their wallet as signer
 */
async function createUserRelayClient(userId: string): Promise<RelayClient> {
	log.info('Creating relay client for user', { userId });

	const { data: user, error } = await supabaseAdmin
		.from('users')
		.select('encrypted_server_key_shares, server_wallet_address')
		.eq('id', userId)
		.single();

	if (error || !user?.encrypted_server_key_shares) {
		throw new Error('Server wallet not found for user');
	}

	const wallet = createEthersWallet(user.encrypted_server_key_shares);
	const builderConfig = getBuilderConfig();

	log.info('Initialized relay client with user wallet', {
		userId,
		walletAddress: user.server_wallet_address
	});

	return new RelayClient(
		env.RELAYER_ENDPOINT || RELAYER_URL,
		POLYGON_CHAIN_ID,
		wallet,
		builderConfig,
		RelayerTxType.PROXY
	);
}

/**
 * Relayer Service
 * Provides gasless transaction execution through Polymarket's relayer
 * Each method creates a user-specific relay client with proper signing
 */
export class RelayerService {
	/**
	 * Transfer ERC20 tokens (e.g., USDC) gaslessly
	 *
	 * @param userId - User ID to get signing wallet
	 * @param params - Transfer parameters
	 * @returns Promise resolving to transaction result
	 *
	 * @example
	 * ```typescript
	 * const result = await relayerService.transferERC20('user-uuid', {
	 *   from: '0xUserProxyWallet...',
	 *   to: '0xDestinationAddress...',
	 *   amount: '1000000', // 1 USDC (6 decimals)
	 *   tokenAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' // USDC.e
	 * });
	 * ```
	 */
	async transferERC20(userId: string, params: TransferParams): Promise<RelayerResponse> {
		const { from, to, amount, tokenAddress } = params;

		try {
			log.info('Executing gasless ERC20 transfer', {
				userId,
				from,
				to,
				amount,
				tokenAddress
			});

			const relayClient = await createUserRelayClient(userId);

			const transferData = encodeFunctionData({
				abi: [
					{
						inputs: [
							{ name: 'recipient', type: 'address' },
							{ name: 'amount', type: 'uint256' }
						],
						name: 'transfer',
						outputs: [{ name: '', type: 'bool' }],
						stateMutability: 'nonpayable',
						type: 'function'
					}
				],
				functionName: 'transfer',
				args: [to as `0x${string}`, BigInt(amount)]
			});

			const response = await relayClient.execute(
				[
					{
						to: tokenAddress,
						data: transferData,
						value: '0'
					}
				],
				'Transfer USDC'
			);

			const result = await response.wait();

			log.info('ERC20 transfer successful', {
				userId,
				from,
				to,
				amount,
				transactionHash: result?.transactionHash,
				transactionId: response.transactionID
			});

			return {
				success: true,
				transactionHash: result?.transactionHash || response.hash,
				transactionId: response.transactionID
			};
		} catch (error) {
			log.error('ERC20 transfer failed', {
				userId,
				from,
				to,
				amount,
				error: error instanceof Error ? error.message : 'Unknown error'
			});

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Transfer failed'
			};
		}
	}

	/**
	 * Check if an address is a deployed Safe or Proxy wallet
	 * Only deployed wallets can use the relayer
	 *
	 * @param userId - User ID to get relay client
	 * @param address - Wallet address to check
	 * @returns Promise resolving to true if wallet is deployed
	 */
	async isWalletDeployed(userId: string, address: string): Promise<boolean> {
		try {
			const relayClient = await createUserRelayClient(userId);
			const deployed = await relayClient.getDeployed(address);

			log.debug('Wallet deployment check', {
				userId,
				address,
				deployed
			});

			return deployed;
		} catch (error) {
			log.error('Failed to check wallet deployment', {
				userId,
				address,
				error: error instanceof Error ? error.message : 'Unknown error'
			});

			return false;
		}
	}

	/**
	 * Deploy a Safe wallet for a user
	 * Required before using relayer functionality
	 *
	 * @param userId - User ID to get signing wallet
	 * @returns Promise resolving to deployment result
	 */
	async deploySafeWallet(userId: string): Promise<RelayerResponse> {
		try {
			log.info('Deploying Safe wallet', { userId });

			const relayClient = await createUserRelayClient(userId);
			const response = await relayClient.deploy();
			const result = await response.wait();

			log.info('Safe wallet deployed successfully', {
				userId,
				transactionHash: result?.transactionHash,
				transactionId: response.transactionID
			});

			return {
				success: true,
				transactionHash: result?.transactionHash || response.hash,
				transactionId: response.transactionID
			};
		} catch (error) {
			log.error('Safe wallet deployment failed', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error'
			});

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Deployment failed'
			};
		}
	}
}

/**
 * Singleton instance for use across the application
 */
export const relayerService = new RelayerService();
