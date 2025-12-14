/**
 * Server Wallet Utilities
 * Creates and manages server-side wallets using viem
 * These wallets are used for automated Polymarket trading
 */

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { polygon } from 'viem/chains';
import { Logger } from '$lib/server/utils/logger';
import { encryptData, decryptData } from '$lib/server/utils/encryption';

const logger = new Logger({ component: 'ServerWallet' });

export interface ServerWalletData {
	accountAddress: string;
	walletId: string;
	publicKeyHex: string;
	encryptedKeyShares: string; // Encrypted private key
}

/**
 * Create a new server wallet using viem
 * Generates a random private key and encrypts it for storage
 */
export async function createServerWallet(userId: string): Promise<ServerWalletData> {
	try {
		logger.info('Creating server wallet with viem', { userId });

		const privateKey = generatePrivateKey();
		const account = privateKeyToAccount(privateKey);
		const walletId = crypto.randomUUID();
		const encryptedKeyShares = encryptData(privateKey);

		logger.info('Server wallet created successfully', {
			userId,
			accountAddress: account.address,
			walletId
		});

		return {
			accountAddress: account.address,
			walletId,
			publicKeyHex: account.publicKey,
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

/**
 * Get viem account from encrypted private key
 */
function getAccountFromEncryptedKey(encryptedKeyShares: string) {
	const privateKey = decryptData(encryptedKeyShares) as `0x${string}`;
	return privateKeyToAccount(privateKey);
}

/**
 * Sign a message with the server wallet
 */
export async function signMessageWithServerWallet(
	accountAddress: string,
	message: string,
	encryptedKeyShares?: string
): Promise<string> {
	try {
		logger.info('Signing message with server wallet', { accountAddress });

		if (!encryptedKeyShares) {
			throw new Error('Encrypted key shares required for signing');
		}

		const account = getAccountFromEncryptedKey(encryptedKeyShares);

		if (account.address.toLowerCase() !== accountAddress.toLowerCase()) {
			throw new Error('Account address mismatch');
		}

		const signature = await account.signMessage({ message });

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

/**
 * Sign typed data (EIP-712) with the server wallet
 */
export async function signTypedDataWithServerWallet(
	accountAddress: string,
	domain: {
		name: string;
		version: string;
		chainId: number;
	},
	types: Record<string, Array<{ name: string; type: string }>>,
	message: Record<string, unknown>,
	encryptedKeyShares?: string
): Promise<string> {
	try {
		// Log without BigInt values (which can't be serialized to JSON)
		logger.info('Signing typed data with server wallet', {
			accountAddress,
			domain
		});

		if (!encryptedKeyShares) {
			throw new Error('Encrypted key shares required for signing');
		}

		const account = getAccountFromEncryptedKey(encryptedKeyShares);

		if (account.address.toLowerCase() !== accountAddress.toLowerCase()) {
			throw new Error('Account address mismatch');
		}

		const signature = await account.signTypedData({
			domain,
			types,
			primaryType: 'ClobAuth',
			message
		});

		logger.info('Typed data signed successfully', { accountAddress, signature });
		return signature;
	} catch (error) {
		logger.error('Failed to sign typed data', {
			accountAddress,
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined
		});
		throw new Error('Failed to sign typed data with server wallet');
	}
}

/**
 * Get a viem wallet client for the server wallet
 */
export async function getServerWalletClient(
	accountAddress: string,
	chainId: number,
	rpcUrl: string,
	encryptedKeyShares?: string
) {
	try {
		if (!encryptedKeyShares) {
			throw new Error('Encrypted key shares required');
		}

		const account = getAccountFromEncryptedKey(encryptedKeyShares);

		if (account.address.toLowerCase() !== accountAddress.toLowerCase()) {
			throw new Error('Account address mismatch');
		}

		const walletClient = createWalletClient({
			account,
			chain: polygon,
			transport: http(rpcUrl)
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
