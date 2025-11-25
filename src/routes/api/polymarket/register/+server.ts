/**
 * Polymarket Registration Endpoint
 * Registers server wallet with Polymarket CLOB for automated trading
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { polymarketCredentials, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { encryptWithAES } from '$lib/server/utils/crypto';
import { POLYMARKET_CLOB_URL } from '$env/static/private';
import { signTypedDataWithServerWallet } from '$lib/server/wallet/server-wallet';
import { deriveProxyWalletAddress } from '$lib/server/utils/proxy-wallet';
import { getAddress } from 'viem';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.userId;

	try {
		const existing = await db.query.polymarketCredentials.findFirst({
			where: eq(polymarketCredentials.userId, userId)
		});

		if (existing) {
			return json({ error: 'Already registered with Polymarket' }, { status: 400 });
		}

		const user = await db.query.users.findFirst({
			where: eq(users.id, userId)
		});

		if (!user || !user.serverWalletAddress || !user.encryptedServerKeyShares) {
			return json({ error: 'Server wallet not found' }, { status: 400 });
		}

		const proxyWalletAddress = getAddress(await deriveProxyWalletAddress(user.serverWalletAddress));

		const timestamp = Date.now();

		const domain = {
			name: 'ClobAuthDomain',
			version: '1',
			chainId: 137
		};

		const types = {
			ClobAuth: [
				{ name: 'address', type: 'address' },
				{ name: 'timestamp', type: 'string' },
				{ name: 'nonce', type: 'uint256' },
				{ name: 'message', type: 'string' }
			]
		};

		const message = {
			address: user.serverWalletAddress.toLowerCase(),
			timestamp: timestamp.toString(),
			nonce: 0,
			message: 'This message attests that I control the given wallet'
		};

		const signature = await signTypedDataWithServerWallet(
			user.serverWalletAddress,
			domain,
			types,
			message,
			user.encryptedServerKeyShares
		);

		const clobUrl = POLYMARKET_CLOB_URL || 'https://clob.polymarket.com';

		const requestHeaders = {
			POLY_ADDRESS: getAddress(user.serverWalletAddress),
			POLY_SIGNATURE: signature,
			POLY_TIMESTAMP: timestamp.toString(),
			POLY_NONCE: '0'
		};

		console.log('Polymarket CLOB request:', {
			url: `${clobUrl}/auth/api-key`,
			headers: requestHeaders,
			proxyWalletAddress
		});

		const response = await fetch(`${clobUrl}/auth/api-key`, {
			method: 'POST',
			headers: requestHeaders
		});

		if (!response.ok) {
			let errorData: string;
			try {
				const jsonError = await response.json();
				errorData = JSON.stringify(jsonError);
			} catch {
				errorData = await response.text();
			}
			console.error('Polymarket CLOB registration failed:', errorData);
			return json(
				{
					error: 'Failed to register with Polymarket',
					details: errorData
				},
				{ status: 500 }
			);
		}

		const responseData = await response.json();
		const { apiKey, secret, passphrase } = responseData;

		// Validate response has required fields
		if (!apiKey || !secret || !passphrase) {
			console.error('Missing credentials in Polymarket response:', {
				hasApiKey: !!apiKey,
				hasSecret: !!secret,
				hasPassphrase: !!passphrase
			});
			return json({ error: 'Invalid response from Polymarket API' }, { status: 500 });
		}

		// Type guard: Ensure credentials are strings
		if (
			typeof apiKey !== 'string' ||
			typeof secret !== 'string' ||
			typeof passphrase !== 'string'
		) {
			console.error('Invalid credential types from Polymarket API:', {
				apiKeyType: typeof apiKey,
				secretType: typeof secret,
				passphraseType: typeof passphrase
			});
			return json({ error: 'Invalid credential types from Polymarket API' }, { status: 500 });
		}

		const encryptedApiKey = encryptWithAES(apiKey);
		const encryptedSecret = encryptWithAES(secret);
		const encryptedPassphrase = encryptWithAES(passphrase);

		await db.insert(polymarketCredentials).values({
			userId,
			walletAddress: user.serverWalletAddress,
			proxyWalletAddress,
			encryptedApiKey,
			encryptedSecret,
			encryptedPassphrase,
			createdAt: new Date()
		});

		return json({
			success: true,
			message: 'Successfully registered with Polymarket',
			proxyWalletAddress
		});
	} catch (error) {
		const errorId = crypto.randomUUID();
		console.error('Polymarket registration error:', {
			userId,
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
