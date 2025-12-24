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
	isInitializing: true,
	/** Incremented when profile data should be refetched (e.g., after wallet creation) */
	profileVersion: 0
});

export function isAuthenticated(): boolean {
	return !!authState.user;
}

export function getUserId(): string | null {
	return authState.user?.id ?? null;
}

export function getUserEmail(): string | null {
	return authState.user?.email ?? null;
}

export function initializeAuth(session: Session | null) {
	if (!browser) return;

	authState.session = session;
	authState.user = session?.user ?? null;
	authState.isInitializing = false;
}

export function updateAuthState(session: Session | null) {
	authState.session = session;
	authState.user = session?.user ?? null;
}

export function setInitializationComplete() {
	authState.isInitializing = false;
}

/**
 * Call after wallet creation or profile updates
 */
export function refreshProfile() {
	authState.profileVersion++;
}
