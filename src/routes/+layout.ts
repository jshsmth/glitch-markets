import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from '$lib/supabase/database.types';
import { createQueryClient } from '$lib/query/client';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ depends, fetch }) => {
	/**
	 * Declare a dependency so the layout will be invalidated when
	 * `invalidate('supabase:auth')` is called.
	 */
	depends('supabase:auth');

	/**
	 * Create a Supabase client for browser usage.
	 * The @supabase/ssr package handles cookies automatically in the browser.
	 */
	const supabase = createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			fetch
		}
	});

	/**
	 * The session from server is trusted for initial render.
	 * The browser client will sync with this session.
	 * Using getSession() is fine here - only for UI, not security decisions.
	 */
	const {
		data: { session }
	} = await supabase.auth.getSession();

	const queryClient = createQueryClient();

	return {
		session,
		supabase,
		queryClient
	};
};
