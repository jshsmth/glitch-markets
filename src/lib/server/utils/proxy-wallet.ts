/**
 * Polymarket Proxy Wallet Utilities
 * Derives proxy wallet addresses using CREATE2 for Polymarket trading
 */

import { encodePacked, keccak256, getContractAddress } from 'viem';
import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';
import { Logger } from '$lib/utils/logger';

const logger = new Logger({ component: 'ProxyWallet' });

const PROXY_WALLET_FACTORY = '0xaB45c5A4B0c941a2F231C04C3f49182e1A254052';

const publicClient = createPublicClient({
	chain: polygon,
	transport: http()
});

let cachedImplementation: `0x${string}` | null = null;

async function getImplementationAddress(): Promise<`0x${string}`> {
	if (cachedImplementation) {
		return cachedImplementation;
	}

	try {
		const implementation = (await publicClient.readContract({
			address: PROXY_WALLET_FACTORY as `0x${string}`,
			abi: [
				{
					inputs: [],
					name: 'getImplementation',
					outputs: [{ name: '', type: 'address' }],
					stateMutability: 'view',
					type: 'function'
				}
			],
			functionName: 'getImplementation'
		})) as `0x${string}`;

		cachedImplementation = implementation;
		logger.info('Fetched implementation address', { implementation });
		return implementation;
	} catch (error) {
		logger.error('Failed to fetch implementation address', { error });
		throw new Error('Failed to fetch proxy wallet implementation address');
	}
}

export async function deriveProxyWalletAddress(walletAddress: string): Promise<string> {
	try {
		logger.info('Deriving proxy wallet address', { walletAddress });

		const implementation = await getImplementationAddress();

		const salt = keccak256(encodePacked(['address'], [walletAddress as `0x${string}`]));

		const initCodeHash = keccak256(
			encodePacked(
				['bytes', 'bytes'],
				[
					'0x3d602d80600a3d3981f3363d3d373d3d3d363d73' as `0x${string}`,
					encodePacked(
						['address', 'bytes'],
						[implementation, '0x5af43d82803e903d91602b57fd5bf3' as `0x${string}`]
					)
				]
			)
		);

		const proxyAddress = getContractAddress({
			from: PROXY_WALLET_FACTORY as `0x${string}`,
			salt,
			bytecodeHash: initCodeHash,
			opcode: 'CREATE2'
		});

		logger.info('Derived proxy wallet address', {
			walletAddress,
			proxyAddress,
			salt,
			implementation
		});

		return proxyAddress;
	} catch (error) {
		logger.error('Failed to derive proxy wallet address', {
			walletAddress,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		throw new Error('Failed to derive proxy wallet address');
	}
}
