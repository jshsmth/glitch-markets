/**
 * User Registration Endpoint
 * Creates or updates user in database after Dynamic authentication
 * Also creates a server-side wallet for automated Polymarket trading
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createServerWallet } from '$lib/server/wallet/server-wallet';
import { Logger } from '$lib/server/utils/logger';

const logger = new Logger({ component: 'UserRegistration' });

export const POST: RequestHandler = async ({ locals }) => {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { userId, email } = locals.user;

	try {
		// Check if user already exists
		const existingUser = await db.query.users.findFirst({
			where: eq(users.id, userId)
		});

		if (existingUser) {
			// Update last login time
			await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));

			return json({
				success: true,
				user: {
					userId,
					email,
					serverWalletAddress: existingUser.serverWalletAddress,
					hasServerWallet: !!existingUser.serverWalletAddress
				},
				message: 'User login updated'
			});
		}

		// Create server wallet for the new user
		logger.info('Creating server wallet for new user', { userId });
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
				error: walletError instanceof Error ? walletError.message : 'Unknown error',
				stack: walletError instanceof Error ? walletError.stack : undefined
			});
			throw walletError;
		}

		// Create new user with server wallet
		await db.insert(users).values({
			id: userId,
			email,
			serverWalletAddress: serverWallet.accountAddress,
			serverWalletId: serverWallet.walletId,
			encryptedServerKeyShares: serverWallet.encryptedKeyShares,
			serverWalletPublicKey: serverWallet.publicKeyHex,
			createdAt: new Date(),
			lastLoginAt: new Date()
		});

		logger.info('User created with server wallet', {
			userId,
			serverWalletAddress: serverWallet.accountAddress
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
		logger.error('User registration error', {
			userId,
			error: error instanceof Error ? error.message : 'Unknown error'
		});

		return json(
			{
				error: 'Failed to register user',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
