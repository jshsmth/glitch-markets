/**
 * Polymarket Registration Endpoint
 * Registers user with Polymarket CLOB and stores encrypted credentials
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { polymarketCredentials } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { encryptWithAES } from '$lib/server/utils/crypto';
import { POLYMARKET_CLOB_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.userId;

	try {
		// Parse request body
		const { signature, walletAddress, timestamp, message } = await request.json();

		if (!signature || !walletAddress) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Check if user is already registered with Polymarket
		const existing = await db.query.polymarketCredentials.findFirst({
			where: eq(polymarketCredentials.userId, userId)
		});

		if (existing) {
			return json({ error: 'Already registered with Polymarket' }, { status: 400 });
		}

		// Register with Polymarket CLOB API
		const clobUrl = POLYMARKET_CLOB_URL || 'https://clob.polymarket.com';
		const response = await fetch(`${clobUrl}/auth/api-key`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				address: walletAddress,
				signature: signature,
				timestamp: timestamp,
				message: message
			})
		});

		if (!response.ok) {
			const errorData = await response.text();
			console.error('Polymarket CLOB registration failed:', errorData);
			return json(
				{
					error: 'Failed to register with Polymarket',
					details: errorData
				},
				{ status: 500 }
			);
		}

		const { apiKey, secret, passphrase } = await response.json();

		if (!apiKey || !secret || !passphrase) {
			return json(
				{ error: 'Invalid response from Polymarket API' },
				{ status: 500 }
			);
		}

		// Encrypt credentials before storing
		const encryptedApiKey = encryptWithAES(apiKey);
		const encryptedSecret = encryptWithAES(secret);
		const encryptedPassphrase = encryptWithAES(passphrase);

		// Store encrypted credentials in database
		await db.insert(polymarketCredentials).values({
			userId,
			walletAddress,
			encryptedApiKey,
			encryptedSecret,
			encryptedPassphrase,
			createdAt: new Date()
		});

		return json({
			success: true,
			message: 'Successfully registered with Polymarket'
		});
	} catch (error) {
		console.error('Polymarket registration error:', error);

		return json(
			{
				error: 'Failed to register with Polymarket',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
