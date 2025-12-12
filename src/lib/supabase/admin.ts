/**
 * Supabase admin client for server-side operations that bypass RLS
 * Uses the service_role key instead of the anon key
 * IMPORTANT: Never expose this client to the browser
 */

import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import type { Database } from './database.types';

if (!SUPABASE_SERVICE_ROLE_KEY) {
	throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
}

/**
 * Admin Supabase client that bypasses RLS
 * Use this for server-side operations that need to manipulate data
 * on behalf of users (like wallet creation during registration)
 */
export const supabaseAdmin = createClient<Database>(
	PUBLIC_SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	}
);
