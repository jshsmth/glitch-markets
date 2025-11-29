import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, polymarketCredentials } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return error(401, { message: 'Unauthorized' });
	}

	try {
		const [user] = await db
			.select({
				id: users.id,
				email: users.email,
				serverWalletAddress: users.serverWalletAddress
			})
			.from(users)
			.where(eq(users.id, locals.user.userId))
			.limit(1);

		if (!user) {
			return error(404, { message: 'User not found' });
		}

		const [polymarketCreds] = await db
			.select({
				proxyWalletAddress: polymarketCredentials.proxyWalletAddress
			})
			.from(polymarketCredentials)
			.where(eq(polymarketCredentials.userId, locals.user.userId))
			.limit(1);

		return json({
			id: user.id,
			email: user.email,
			serverWalletAddress: user.serverWalletAddress,
			proxyWalletAddress: polymarketCreds?.proxyWalletAddress || null
		});
	} catch (err) {
		console.error('Error fetching user profile:', err);
		return error(500, { message: 'Failed to fetch user profile' });
	}
};
