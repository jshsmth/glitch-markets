<script lang="ts">
	import '$lib/styles/colors.css';
	import '$lib/styles/app.css';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { dev } from '$app/environment';
	import { createQueryClient } from '$lib/query/client';
	import { createDynamicClient, initializeClient, onEvent } from '@dynamic-labs-sdk/client';
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

		// Create client with manual initialization
		const client = createDynamicClient({
			environmentId: PUBLIC_DYNAMIC_ENVIRONMENT_ID,
			metadata: {
				name: 'Glitch Markets',
				url: window.location.origin,
				iconUrl: `${window.location.origin}/favicon.png`
			},
			autoInitialize: false
		});

		// Listen to initialization status changes
		onEvent({
			event: 'initStatusChanged',
			listener: ({ initStatus }) => {
				console.log('Dynamic init status:', initStatus);

				if (initStatus === 'finished') {
					isInitializing.set(false);
					console.log('Dynamic client fully initialized');
				} else if (initStatus === 'failed') {
					console.error('Dynamic client initialization failed');
					isInitializing.set(false);
				}
			}
		});

		// Add EVM extension for embedded wallets and external EVM wallets
		// Note: WaaS (Wallet-as-a-Service) functionality is included with the EVM extension
		addEvmExtension(client);

		// Set the client in the store BEFORE initializing
		dynamicClient.set(client);

		console.log('Dynamic client created with EVM extension');
		console.log('Client configuration:', {
			environmentId: PUBLIC_DYNAMIC_ENVIRONMENT_ID,
			hasMetadata: true,
			extensions: ['EVM']
		});

		// Manually initialize the client
		await initializeClient();

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
	});
</script>

<QueryClientProvider client={queryClient}>
	{@render children()}
	{#if dev}
		<SvelteQueryDevtools buttonPosition="bottom-right" />
	{/if}
</QueryClientProvider>
