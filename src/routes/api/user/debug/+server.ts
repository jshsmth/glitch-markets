/**
 * API Endpoint: User Debug Information
 * GET /api/user/debug
 *
 * Returns comprehensive debug information about the user's account,
 * wallet status, approvals, and Polymarket integration
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/supabase/admin';
import type { Database } from '$lib/supabase/database.types';
import { getUSDCBalanceAndAllowance } from '$lib/server/utils/balance';
import { Logger } from '$lib/server/utils/logger';
import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';

type UserRow = Database['public']['Tables']['users']['Row'];
type PolymarketCredsRow = Database['public']['Tables']['polymarket_credentials']['Row'];

const logger = new Logger({ component: 'UserDebug' });

const USDC_E_CONTRACT = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
const CTF_CONTRACT = '0x4d97dcd97ec945f40cf65f87097ace5ea0476045';
const CTF_EXCHANGE = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';

const publicClient = createPublicClient({
	chain: polygon,
	transport: http()
});

const ERC1155_ABI = [
	{
		inputs: [
			{ name: 'account', type: 'address' },
			{ name: 'operator', type: 'address' }
		],
		name: 'isApprovedForAll',
		outputs: [{ name: '', type: 'bool' }],
		stateMutability: 'view',
		type: 'function'
	}
] as const;

const ERC20_ABI = [
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

async function checkCTFApproval(proxyWalletAddress: string): Promise<boolean> {
	try {
		const isApproved = (await publicClient.readContract({
			address: CTF_CONTRACT as `0x${string}`,
			abi: ERC1155_ABI,
			functionName: 'isApprovedForAll',
			args: [proxyWalletAddress as `0x${string}`, CTF_EXCHANGE as `0x${string}`]
		})) as boolean;

		return isApproved;
	} catch (error) {
		logger.error('Failed to check CTF approval', {
			proxyWalletAddress,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		return false;
	}
}

async function checkUSDCApproval(proxyWalletAddress: string): Promise<string> {
	try {
		const allowance = (await publicClient.readContract({
			address: USDC_E_CONTRACT as `0x${string}`,
			abi: ERC20_ABI,
			functionName: 'allowance',
			args: [proxyWalletAddress as `0x${string}`, CTF_EXCHANGE as `0x${string}`]
		})) as bigint;

		return allowance.toString();
	} catch (error) {
		logger.error('Failed to check USDC approval', {
			proxyWalletAddress,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		return '0';
	}
}

async function isProxyDeployed(proxyWalletAddress: string): Promise<boolean> {
	try {
		const code = await publicClient.getBytecode({
			address: proxyWalletAddress as `0x${string}`
		});
		return code !== undefined && code !== '0x' && code.length > 2;
	} catch (error) {
		logger.error('Failed to check proxy deployment', {
			proxyWalletAddress,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		return false;
	}
}

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const {
			data: { user: authUser },
			error: authError
		} = await locals.supabase.auth.getUser();

		if (authError || !authUser) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = authUser.id;

		const { data: user, error: userError } = await supabaseAdmin
			.from('users')
			.select('*')
			.eq('id', userId)
			.single<UserRow>();

		if (userError || !user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const { data: credentials, error: credsError } = await supabaseAdmin
			.from('polymarket_credentials')
			.select('*')
			.eq('user_id', userId)
			.maybeSingle<PolymarketCredsRow>();

		let balanceData = null;
		let ctfApproved = false;
		let usdcAllowance = '0';
		let proxyDeployed = false;

		if (credentials?.proxy_wallet_address) {
			try {
				[balanceData, ctfApproved, usdcAllowance, proxyDeployed] = await Promise.all([
					getUSDCBalanceAndAllowance(credentials.proxy_wallet_address),
					checkCTFApproval(credentials.proxy_wallet_address),
					checkUSDCApproval(credentials.proxy_wallet_address),
					isProxyDeployed(credentials.proxy_wallet_address)
				]);
			} catch (error) {
				logger.error('Failed to fetch blockchain data', {
					userId,
					error: error instanceof Error ? error.message : 'Unknown error'
				});
			}
		}

		const debugInfo = {
			user: {
				id: user.id,
				email: user.email,
				createdAt: user.created_at,
				lastLoginAt: user.last_login_at
			},
			serverWallet: {
				address: user.server_wallet_address,
				walletId: user.server_wallet_id,
				publicKey: user.server_wallet_public_key
			},
			polymarket: credentials
				? {
						proxyWalletAddress: credentials.proxy_wallet_address,
						walletAddress: credentials.wallet_address,
						isDeployed: proxyDeployed,
						deployedAt: credentials.deployed_at,
						deploymentTxHash: credentials.deployment_tx_hash,
						createdAt: credentials.created_at,
						hasApiCredentials: !!(
							credentials.encrypted_api_key &&
							credentials.encrypted_secret &&
							credentials.encrypted_passphrase
						)
					}
				: null,
			balance: balanceData
				? {
						balance: balanceData.balance,
						balanceRaw: balanceData.balanceRaw.toString(),
						allowance: balanceData.allowance,
						allowanceRaw: balanceData.allowanceRaw.toString(),
						decimals: balanceData.decimals,
						hasAllowance: balanceData.hasAllowance,
						needsApproval: balanceData.needsApproval
					}
				: null,
			approvals: {
				ctf: {
					isApproved: ctfApproved,
					operator: CTF_EXCHANGE,
					contract: CTF_CONTRACT
				},
				usdc: {
					allowance: usdcAllowance,
					spender: CTF_EXCHANGE,
					contract: USDC_E_CONTRACT,
					hasUnlimitedApproval:
						BigInt(usdcAllowance) >=
						BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') / 2n
				}
			},
			contracts: {
				usdcE: USDC_E_CONTRACT,
				ctf: CTF_CONTRACT,
				exchange: CTF_EXCHANGE
			}
		};

		logger.info('Debug info fetched successfully', { userId });

		return json(debugInfo);
	} catch (error) {
		logger.error('Failed to fetch debug info', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined
		});

		return json(
			{
				error: 'Failed to fetch debug information',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
