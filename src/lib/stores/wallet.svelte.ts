/**
 * Wallet store for managing user wallet addresses
 * Shared across components to avoid duplicate API calls
 */

import { browser } from '$app/environment';
import { authState } from './auth.svelte';
import { CleanupManager } from './utils/cleanup';

interface WalletState {
	serverWalletAddress: string | null;
	proxyWalletAddress: string | null;
	isRegistered: boolean;
	isLoading: boolean;
	error: string | null;
}

export const walletState = $state<WalletState>({
	serverWalletAddress: null,
	proxyWalletAddress: null,
	isRegistered: false,
	isLoading: false,
	error: null
});

const cleanupManager = new CleanupManager();
let lastProfileVersion = -1;

/**
 * Fetch wallet addresses from the API
 */
export async function fetchWalletAddresses(): Promise<void> {
	if (!browser || !authState.session) {
		walletState.serverWalletAddress = null;
		walletState.proxyWalletAddress = null;
		walletState.isRegistered = false;
		walletState.isLoading = false;
		walletState.error = null;
		return;
	}

	const controller = cleanupManager.getAbortController();
	walletState.isLoading = true;
	walletState.error = null;

	try {
		const response = await fetch('/api/user/profile', {
			signal: controller.signal
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const data = await response.json();
		walletState.serverWalletAddress = data.serverWalletAddress || null;
		walletState.proxyWalletAddress = data.proxyWalletAddress || null;
		walletState.isRegistered = data.isRegistered || false;
	} catch (err) {
		if (err instanceof Error && err.name === 'AbortError') {
			return;
		}
		console.error('Failed to fetch wallet addresses:', err);
		walletState.error = err instanceof Error ? err.message : 'Failed to load wallet';
		walletState.serverWalletAddress = null;
		walletState.proxyWalletAddress = null;
		walletState.isRegistered = false;
	} finally {
		walletState.isLoading = false;
	}
}

let pollInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Poll for registration status until wallet is deployed
 */
function startRegistrationPolling(): void {
	if (pollInterval) return;

	pollInterval = setInterval(async () => {
		if (!authState.session) {
			stopRegistrationPolling();
			return;
		}

		if (walletState.isRegistered) {
			stopRegistrationPolling();
			return;
		}

		await fetchWalletAddresses();
	}, 3000);
}

/**
 * Stop polling for registration status
 */
function stopRegistrationPolling(): void {
	if (pollInterval) {
		clearInterval(pollInterval);
		pollInterval = null;
	}
}

/**
 * Auto-fetch wallet addresses when auth state changes
 * Call this in a $effect in your root layout
 */
export function initializeWalletSync(): () => void {
	const cleanup = $effect.root(() => {
		$effect(() => {
			const currentVersion = authState.profileVersion;

			if (!authState.session) {
				walletState.serverWalletAddress = null;
				walletState.proxyWalletAddress = null;
				walletState.isRegistered = false;
				walletState.isLoading = false;
				walletState.error = null;
				lastProfileVersion = -1;
				stopRegistrationPolling();
				return;
			}

			if (currentVersion !== lastProfileVersion) {
				lastProfileVersion = currentVersion;
				fetchWalletAddresses().then(() => {
					if (!walletState.isRegistered && authState.session) {
						startRegistrationPolling();
					}
				});
			}
		});
	});

	return () => {
		cleanup();
		stopRegistrationPolling();
	};
}

/**
 * Reset wallet state (call on logout)
 */
export function resetWalletState(): void {
	cleanupManager.cleanup();
	stopRegistrationPolling();

	walletState.serverWalletAddress = null;
	walletState.proxyWalletAddress = null;
	walletState.isRegistered = false;
	walletState.isLoading = false;
	walletState.error = null;
	lastProfileVersion = -1;
}
