/**
 * Authentication store for Dynamic client
 * Provides reactive access to auth state throughout the app
 */

import { writable, derived, readable } from 'svelte/store';
import type { DynamicClient } from '@dynamic-labs-sdk/client';
import { onEvent } from '@dynamic-labs-sdk/client';
import { browser } from '$app/environment';

/**
 * Dynamic client instance
 * Set in +layout.svelte after browser initialization
 */
export const dynamicClient = writable<DynamicClient | null>(null);

/**
 * Track whether the client is still initializing
 * Used to prevent flash of login state during hydration
 */
export const isInitializing = writable<boolean>(true);

/**
 * Reactive user store that updates when authentication state changes
 * Uses Dynamic SDK events instead of polling for better performance
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const user = readable<any>(null, (set) => {
	if (!browser) return;

	let client: DynamicClient | null = null;
	let unsubscribeClient: (() => void) | null = null;
	let unsubscribeEvents: Array<() => void> = [];

	// Subscribe to client changes
	unsubscribeClient = dynamicClient.subscribe(($client) => {
		// Clean up previous event listeners
		unsubscribeEvents.forEach((unsubscribe) => unsubscribe());
		unsubscribeEvents = [];

		client = $client;
		if (client) {
			// Set initial user
			set(client.user);

			// Listen to user state changes for reactive updates
			// userChanged event fires whenever user state changes (sign in, sign out, profile updates, wallet changes)
			const unsubscribeUserChanged = onEvent({
				event: 'userChanged',
				listener: ({ user }) => {
					set(user);
				}
			});

			// Listen to logout event specifically
			const unsubscribeLogout = onEvent({
				event: 'logout',
				listener: () => {
					set(null);
				}
			});

			unsubscribeEvents = [unsubscribeUserChanged, unsubscribeLogout];
		} else {
			set(null);
		}
	});

	return () => {
		if (unsubscribeClient) unsubscribeClient();
		unsubscribeEvents.forEach((unsubscribe) => unsubscribe());
	};
});

/**
 * Derived store: Is user authenticated?
 */
export const isAuthenticated = derived(user, ($user) => !!$user);

/**
 * Derived store: JWT token
 */
export const token = derived(dynamicClient, ($client) => $client?.token ?? null);

/**
 * Derived store: Connected wallet accounts
 */
export const walletAccounts = derived(user, ($user) => {
	try {
		return $user?.verifiedCredentials || [];
	} catch {
		return [];
	}
});
