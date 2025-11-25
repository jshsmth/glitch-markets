<script lang="ts">
	import '$lib/styles/colors.css';
	import '$lib/styles/app.css';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { dev } from '$app/environment';
	import { createQueryClient } from '$lib/query/client';
	import { createDynamicClient, initializeClient, onEvent } from '@dynamic-labs-sdk/client';
	import { PUBLIC_DYNAMIC_ENVIRONMENT_ID } from '$env/static/public';
	import { initializeAuthListeners, setInitializationComplete } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';

	let { children, data } = $props();

	const queryClient = data?.queryClient || createQueryClient();

	onMount(async () => {
		try {
			const { detectOAuthRedirect, completeSocialAuthentication } = await import(
				'@dynamic-labs-sdk/client'
			);

			const { addEvmExtension } = await import('@dynamic-labs-sdk/evm');

			const client = createDynamicClient({
				environmentId: PUBLIC_DYNAMIC_ENVIRONMENT_ID,
				metadata: {
					name: 'Glitch Markets',
					url: window.location.origin,
					iconUrl: `${window.location.origin}/favicon.png`
				},
				autoInitialize: false
			});

			onEvent({
				event: 'initStatusChanged',
				listener: ({ initStatus }) => {
					if (dev) {
						console.log('Dynamic init status:', initStatus);
					}

					if (initStatus === 'finished') {
						setInitializationComplete();
						if (dev) {
							console.log('Dynamic client fully initialized');
						}
					} else if (initStatus === 'failed') {
						console.error('Dynamic client initialization failed');
						setInitializationComplete();
					}
				}
			});

			addEvmExtension(client);

			initializeAuthListeners(client);

			if (dev) {
				console.log('Dynamic client created with EVM extension');
				console.log('Client configuration:', {
					environmentId: PUBLIC_DYNAMIC_ENVIRONMENT_ID,
					hasMetadata: true,
					extensions: ['EVM']
				});
			}

			await initializeClient();

			const currentUrl = new URL(window.location.href);
			const isReturning = await detectOAuthRedirect({ url: currentUrl });

			if (isReturning) {
				if (dev) {
					console.log('Detected OAuth redirect, completing authentication...');
				}
				try {
					await completeSocialAuthentication({ url: currentUrl });
					if (dev) {
						console.log('Authentication completed!', client.user);
					}
				} catch (err) {
					console.error('Failed to complete authentication:', err);
				}
			}
		} catch (importError) {
			console.error('Failed to load Dynamic SDK modules:', importError);
			setInitializationComplete();
			// Optionally notify user of initialization failure
			if (dev) {
				console.error('Critical: Dynamic SDK failed to load. Authentication features unavailable.');
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
