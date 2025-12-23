/**
 * Polymarket Proxy Wallet Deployment
 * Deploys proxy wallets on-chain using Polymarket's relayer for gasless transactions
 */

import { RelayClient, RelayerTxType } from '@polymarket/builder-relayer-client';
import { BuilderConfig } from '@polymarket/builder-signing-sdk';
import { Wallet } from '@ethersproject/wallet';
import { JsonRpcProvider } from '@ethersproject/providers';
import { createPublicClient, http, encodeFunctionData } from 'viem';
import { polygon } from 'viem/chains';
import { Logger } from '../utils/logger';
import { decryptData } from '../utils/encryption';
import { BUILDER_API_KEY, BUILDER_SECRET, BUILDER_PASSPHRASE } from '$env/static/private';

const logger = new Logger({ component: 'ProxyDeployment' });

const RELAYER_URL = 'https://relayer-v2.polymarket.com';
const CHAIN_ID = 137;
const POLYGON_RPC_URL = 'https://polygon-rpc.com';

const CTF_CONTRACT = '0x4d97dcd97ec945f40cf65f87097ace5ea0476045';
const CTF_EXCHANGE = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';

const publicClient = createPublicClient({
	chain: polygon,
	transport: http()
});

const ethersProvider = new JsonRpcProvider(POLYGON_RPC_URL, CHAIN_ID);

/**
 * Check if a contract is deployed at the given address
 */
async function isContractDeployed(address: string): Promise<boolean> {
	try {
		const code = await publicClient.getBytecode({ address: address as `0x${string}` });
		const deployed = code !== undefined && code !== '0x' && code.length > 2;

		logger.info('Checked contract deployment status', {
			address,
			deployed,
			codeLength: code?.length || 0
		});

		return deployed;
	} catch (error) {
		logger.error('Failed to check contract deployment', {
			address,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		return false;
	}
}

/**
 * Create an ethers Wallet from encrypted key shares with provider
 */
function createEthersWallet(encryptedKeyShares: string): Wallet {
	const privateKey = decryptData(encryptedKeyShares) as string;
	return new Wallet(privateKey, ethersProvider);
}

/**
 * Create builder configuration for relayer authentication
 */
function createBuilderConfig(): BuilderConfig {
	return new BuilderConfig({
		localBuilderCreds: {
			key: BUILDER_API_KEY,
			secret: BUILDER_SECRET,
			passphrase: BUILDER_PASSPHRASE
		}
	});
}

/**
 * Encode CTF setApprovalForAll transaction approving the Exchange contract
 */
function encodeCTFApproval(): string {
	return encodeFunctionData({
		abi: [
			{
				inputs: [
					{ name: 'operator', type: 'address' },
					{ name: 'approved', type: 'bool' }
				],
				name: 'setApprovalForAll',
				outputs: [],
				stateMutability: 'nonpayable',
				type: 'function'
			}
		],
		functionName: 'setApprovalForAll',
		args: [CTF_EXCHANGE, true]
	});
}

export interface DeploymentResult {
	deployed: boolean;
	alreadyDeployed: boolean;
	transactionHash?: string;
	proxyAddress: string;
}

/**
 * Deploy proxy wallet and approve CTF contract via gasless relayer transaction
 *
 * @param encryptedKeyShares - Encrypted private key for the server wallet
 * @param proxyWalletAddress - Deterministic proxy wallet address from CREATE2
 * @returns Deployment result with transaction details
 */
export async function deployProxyWallet(
	encryptedKeyShares: string,
	proxyWalletAddress: string
): Promise<DeploymentResult> {
	try {
		logger.info('Starting proxy wallet deployment', { proxyWalletAddress });

		const alreadyDeployed = await isContractDeployed(proxyWalletAddress);

		if (alreadyDeployed) {
			logger.info('Proxy wallet already deployed', { proxyWalletAddress });
			return {
				deployed: true,
				alreadyDeployed: true,
				proxyAddress: proxyWalletAddress
			};
		}

		const wallet = createEthersWallet(encryptedKeyShares);

		logger.info('Created ethers wallet', {
			address: wallet.address,
			proxyWalletAddress
		});

		const builderConfig = createBuilderConfig();

		const relayClient = new RelayClient(
			RELAYER_URL,
			CHAIN_ID,
			wallet,
			builderConfig,
			RelayerTxType.PROXY
		);

		logger.info('Created relay client', {
			type: 'PROXY',
			relayerUrl: RELAYER_URL,
			chainId: CHAIN_ID
		});

		const approvalData = encodeCTFApproval();

		const transaction = {
			to: CTF_CONTRACT,
			data: approvalData,
			value: '0'
		};

		logger.info('Executing CTF approval transaction to trigger deployment', {
			to: CTF_CONTRACT,
			operator: CTF_EXCHANGE,
			proxyWalletAddress
		});

		const response = await relayClient.execute([transaction], 'Deploy wallet and approve CTF');

		logger.info('Transaction submitted to relayer', {
			proxyWalletAddress
		});

		const result = await response.wait();

		if (!result) {
			throw new Error('Transaction failed - no result returned');
		}

		logger.info('Proxy wallet deployed and CTF approved', {
			proxyAddress: result.proxyAddress,
			transactionHash: result.transactionHash,
			alreadyDeployed: false
		});

		return {
			deployed: true,
			alreadyDeployed: false,
			transactionHash: result.transactionHash,
			proxyAddress: result.proxyAddress
		};
	} catch (error) {
		logger.error('Failed to deploy proxy wallet', {
			proxyWalletAddress,
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined
		});

		throw new Error(
			`Failed to deploy proxy wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}
