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

	return {
		balance: $derived(balanceQuery.data?.balance ?? null),
		balanceRaw: $derived(balanceQuery.data?.balanceRaw ?? null),
		decimals: $derived(balanceQuery.data?.decimals ?? 6),
		hasProxyWallet: $derived(balanceQuery.data?.hasProxyWallet ?? false),
		isLoading: $derived(balanceQuery.isLoading),
		error: $derived(balanceQuery.error?.message ?? null),
		refetch: () => balanceQuery.refetch()
	};
}
