/**
 * Polymarket Status Check Endpoint
 * Checks if user is registered with Polymarket
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { polymarketCredentials } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const userId = locals.user.userId;

		// Check if credentials exist for this user
		const creds = await db.query.polymarketCredentials.findFirst({
			where: eq(polymarketCredentials.userId, userId)
		});

		return json({
			registered: !!creds,
			walletAddress: creds?.walletAddress || null
		});
	} catch (error) {
		console.error('Polymarket status check error:', error);

		return json(
			{
				error: 'Failed to check Polymarket status',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
