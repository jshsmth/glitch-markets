/**
 * Server Wallet Utilities
 * Creates and manages backend-controlled MPC wallets using Dynamic's Node SDK
 */

import { DynamicEvmWalletClient } from '@dynamic-labs-wallet/node-evm';
import { ThresholdSignatureScheme } from '@dynamic-labs-wallet/node';
import { DYNAMIC_ENVIRONMENT_ID, DYNAMIC_API_TOKEN } from '$env/static/private';
import { Logger } from '$lib/server/utils/logger';
import { encryptData, decryptData } from '$lib/server/utils/encryption';

const logger = new Logger({ component: 'ServerWallet' });

let evmClientInstance: DynamicEvmWalletClient | null = null;

async function getAuthenticatedEvmClient(): Promise<DynamicEvmWalletClient> {
	if (evmClientInstance) {
		return evmClientInstance;
	}

	const client = new DynamicEvmWalletClient({
		environmentId: DYNAMIC_ENVIRONMENT_ID,
		enableMPCAccelerator: false
	});

	await client.authenticateApiToken(DYNAMIC_API_TOKEN);
	evmClientInstance = client;

	logger.info('Authenticated Dynamic EVM client');
	return client;
}

export interface ServerWalletData {
	accountAddress: string;
	walletId: string;
	publicKeyHex: string;
	encryptedKeyShares: string; // Encrypted JSON string of external key shares
}

export async function createServerWallet(userId: string): Promise<ServerWalletData> {
	try {
		logger.info('Creating server wallet', { userId });

		const evmClient = await getAuthenticatedEvmClient();

		const { accountAddress, walletId, publicKeyHex, externalServerKeyShares } =
			await evmClient.createWalletAccount({
				thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
				backUpToClientShareService: true,
				onError: (error: Error) => {
					logger.error('Server wallet creation error', { error: error.message, userId });
				}
			});

		logger.info('Server wallet created', {
			userId,
			accountAddress,
			walletId
		});

		const encryptedKeyShares = encryptData(JSON.stringify(externalServerKeyShares));

		return {
			accountAddress,
			walletId,
			publicKeyHex,
			encryptedKeyShares
		};
	} catch (error) {
		logger.error('Failed to create server wallet', {
			userId,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		throw new Error('Failed to create server wallet');
	}
}

export async function signMessageWithServerWallet(
	accountAddress: string,
	message: string,
	encryptedKeyShares?: string
): Promise<string> {
	try {
		logger.info('Signing message with server wallet', { accountAddress });

		const evmClient = await getAuthenticatedEvmClient();

		let externalServerKeyShares;
		if (encryptedKeyShares) {
			const decrypted = decryptData(encryptedKeyShares);
			externalServerKeyShares = JSON.parse(decrypted);
		}

		const signature = await evmClient.signMessage({
			message,
			accountAddress,
			externalServerKeyShares
		});

		logger.info('Message signed successfully', { accountAddress });
		return signature;
	} catch (error) {
		logger.error('Failed to sign message', {
			accountAddress,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		throw new Error('Failed to sign message with server wallet');
	}
}

export async function getServerWalletClient(
	accountAddress: string,
	chainId: number,
	rpcUrl: string,
	encryptedKeyShares?: string
) {
	try {
		const evmClient = await getAuthenticatedEvmClient();

		let externalServerKeyShares;
		if (encryptedKeyShares) {
			const decrypted = decryptData(encryptedKeyShares);
			externalServerKeyShares = JSON.parse(decrypted);
		}

		const walletClient = await evmClient.getWalletClient({
			accountAddress,
			chainId,
			rpcUrl,
			externalServerKeyShares
		});

		logger.info('Viem wallet client created', { accountAddress, chainId });
		return walletClient;
	} catch (error) {
		logger.error('Failed to create wallet client', {
			accountAddress,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		throw new Error('Failed to create wallet client');
	}
}
