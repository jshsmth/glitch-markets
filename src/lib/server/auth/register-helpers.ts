import { Logger } from '$lib/server/utils/logger';
import { supabaseAdmin } from '$lib/supabase/admin';
import { registerWithPolymarket } from '$lib/server/polymarket/clob-registration';
import { encryptData } from '$lib/server/utils/encryption';

const logger = new Logger({ component: 'RegisterHelpers' });

/**
 * Register user with Polymarket CLOB asynchronously (non-blocking)
 * Safe to call multiple times - checks if already deployed
 */
export async function registerWithPolymarketAsync(userId: string): Promise<void> {
	try {
		logger.info('Starting background Polymarket registration', { userId });

		const { data: existingCreds } = await supabaseAdmin
			.from('polymarket_credentials')
			.select('proxy_wallet_address, deployed_at, deployment_tx_hash')
			.eq('user_id', userId)
			.single();

		if (existingCreds?.deployed_at) {
			logger.info('User already registered and deployed with Polymarket', {
				userId,
				proxyWallet: existingCreds.proxy_wallet_address
			});
			return;
		}

		const credentials = await registerWithPolymarket(userId);

		const encryptedApiKey = encryptData(credentials.apiKey);
		const encryptedSecret = encryptData(credentials.secret);
		const encryptedPassphrase = encryptData(credentials.passphrase);

		const { data: user } = await supabaseAdmin
			.from('users')
			.select('server_wallet_address')
			.eq('id', userId)
			.single();

		if (!user?.server_wallet_address) {
			logger.error('Server wallet not found for Polymarket registration', { userId });
			return;
		}

		const { error } = await supabaseAdmin.from('polymarket_credentials').upsert(
			{
				user_id: userId,
				wallet_address: user.server_wallet_address,
				proxy_wallet_address: credentials.proxyWalletAddress,
				encrypted_api_key: encryptedApiKey,
				encrypted_secret: encryptedSecret,
				encrypted_passphrase: encryptedPassphrase,
				deployed_at: credentials.deployed ? new Date().toISOString() : null,
				deployment_tx_hash: credentials.transactionHash || null,
				created_at: new Date().toISOString()
			},
			{ onConflict: 'user_id' }
		);

		if (error) {
			logger.error('Failed to save Polymarket credentials', { userId, error });
			return;
		}

		logger.info('Background Polymarket registration completed', {
			userId,
			proxyWallet: credentials.proxyWalletAddress,
			deployed: credentials.deployed,
			transactionHash: credentials.transactionHash
		});
	} catch (error) {
		logger.error('Background Polymarket registration failed', {
			userId,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
}
