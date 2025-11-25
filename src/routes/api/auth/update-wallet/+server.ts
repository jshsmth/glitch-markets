/**
 * Update Wallet Address Endpoint
 * Updates user's wallet address after embedded wallet is created
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ locals, request }) => {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { userId } = locals.user;
	const { walletAddress } = await request.json();

	if (!walletAddress) {
		return json({ error: 'Wallet address is required' }, { status: 400 });
	}

	try {
		// Update user's wallet address
		await db.update(users).set({ walletAddress }).where(eq(users.id, userId));

		return json({
			success: true,
			walletAddress,
			message: 'Wallet address updated successfully'
		});
	} catch (error) {
		console.error('Failed to update wallet address:', error);

		return json(
			{
				error: 'Failed to update wallet address',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
