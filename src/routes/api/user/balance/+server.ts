/**
 * User Balance Endpoint
 * GET /api/user/balance
 * Returns user's USDC.e balance from Polygon blockchain
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { getUSDCBalance } from '$lib/server/utils/balance';
import { Logger } from '$lib/server/utils/logger';

const logger = new Logger({ component: 'BalanceRoute' });

export async function GET({ locals }: RequestEvent) {
	try {
		const {
			data: { user: authUser },
			error: authError
		} = await locals.supabase.auth.getUser();

		if (authError || !authUser) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = authUser.id;

		const { data: credentials, error: credentialsError } = await locals.supabase
			.from('polymarket_credentials')
			.select('proxy_wallet_address')
			.eq('user_id', userId)
			.single();

		if (credentialsError || !credentials?.proxy_wallet_address) {
			return json({
				balance: '0',
				balanceRaw: '0',
				decimals: 6,
				hasProxyWallet: false
			});
		}

		const balanceResult = await getUSDCBalance(credentials.proxy_wallet_address);

		return json({
			balance: balanceResult.balance,
			balanceRaw: balanceResult.balanceRaw.toString(),
			decimals: balanceResult.decimals,
			hasProxyWallet: true
		});
	} catch (err) {
		logger.error('Error fetching user balance', {
			error: err instanceof Error ? err.message : 'Unknown error',
			stack: err instanceof Error ? err.stack : undefined
		});
		return json({ error: 'Failed to fetch balance' }, { status: 500 });
	}
}
