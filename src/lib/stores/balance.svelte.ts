/**
 * Balance store for managing user USDC.e balance
 * Fetches balance from Polygon blockchain via API
 */

import { browser } from '$app/environment';
import { authState } from './auth.svelte';

interface BalanceState {
	balance: string | null;
	balanceRaw: string | null;
	decimals: number;
	hasProxyWallet: boolean;
	isLoading: boolean;
	error: string | null;
}

export const balanceState = $state<BalanceState>({
	balance: null,
	balanceRaw: null,
	decimals: 6,
	hasProxyWallet: false,
	isLoading: false,
	error: null
});

let abortController: AbortController | null = null;
let lastProfileVersion = -1;

/**
 * Fetch balance from the API
 */
export async function fetchBalance(): Promise<void> {
	if (!browser || !authState.session) {
		balanceState.balance = null;
		balanceState.balanceRaw = null;
		balanceState.hasProxyWallet = false;
		balanceState.isLoading = false;
		balanceState.error = null;
		return;
	}

	if (abortController) {
		abortController.abort();
	}

	abortController = new AbortController();
	balanceState.isLoading = true;
	balanceState.error = null;

	try {
		const response = await fetch('/api/user/balance', {
			signal: abortController.signal
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const data = await response.json();
		balanceState.balance = data.balance || null;
		balanceState.balanceRaw = data.balanceRaw || null;
		balanceState.decimals = data.decimals || 6;
		balanceState.hasProxyWallet = data.hasProxyWallet || false;
	} catch (err) {
		if (err instanceof Error && err.name === 'AbortError') {
			return;
		}
		console.error('Failed to fetch balance:', err);
		balanceState.error = err instanceof Error ? err.message : 'Failed to load balance';
		balanceState.balance = null;
		balanceState.balanceRaw = null;
		balanceState.hasProxyWallet = false;
	} finally {
		balanceState.isLoading = false;
		abortController = null;
	}
}

/**
 * Auto-fetch balance when auth state changes
 * Call this in a $effect in your root layout
 */
export function initializeBalanceSync(): () => void {
	const cleanup = $effect.root(() => {
		$effect(() => {
			const currentVersion = authState.profileVersion;

			if (!authState.session) {
				balanceState.balance = null;
				balanceState.balanceRaw = null;
				balanceState.hasProxyWallet = false;
				balanceState.isLoading = false;
				balanceState.error = null;
				lastProfileVersion = -1;
				return;
			}

			if (currentVersion !== lastProfileVersion) {
				lastProfileVersion = currentVersion;
				fetchBalance();
			}
		});
	});

	return cleanup;
}

/**
 * Reset balance state (call on logout)
 */
export function resetBalanceState(): void {
	if (abortController) {
		abortController.abort();
		abortController = null;
	}

	balanceState.balance = null;
	balanceState.balanceRaw = null;
	balanceState.hasProxyWallet = false;
	balanceState.isLoading = false;
	balanceState.error = null;
	lastProfileVersion = -1;
}
