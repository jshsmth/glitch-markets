/**
 * Balance Utilities
 * Query USDC.e balance on Polygon using viem
 */

import { createPublicClient, http, formatUnits } from 'viem';
import { polygon } from 'viem/chains';
import { Logger } from './logger';

const logger = new Logger({ component: 'Balance' });

const USDC_E_CONTRACT = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

const publicClient = createPublicClient({
	chain: polygon,
	transport: http()
});

const ERC20_ABI = [
	{
		inputs: [{ name: 'account', type: 'address' }],
		name: 'balanceOf',
		outputs: [{ name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	}
] as const;

export interface BalanceResult {
	balance: string;
	balanceRaw: bigint;
	decimals: number;
}

/**
 * Get USDC.e balance for a proxy wallet address
 */
export async function getUSDCBalance(proxyWalletAddress: string): Promise<BalanceResult> {
	try {
		logger.info('Fetching USDC.e balance', { proxyWalletAddress });

		const balanceRaw = (await publicClient.readContract({
			address: USDC_E_CONTRACT as `0x${string}`,
			abi: ERC20_ABI,
			functionName: 'balanceOf',
			args: [proxyWalletAddress as `0x${string}`]
		})) as bigint;

		const decimals = 6;
		const balance = formatUnits(balanceRaw, decimals);

		logger.info('USDC.e balance fetched successfully', {
			proxyWalletAddress,
			balance,
			balanceRaw: balanceRaw.toString()
		});

		return {
			balance,
			balanceRaw,
			decimals
		};
	} catch (error) {
		logger.error('Failed to fetch USDC.e balance', {
			proxyWalletAddress,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		throw new Error('Failed to fetch USDC.e balance');
	}
}
