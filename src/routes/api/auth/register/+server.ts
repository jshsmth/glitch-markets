/**
 * User Registration Endpoint
 * Creates or updates user in database after Dynamic authentication
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ locals }) => {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { userId, email, walletAddress } = locals.user;

	try {
		// Check if user already exists
		const existingUser = await db.query.users.findFirst({
			where: eq(users.id, userId)
		});

		if (existingUser) {
			// Update last login time
			await db
				.update(users)
				.set({ lastLoginAt: new Date() })
				.where(eq(users.id, userId));

			return json({
				success: true,
				user: {
					userId,
					email,
					walletAddress
				},
				message: 'User login updated'
			});
		}

		// Create new user
		await db.insert(users).values({
			id: userId,
			email,
			walletAddress,
			createdAt: new Date(),
			lastLoginAt: new Date()
		});

		return json({
			success: true,
			user: {
				userId,
				email,
				walletAddress
			},
			message: 'User created successfully'
		});
	} catch (error) {
		console.error('User registration error:', error);

		return json(
			{
				error: 'Failed to register user',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
