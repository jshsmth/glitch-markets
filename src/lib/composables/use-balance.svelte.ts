/**
 * Balance composable using TanStack Query
 * Provides reactive balance state with automatic refetching
 */

import { createQuery } from '@tanstack/svelte-query';
import { browser } from '$app/environment';
import { authState } from '$lib/stores/auth.svelte';
import { walletState } from '$lib/stores/wallet.svelte';

interface BalanceResponse {
	balance: string | null;
	balanceRaw: string | null;
	decimals: number;
	hasProxyWallet: boolean;
}

export function useBalance() {
	const balanceQuery = createQuery<BalanceResponse>(() => ({
		queryKey: ['user', 'balance', walletState.proxyWalletAddress],
		queryFn: async () => {
			const response = await fetch('/api/user/balance');
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			return response.json();
		},
		enabled: browser && !!authState.session,
		refetchInterval: 60000, // Auto-refetch every 60s
		refetchOnWindowFocus: true, // Refetch when user returns to tab
		staleTime: 30000, // Consider fresh for 30s
		retry: 2
	}));

	const balance = $derived(balanceQuery.data?.balance ?? null);
	const balanceRaw = $derived(balanceQuery.data?.balanceRaw ?? null);
	const decimals = $derived(balanceQuery.data?.decimals ?? 6);
	const hasProxyWallet = $derived(balanceQuery.data?.hasProxyWallet ?? false);
	const isLoading = $derived(balanceQuery.isLoading);
	const error = $derived(balanceQuery.error?.message ?? null);

	return {
		get balance() {
			return balance;
		},
		get balanceRaw() {
			return balanceRaw;
		},
		get decimals() {
			return decimals;
		},
		get hasProxyWallet() {
			return hasProxyWallet;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		refetch: () => balanceQuery.refetch()
	};
}
