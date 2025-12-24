/**
 * Balance store - now powered by TanStack Query
 * Provides reactive state for user USDC.e balance
 *
 * MIGRATION NOTE: This now uses TanStack Query internally.
 * No more manual polling or cleanup needed!
 */

import { browser } from '$app/environment';
import type { QueryClient } from '@tanstack/svelte-query';
import { authState } from './auth.svelte';
import { walletState } from './wallet.svelte';

interface BalanceResponse {
	balance: string | null;
	balanceRaw: string | null;
	decimals: number;
	hasProxyWallet: boolean;
}

let queryClient: QueryClient | null = null;

/**
 * Initialize the balance query with the QueryClient
 * Call this once in your root layout after QueryClientProvider is set up
 */
export function initializeBalanceSync(client: QueryClient): () => void {
	if (!browser) return () => {};

	queryClient = client;

	// Set up the query
	const unsubscribe = $effect.root(() => {
		$effect(() => {
			// Only fetch if we have a session and proxy wallet
			if (!authState.session || !walletState.proxyWalletAddress) {
				return;
			}

			// Fetch the query
			queryClient?.fetchQuery({
				queryKey: ['user', 'balance', walletState.proxyWalletAddress],
				queryFn: async () => {
					const response = await fetch('/api/user/balance');
					if (!response.ok) {
						throw new Error(`HTTP ${response.status}`);
					}
					return response.json();
				},
				staleTime: 30000 // Consider fresh for 30s
			});

			// Set up interval for refetching
			const interval = setInterval(() => {
				if (authState.session && walletState.proxyWalletAddress) {
					queryClient?.refetchQueries({
						queryKey: ['user', 'balance', walletState.proxyWalletAddress]
					});
				}
			}, 60000); // Refetch every 60s

			return () => {
				clearInterval(interval);
			};
		});
	});

	return () => {
		unsubscribe();
	};
}

/**
 * Reactive balance state
 * Now powered by TanStack Query with automatic refetching!
 */
export const balanceState = {
	get balance() {
		if (!queryClient) return null;
		const data = queryClient.getQueryData<BalanceResponse>([
			'user',
			'balance',
			walletState.proxyWalletAddress
		]);
		return data?.balance ?? null;
	},
	get balanceRaw() {
		if (!queryClient) return null;
		const data = queryClient.getQueryData<BalanceResponse>([
			'user',
			'balance',
			walletState.proxyWalletAddress
		]);
		return data?.balanceRaw ?? null;
	},
	get decimals() {
		if (!queryClient) return 6;
		const data = queryClient.getQueryData<BalanceResponse>([
			'user',
			'balance',
			walletState.proxyWalletAddress
		]);
		return data?.decimals ?? 6;
	},
	get hasProxyWallet() {
		if (!queryClient) return false;
		const data = queryClient.getQueryData<BalanceResponse>([
			'user',
			'balance',
			walletState.proxyWalletAddress
		]);
		return data?.hasProxyWallet ?? false;
	},
	get isLoading() {
		if (!queryClient) return false;
		const state = queryClient.getQueryState(['user', 'balance', walletState.proxyWalletAddress]);
		return state?.fetchStatus === 'fetching';
	},
	get error() {
		if (!queryClient) return null;
		const state = queryClient.getQueryState(['user', 'balance', walletState.proxyWalletAddress]);
		return state?.error ? (state.error as Error).message : null;
	}
};

/**
 * Manually refetch balance
 */
export async function fetchBalance(): Promise<void> {
	if (queryClient && walletState.proxyWalletAddress) {
		await queryClient.refetchQueries({
			queryKey: ['user', 'balance', walletState.proxyWalletAddress]
		});
	}
}

/**
 * Reset balance state (call on logout)
 * TanStack Query handles this automatically when the query is disabled
 */
export function resetBalanceState(): void {
	// Query automatically resets when authState.session becomes null
	// because of the enabled condition in the effect
}
