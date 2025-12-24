import type { LayoutServerLoad } from './$types';
import { Logger } from '$lib/server/utils/logger';

const logger = new Logger({ component: 'Layout' });

export const load: LayoutServerLoad = async ({ locals }) => {
	/**
	 * getSession() is safe here because:
	 * 1. This is only used for UI rendering, not security decisions
	 * 2. API routes use getUser() for secure auth verification
	 * 3. getSession() is faster as it reads from cookies without a server call
	 *
	 * IMPORTANT: Never use session from getSession() for security-sensitive operations.
	 * Always use getUser() in API routes and server actions.
	 */
	const {
		data: { session }
	} = await locals.supabase.auth.getSession();

	let profile = null;

	if (session?.user) {
		try {
			const userId = session.user.id;

			const [dbUserResult, credentialsResult] = await Promise.all([
				locals.supabase
					.from('users')
					.select('id, email, server_wallet_address')
					.eq('id', userId)
					.single(),
				locals.supabase
					.from('polymarket_credentials')
					.select('proxy_wallet_address, deployed_at')
					.eq('user_id', userId)
					.single()
			]);

			const dbUser = dbUserResult.data;
			const credentials = credentialsResult.data;

			if (dbUser) {
				profile = {
					id: dbUser.id,
					email: dbUser.email,
					serverWalletAddress: dbUser.server_wallet_address,
					proxyWalletAddress: credentials?.proxy_wallet_address || null,
					isRegistered: !!credentials?.deployed_at
				};
			}
		} catch (err) {
			logger.error('Error loading user profile in layout', {
				error: err instanceof Error ? err.message : 'Unknown error'
			});
		}
	}

	return {
		session,
		profile
	};
};
