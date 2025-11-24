/**
 * Authentication store for Dynamic client
 * Provides reactive access to auth state throughout the app
 */

import { writable, derived, readable } from 'svelte/store';
import type { DynamicClient } from '@dynamic-labs-sdk/client';
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
 */
export const user = readable<any>(null, (set) => {
	if (!browser) return;

	let client: DynamicClient | null = null;
	let unsubscribeClient: (() => void) | null = null;
	let intervalId: number | null = null;

	// Subscribe to client changes
	unsubscribeClient = dynamicClient.subscribe(($client) => {
		client = $client;
		if (client) {
			// Set initial user
			set(client.user);

			// Poll for user changes (SDK doesn't provide reactive updates)
			intervalId = window.setInterval(() => {
				if (client) {
					set(client.user);
				}
			}, 1000);
		} else {
			set(null);
		}
	});

	return () => {
		if (unsubscribeClient) unsubscribeClient();
		if (intervalId) clearInterval(intervalId);
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
