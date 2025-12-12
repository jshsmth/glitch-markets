import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	/**
	 * getSession() is safe here because:
	 * 1. This is only used for UI rendering, not security decisions
	 * 2. API routes use getUser() for secure auth verification
	 * 3. getSession() is faster as it reads from cookies without a server call
	 *
	 * IMPORTANT: Never use session from getSession() for security-sensitive operations.
	 * Always use getUser() in API routes and server actions.
	 */
	const {
		data: { session }
	} = await locals.supabase.auth.getSession();

	return {
		session
	};
};
