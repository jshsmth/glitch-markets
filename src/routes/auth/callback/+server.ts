/**
 * Auth callback route for Supabase Auth
 * Handles OAuth code exchange and redirects
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServerWallet } from '$lib/server/wallet/server-wallet';
import { Logger } from '$lib/server/utils/logger';
import { supabaseAdmin } from '$lib/supabase/admin';
import { registerWithPolymarketAsync } from '$lib/server/auth/register-helpers';

const logger = new Logger({ component: 'AuthCallback' });

async function ensureUserRegistered(userId: string, email: string): Promise<void> {
	try {
		const { data: existingUser } = await supabaseAdmin
			.from('users')
			.select('id, server_wallet_address')
			.eq('id', userId)
			.single();

		if (existingUser) {
			if (!existingUser.server_wallet_address) {
				logger.info('Creating server wallet for OAuth user', { userId });
				const serverWallet = await createServerWallet(userId);

				await supabaseAdmin
					.from('users')
					.update({
						server_wallet_address: serverWallet.accountAddress,
						server_wallet_id: serverWallet.walletId,
						encrypted_server_key_shares: serverWallet.encryptedKeyShares,
						server_wallet_public_key: serverWallet.publicKeyHex,
						last_login_at: new Date().toISOString()
					})
					.eq('id', userId);

				registerWithPolymarketAsync(userId).catch((err) => {
					logger.error('Failed to register with Polymarket in background', {
						userId,
						error: err instanceof Error ? err.message : 'Unknown error'
					});
				});
			} else {
				await supabaseAdmin
					.from('users')
					.update({ last_login_at: new Date().toISOString() })
					.eq('id', userId);

				const { data: existingCreds } = await supabaseAdmin
					.from('polymarket_credentials')
					.select('deployed_at')
					.eq('user_id', userId)
					.single();

				if (!existingCreds?.deployed_at) {
					registerWithPolymarketAsync(userId).catch((err) => {
						logger.error('Failed to register with Polymarket in background', {
							userId,
							error: err instanceof Error ? err.message : 'Unknown error'
						});
					});
				}
			}
		} else {
			logger.info('Creating new user from OAuth', { userId, email });
			const serverWallet = await createServerWallet(userId);

			await supabaseAdmin.from('users').insert({
				id: userId,
				email,
				server_wallet_address: serverWallet.accountAddress,
				server_wallet_id: serverWallet.walletId,
				encrypted_server_key_shares: serverWallet.encryptedKeyShares,
				server_wallet_public_key: serverWallet.publicKeyHex,
				created_at: new Date().toISOString(),
				last_login_at: new Date().toISOString()
			});

			registerWithPolymarketAsync(userId).catch((err) => {
				logger.error('Failed to register with Polymarket in background', {
					userId,
					error: err instanceof Error ? err.message : 'Unknown error'
				});
			});
		}
	} catch (error) {
		logger.error('User registration in callback failed', {
			userId,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
}

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') || '/';

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			const {
				data: { user }
			} = await locals.supabase.auth.getUser();

			if (user) {
				// Non-blocking registration with timeout
				Promise.race([
					ensureUserRegistered(user.id, user.email || ''),
					new Promise((_, reject) => setTimeout(() => reject(new Error('Registration timeout')), 8000))
				]).catch((err) => {
					logger.warn('User registration timeout or error, will complete in background', {
						userId: user.id,
						error: err instanceof Error ? err.message : 'Unknown error'
					});
				});
			}

			throw redirect(303, next);
		}
	}

	throw redirect(303, '/');
};
