/**
 * Authentication store for Supabase Auth (Svelte 5 Runes version)
 * Provides reactive access to auth state throughout the app
 */

import type { Session, User } from '@supabase/supabase-js';
import { browser } from '$app/environment';

/**
 * Auth state using Svelte 5 runes
 */
export const authState = $state({
	session: null as Session | null,
	user: null as User | null,
	isInitializing: true
});

/**
 * Function: Check if user is authenticated
 */
export function isAuthenticated(): boolean {
	return !!authState.user;
}

/**
 * Function: Get user ID
 */
export function getUserId(): string | null {
	return authState.user?.id ?? null;
}

/**
 * Function: Get user email
 */
export function getUserEmail(): string | null {
	return authState.user?.email ?? null;
}

/**
 * Initialize auth state from session
 */
export function initializeAuth(session: Session | null) {
	if (!browser) return;

	authState.session = session;
	authState.user = session?.user ?? null;
	authState.isInitializing = false;
}

/**
 * Update auth state when session changes
 */
export function updateAuthState(session: Session | null) {
	authState.session = session;
	authState.user = session?.user ?? null;
}

/**
 * Set initialization complete
 */
export function setInitializationComplete() {
	authState.isInitializing = false;
}
