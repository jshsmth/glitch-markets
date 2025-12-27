import { onMount } from 'svelte';
import type { QueryClient } from '@tanstack/svelte-query';
import { initializeTheme } from '$lib/stores/theme.svelte';
import { initializeWalletSync } from '$lib/stores/wallet.svelte';
import { setQueryClient } from '$lib/stores/watchlist.svelte';

export function useClientInitialization(queryClient: QueryClient) {
	onMount(() => {
		initializeTheme();
		setQueryClient(queryClient);

		const cleanupWalletSync = initializeWalletSync();

		return () => {
			cleanupWalletSync();
		};
	});
}
