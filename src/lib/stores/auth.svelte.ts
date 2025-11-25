/**
 * Authentication store for Dynamic client (Svelte 5 Runes version)
 * Provides reactive access to auth state throughout the app
 */

import type { DynamicClient } from '@dynamic-labs-sdk/client';
import { onEvent } from '@dynamic-labs-sdk/client';
import { browser } from '$app/environment';
import type { DynamicUser } from '$lib/types/dynamic';

/**
 * Auth state using Svelte 5 runes
 */
export const authState = $state({
	client: null as DynamicClient | null,
	user: null as DynamicUser | null,
	isInitializing: true
});

/**
 * Function: Check if user is authenticated
 */
export function isAuthenticated(): boolean {
	return !!authState.user;
}

/**
 * Function: Get JWT token
 */
export function getToken(): string | null {
	return authState.client?.token ?? null;
}

/**
 * Function: Get connected wallet accounts
 */
export function getWalletAccounts() {
	return authState.user?.verifiedCredentials || [];
}

/**
 * Initialize Dynamic client event listeners
 * Call this once when the Dynamic client is created
 */
export function initializeAuthListeners(client: DynamicClient) {
	if (!browser) return;

	authState.client = client;
	authState.user = client.user as DynamicUser | null;

	// Listen to user state changes for reactive updates
	// userChanged event fires whenever user state changes (sign in, sign out, profile updates, wallet changes)
	const unsubscribeUserChanged = onEvent({
		event: 'userChanged',
		listener: ({ user }) => {
			authState.user = user as DynamicUser | null;
		}
	});

	// Listen to logout event specifically
	const unsubscribeLogout = onEvent({
		event: 'logout',
		listener: () => {
			authState.user = null;
		}
	});

	return () => {
		unsubscribeUserChanged();
		unsubscribeLogout();
	};
}

/**
 * Set initialization complete
 */
export function setInitializationComplete() {
	authState.isInitializing = false;
}
