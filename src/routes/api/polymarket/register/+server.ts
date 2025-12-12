/**
 * API Endpoint: Register with Polymarket CLOB
 * POST /api/polymarket/register
 *
 * Registers the authenticated user with Polymarket's CLOB and creates API credentials
 * This enables the user to trade on Polymarket
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { registerWithPolymarket } from '$lib/server/polymarket/clob-registration';
import { supabaseAdmin } from '$lib/supabase/admin';
import { encryptData } from '$lib/server/utils/encryption';
import { Logger } from '$lib/server/utils/logger';

const logger = new Logger({ component: 'PolymarketRegistration' });

export const POST: RequestHandler = async ({ locals }) => {
	try {
		// Get the authenticated user from Supabase Auth (secure server-side verification)
		const {
			data: { user: authUser },
			error: authError
		} = await locals.supabase.auth.getUser();

		if (authError || !authUser) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = authUser.id;

		logger.info('Polymarket registration requested', { userId });

		// Check if user already has Polymarket credentials
		const { data: existingCreds } = await supabaseAdmin
			.from('polymarket_credentials')
			.select('proxy_wallet_address')
			.eq('user_id', userId)
			.single();

		if (existingCreds) {
			logger.info('User already registered with Polymarket', {
				userId,
				proxyWallet: existingCreds.proxy_wallet_address
			});

			return json({
				success: true,
				proxyWalletAddress: existingCreds.proxy_wallet_address,
				message: 'Already registered with Polymarket'
			});
		}

		// Register with Polymarket CLOB
		const credentials = await registerWithPolymarket(userId);

		// Encrypt the API credentials before storing
		const encryptedApiKey = encryptData(credentials.apiKey);
		const encryptedSecret = encryptData(credentials.secret);
		const encryptedPassphrase = encryptData(credentials.passphrase);

		// Get user's server wallet address from database
		const { data: dbUser } = await supabaseAdmin
			.from('users')
			.select('server_wallet_address')
			.eq('id', userId)
			.single();

		if (!dbUser?.server_wallet_address) {
			throw new Error('Server wallet not found');
		}

		// Save credentials to database
		const { error: insertError } = await supabaseAdmin.from('polymarket_credentials').insert({
			user_id: userId,
			wallet_address: dbUser.server_wallet_address,
			proxy_wallet_address: credentials.proxyWalletAddress,
			encrypted_api_key: encryptedApiKey,
			encrypted_secret: encryptedSecret,
			encrypted_passphrase: encryptedPassphrase,
			created_at: new Date().toISOString()
		});

		if (insertError) {
			logger.error('Failed to save Polymarket credentials', {
				userId,
				error: insertError
			});
			throw new Error('Failed to save Polymarket credentials');
		}

		logger.info('Successfully registered with Polymarket', {
			userId,
			proxyWallet: credentials.proxyWalletAddress
		});

		return json({
			success: true,
			proxyWalletAddress: credentials.proxyWalletAddress,
			message: 'Successfully registered with Polymarket'
		});
	} catch (error) {
		const errorId = crypto.randomUUID();
		logger.error('Polymarket registration error', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			timestamp: new Date().toISOString(),
			errorCode: 'POLYMARKET_REGISTRATION_FAILED',
			errorId
		});

		return json(
			{
				error: 'Failed to register with Polymarket',
				message: error instanceof Error ? error.message : 'Unknown error',
				errorId
			},
			{ status: 500 }
		);
	}
};
