/**
 * Polymarket Proxy Wallet Deployment
 * Deploys proxy wallets on-chain using Polymarket's relayer for gasless transactions
 */

import { RelayClient, RelayerTxType } from '@polymarket/builder-relayer-client';
import { BuilderConfig } from '@polymarket/builder-signing-sdk';
import { Wallet } from '@ethersproject/wallet';
import { JsonRpcProvider } from '@ethersproject/providers';
import { encodeFunctionData } from 'viem';
import { Logger } from '../utils/logger';
import { decryptData } from '../utils/encryption';
import { env } from '$env/dynamic/private';

const logger = new Logger({ component: 'ProxyDeployment' });

const RELAYER_URL = 'https://relayer-v2.polymarket.com';
const CHAIN_ID = 137;
const POLYGON_RPC_URL = 'https://polygon-rpc.com';

const USDC_E_CONTRACT = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
const CTF_CONTRACT = '0x4d97dcd97ec945f40cf65f87097ace5ea0476045';
const CTF_EXCHANGE = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';

const ethersProvider = new JsonRpcProvider(POLYGON_RPC_URL, CHAIN_ID);

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
	const apiKey = env.BUILDER_API_KEY;
	const secret = env.BUILDER_SECRET;
	const passphrase = env.BUILDER_PASSPHRASE;

	if (!apiKey || !secret || !passphrase) {
		throw new Error('Builder credentials not configured in environment');
	}

	return new BuilderConfig({
		localBuilderCreds: {
			key: apiKey,
			secret: secret,
			passphrase: passphrase
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

/**
 * Encode USDC.e approve transaction for unlimited spending by the Exchange contract
 */
function encodeUSDCApproval(): string {
	const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

	return encodeFunctionData({
		abi: [
			{
				inputs: [
					{ name: 'spender', type: 'address' },
					{ name: 'amount', type: 'uint256' }
				],
				name: 'approve',
				outputs: [{ name: '', type: 'bool' }],
				stateMutability: 'nonpayable',
				type: 'function'
			}
		],
		functionName: 'approve',
		args: [CTF_EXCHANGE, maxUint256]
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
 * @returns Deployment result with transaction details (including actual proxy address from relayer)
 */
export async function deployProxyWallet(encryptedKeyShares: string): Promise<DeploymentResult> {
	try {
		logger.info('Starting proxy wallet deployment');

		const wallet = createEthersWallet(encryptedKeyShares);

		logger.info('Created ethers wallet', {
			address: wallet.address
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

		const ctfApprovalData = encodeCTFApproval();
		const usdcApprovalData = encodeUSDCApproval();

		const transactions = [
			{
				to: CTF_CONTRACT,
				data: ctfApprovalData,
				value: '0'
			},
			{
				to: USDC_E_CONTRACT,
				data: usdcApprovalData,
				value: '0'
			}
		];

		logger.info('Executing approval transactions to trigger deployment', {
			ctfContract: CTF_CONTRACT,
			usdcEContract: USDC_E_CONTRACT,
			operator: CTF_EXCHANGE
		});

		const response = await relayClient.execute(
			transactions,
			'Deploy wallet and approve CTF + USDC.e'
		);

		logger.info('Transaction submitted to relayer');

		const result = await response.wait();

		if (!result) {
			throw new Error('Transaction failed - no result returned');
		}

		logger.info('Proxy wallet deployed with CTF and USDC.e approvals', {
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
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined
		});

		throw new Error(
			`Failed to deploy proxy wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}
