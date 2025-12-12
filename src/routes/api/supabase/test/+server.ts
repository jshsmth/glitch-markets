/**
 * Test endpoint to verify Supabase connection
 * GET /api/supabase/test
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Verify the Supabase client is initialized
		if (!locals.supabase) {
			return json(
				{
					success: false,
					message: 'Supabase client not initialized'
				},
				{ status: 500 }
			);
		}

		// Test auth service is available (use getUser for secure verification)
		const {
			data: { user },
			error: authError
		} = await locals.supabase.auth.getUser();

		return json({
			success: true,
			message: 'Supabase connection successful',
			config: {
				url: PUBLIC_SUPABASE_URL,
				hasSession: !authError && !!user,
				authenticated: !authError && !!user
			},
			note: 'No tables defined yet. Create tables in your Supabase dashboard to start using the database.'
		});
	} catch (error) {
		return json(
			{
				success: false,
				message: 'Supabase connection failed',
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
