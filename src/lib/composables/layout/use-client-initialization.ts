import { onMount } from 'svelte';
import { initializeTheme } from '$lib/stores/theme.svelte';
import { initializeWalletSync } from '$lib/stores/wallet.svelte';

export function useClientInitialization() {
	onMount(() => {
		initializeTheme();

		const cleanupWalletSync = initializeWalletSync();

		return () => {
			cleanupWalletSync();
		};
	});
}
