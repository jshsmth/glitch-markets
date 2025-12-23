/**
 * Balance Utilities
 * Query USDC.e balance on Polygon using viem
 */

import { createPublicClient, http, formatUnits } from 'viem';
import { polygon } from 'viem/chains';
import { env } from '$env/dynamic/private';
import { CacheManager } from '$lib/server/cache/cache-manager';
import { Logger } from './logger';

const logger = new Logger({ component: 'Balance' });

const USDC_E_CONTRACT = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
const CTF_EXCHANGE = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';
const BALANCE_CACHE_TTL = 15000; // 15 seconds
const ALLOWANCE_CACHE_TTL = 15000; // 15 seconds

const balanceCache = new CacheManager(1000);

const publicClient = createPublicClient({
	chain: polygon,
	transport: http(env.POLYGON_RPC_URL || 'https://polygon-rpc.com')
});

const ERC20_ABI = [
	{
		inputs: [{ name: 'account', type: 'address' }],
		name: 'balanceOf',
		outputs: [{ name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ name: 'owner', type: 'address' },
			{ name: 'spender', type: 'address' }
		],
		name: 'allowance',
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

export interface BalanceAllowanceResult {
	balance: string;
	balanceRaw: bigint;
	allowance: string;
	allowanceRaw: bigint;
	decimals: number;
	hasAllowance: boolean;
	needsApproval: boolean;
}

/**
 * Get USDC.e balance for a proxy wallet address
 */
export async function getUSDCBalance(proxyWalletAddress: string): Promise<BalanceResult> {
	const cacheKey = `balance:${proxyWalletAddress}`;

	const cached = balanceCache.get<BalanceResult>(cacheKey);
	if (cached) {
		logger.info('Returning cached USDC.e balance', { proxyWalletAddress });
		return cached;
	}

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

		const result: BalanceResult = {
			balance,
			balanceRaw,
			decimals
		};

		balanceCache.set(cacheKey, result, BALANCE_CACHE_TTL);

		logger.info('USDC.e balance fetched successfully', {
			proxyWalletAddress,
			balance,
			balanceRaw: balanceRaw.toString()
		});

		return result;
	} catch (error) {
		logger.error('Failed to fetch USDC.e balance', {
			proxyWalletAddress,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		throw new Error('Failed to fetch USDC.e balance');
	}
}

/**
 * Get USDC.e balance AND allowance for trading
 * Checks both balance and whether the CTF Exchange has approval to spend USDC
 */
export async function getUSDCBalanceAndAllowance(
	proxyWalletAddress: string
): Promise<BalanceAllowanceResult> {
	const cacheKey = `balance-allowance:${proxyWalletAddress}`;

	const cached = balanceCache.get<BalanceAllowanceResult>(cacheKey);
	if (cached) {
		logger.info('Returning cached USDC.e balance and allowance', { proxyWalletAddress });
		return cached;
	}

	try {
		logger.info('Fetching USDC.e balance and allowance', { proxyWalletAddress });

		const [balanceRaw, allowanceRaw] = await Promise.all([
			publicClient.readContract({
				address: USDC_E_CONTRACT as `0x${string}`,
				abi: ERC20_ABI,
				functionName: 'balanceOf',
				args: [proxyWalletAddress as `0x${string}`]
			}) as Promise<bigint>,
			publicClient.readContract({
				address: USDC_E_CONTRACT as `0x${string}`,
				abi: ERC20_ABI,
				functionName: 'allowance',
				args: [proxyWalletAddress as `0x${string}`, CTF_EXCHANGE as `0x${string}`]
			}) as Promise<bigint>
		]);

		const decimals = 6;
		const balance = formatUnits(balanceRaw, decimals);
		const allowance = formatUnits(allowanceRaw, decimals);

		const hasAllowance = allowanceRaw >= balanceRaw;
		const needsApproval = !hasAllowance && balanceRaw > 0n;

		const result: BalanceAllowanceResult = {
			balance,
			balanceRaw,
			allowance,
			allowanceRaw,
			decimals,
			hasAllowance,
			needsApproval
		};

		balanceCache.set(cacheKey, result, ALLOWANCE_CACHE_TTL);

		logger.info('USDC.e balance and allowance fetched successfully', {
			proxyWalletAddress,
			balance,
			allowance,
			hasAllowance,
			needsApproval
		});

		return result;
	} catch (error) {
		logger.error('Failed to fetch USDC.e balance and allowance', {
			proxyWalletAddress,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		throw new Error('Failed to fetch USDC.e balance and allowance');
	}
}
