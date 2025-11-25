<script lang="ts">
	import '$lib/styles/colors.css';
	import '$lib/styles/app.css';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { dev } from '$app/environment';
	import { createQueryClient } from '$lib/query/client';
	import { createDynamicClient } from '@dynamic-labs-sdk/client';
	import { PUBLIC_DYNAMIC_ENVIRONMENT_ID } from '$env/static/public';
	import { dynamicClient, isInitializing } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	let { children, data } = $props();

	const queryClient = data?.queryClient || createQueryClient();

	// Initialize Dynamic client (browser-only)
	onMount(async () => {
		const { detectOAuthRedirect, completeSocialAuthentication } = await import(
			'@dynamic-labs-sdk/client'
		);

		// Import EVM extension functions
		const { addEvmExtension } = await import('@dynamic-labs-sdk/evm');

		const client = createDynamicClient({
			environmentId: PUBLIC_DYNAMIC_ENVIRONMENT_ID,
			metadata: {
				name: 'Glitch Markets',
				url: window.location.origin,
				iconUrl: `${window.location.origin}/favicon.png`
			}
		});

		// Add EVM extension for embedded wallets and external EVM wallets
		addEvmExtension(client);

		// Set the client in the store (initializes automatically)
		dynamicClient.set(client);

		console.log('Dynamic client created with EVM extension:', client);
		console.log('Client configuration:', {
			environmentId: PUBLIC_DYNAMIC_ENVIRONMENT_ID,
			hasMetadata: true
		});

		// Wait a bit for initialization
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Check if this is an OAuth callback
		const currentUrl = new URL(window.location.href);
		const isReturning = await detectOAuthRedirect({ url: currentUrl });

		if (isReturning) {
			console.log('Detected OAuth redirect, completing authentication...');
			try {
				await completeSocialAuthentication({ url: currentUrl });
				console.log('Authentication completed!', client.user);
			} catch (err) {
				console.error('Failed to complete authentication:', err);
			}
		}

		// Mark initialization as complete
		isInitializing.set(false);
	});
</script>

<QueryClientProvider client={queryClient}>
	{@render children()}
	{#if dev}
		<SvelteQueryDevtools buttonPosition="bottom-right" />
	{/if}
</QueryClientProvider>
