/**
 * User Registration Endpoint
 * Creates or updates user in Supabase after Dynamic authentication
 * Also creates a server-side wallet for automated Polymarket trading
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServerWallet } from '$lib/server/wallet/server-wallet';
import { Logger } from '$lib/server/utils/logger';
import { supabaseAdmin } from '$lib/supabase/admin';
import { registerWithPolymarket } from '$lib/server/polymarket/clob-registration';
import { encryptData } from '$lib/server/utils/encryption';

const logger = new Logger({ component: 'UserRegistration' });

/**
 * Register user with Polymarket CLOB asynchronously (non-blocking)
 */
async function registerWithPolymarketAsync(userId: string): Promise<void> {
	try {
		logger.info('Starting background Polymarket registration', { userId });

		const credentials = await registerWithPolymarket(userId);

		// Encrypt and save credentials
		const encryptedApiKey = encryptData(credentials.apiKey);
		const encryptedSecret = encryptData(credentials.secret);
		const encryptedPassphrase = encryptData(credentials.passphrase);

		// Get user's server wallet address
		const { data: user } = await supabaseAdmin
			.from('users')
			.select('server_wallet_address')
			.eq('id', userId)
			.single();

		if (!user?.server_wallet_address) {
			logger.error('Server wallet not found for Polymarket registration', { userId });
			return;
		}

		const { error } = await supabaseAdmin.from('polymarket_credentials').insert({
			user_id: userId,
			wallet_address: user.server_wallet_address,
			proxy_wallet_address: credentials.proxyWalletAddress,
			encrypted_api_key: encryptedApiKey,
			encrypted_secret: encryptedSecret,
			encrypted_passphrase: encryptedPassphrase,
			created_at: new Date().toISOString()
		});

		if (error) {
			logger.error('Failed to save Polymarket credentials', { userId, error });
			return;
		}

		logger.info('Background Polymarket registration completed', {
			userId,
			proxyWallet: credentials.proxyWalletAddress
		});
	} catch (error) {
		logger.error('Background Polymarket registration failed', {
			userId,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		// Don't throw - this is a background operation
	}
}

export const POST: RequestHandler = async ({ locals }) => {
	const {
		data: { user },
		error: authError
	} = await locals.supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = user.id;
	const email = user.email || '';

	try {
		const { data: existingUser } = await supabaseAdmin
			.from('users')
			.select('id, server_wallet_address')
			.eq('id', userId)
			.single();

		if (existingUser) {
			if (!existingUser.server_wallet_address) {
				logger.info('Creating server wallet for existing user', { userId });
				let serverWallet;
				try {
					serverWallet = await createServerWallet(userId);
					logger.info('Server wallet created successfully for existing user', {
						userId,
						address: serverWallet.accountAddress
					});
				} catch (walletError) {
					logger.error('Server wallet creation failed for existing user', {
						userId,
						error: walletError instanceof Error ? walletError.message : 'Unknown error',
						stack: walletError instanceof Error ? walletError.stack : undefined
					});
					throw walletError;
				}

				const { error: updateError } = await supabaseAdmin
					.from('users')
					.update({
						server_wallet_address: serverWallet.accountAddress,
						server_wallet_id: serverWallet.walletId,
						encrypted_server_key_shares: serverWallet.encryptedKeyShares,
						server_wallet_public_key: serverWallet.publicKeyHex,
						last_login_at: new Date().toISOString()
					})
					.eq('id', userId);

				if (updateError) {
					logger.error('Failed to update user with wallet info', {
						userId,
						error: updateError
					});
					throw updateError;
				}

				return json({
					success: true,
					user: {
						userId,
						email,
						serverWalletAddress: serverWallet.accountAddress,
						hasServerWallet: true
					},
					message: 'Server wallet created for existing user'
				});
			}

			// Update last login for user with wallet (use admin client to bypass RLS)
			await supabaseAdmin
				.from('users')
				.update({ last_login_at: new Date().toISOString() })
				.eq('id', userId);

			return json({
				success: true,
				user: {
					userId,
					email,
					serverWalletAddress: existingUser.server_wallet_address,
					hasServerWallet: true
				},
				message: 'User login updated'
			});
		}

		// Create server wallet for new user
		logger.info('Creating server wallet for new user', { userId, email });
		let serverWallet;
		try {
			serverWallet = await createServerWallet(userId);
			logger.info('Server wallet created successfully', {
				userId,
				address: serverWallet.accountAddress
			});
		} catch (walletError) {
			logger.error('Server wallet creation failed', {
				userId,
				email,
				error: walletError instanceof Error ? walletError.message : 'Unknown error',
				stack: walletError instanceof Error ? walletError.stack : undefined,
				errorName: walletError instanceof Error ? walletError.name : undefined
			});
			console.error('Detailed wallet creation error:', walletError);
			throw walletError;
		}

		// Insert new user into Supabase (use admin client to bypass RLS)
		const { error: insertError } = await supabaseAdmin.from('users').insert({
			id: userId,
			email,
			server_wallet_address: serverWallet.accountAddress,
			server_wallet_id: serverWallet.walletId,
			encrypted_server_key_shares: serverWallet.encryptedKeyShares,
			server_wallet_public_key: serverWallet.publicKeyHex,
			created_at: new Date().toISOString(),
			last_login_at: new Date().toISOString()
		});

		if (insertError) {
			logger.error('Failed to insert user into database', {
				userId,
				error: insertError
			});
			throw insertError;
		}

		logger.info('User created with server wallet', {
			userId,
			serverWalletAddress: serverWallet.accountAddress
		});

		// Register with Polymarket CLOB in the background (don't block user creation)
		// This creates the proxy wallet and API credentials for trading
		registerWithPolymarketAsync(userId).catch((err) => {
			logger.error('Failed to register with Polymarket in background', {
				userId,
				error: err instanceof Error ? err.message : 'Unknown error'
			});
		});

		return json({
			success: true,
			user: {
				userId,
				email,
				serverWalletAddress: serverWallet.accountAddress,
				hasServerWallet: true
			},
			message: 'User created successfully with server wallet'
		});
	} catch (error) {
		const errorId = crypto.randomUUID();
		logger.error('User registration error', {
			userId,
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			timestamp: new Date().toISOString(),
			errorCode: 'USER_REGISTRATION_FAILED',
			errorId
		});

		return json(
			{
				error: 'Failed to register user',
				message: error instanceof Error ? error.message : 'Unknown error',
				errorId
			},
			{ status: 500 }
		);
	}
};
