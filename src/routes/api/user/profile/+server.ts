/**
 * User Profile Endpoint
 * GET /api/user/profile
 * Returns user profile data including proxy wallet address
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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

		const { data: dbUser, error: userError } = await locals.supabase
			.from('users')
			.select('id, email, server_wallet_address')
			.eq('id', userId)
			.single();

		if (userError || !dbUser) {
			console.error('User not found in database:', { userId, error: userError });
			return json({ error: 'User not found' }, { status: 404 });
		}

		const { data: credentials } = await locals.supabase
			.from('polymarket_credentials')
			.select('proxy_wallet_address')
			.eq('user_id', userId)
			.single();

		return json({
			id: dbUser.id,
			email: dbUser.email,
			serverWalletAddress: dbUser.server_wallet_address,
			proxyWalletAddress: credentials?.proxy_wallet_address || null
		});
	} catch (err) {
		console.error('Error fetching user profile:', err);
		return json({ error: 'Failed to fetch user profile' }, { status: 500 });
	}
};
