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
	import { initializeTheme } from '$lib/stores/theme.svelte';
	import { onMount } from 'svelte';
	import TopHeader from '$lib/components/layout/TopHeader.svelte';
	import BottomNav from '$lib/components/layout/BottomNav.svelte';
	// @ts-expect-error - virtual module from vite-plugin-pwa
	import { pwaInfo } from 'virtual:pwa-info';

	let { children, data } = $props();

	const queryClient = data?.queryClient || createQueryClient();

	onMount(async () => {
		initializeTheme();

		try {
			const { detectOAuthRedirect, completeSocialAuthentication } =
				await import('@dynamic-labs-sdk/client');

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

	const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html webManifestLink}
	<link rel="icon" href="/favicon.ico" sizes="48x48" />
	<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
</svelte:head>

<QueryClientProvider client={queryClient}>
	<div class="app-layout">
		<TopHeader />

		<main class="main-content">
			{@render children()}
		</main>

		<BottomNav />
	</div>

	{#if dev}
		<SvelteQueryDevtools buttonPosition="bottom-right" />
	{/if}
</QueryClientProvider>

<style>
	.app-layout {
		display: grid;
		grid-template-rows: auto 1fr auto;
		grid-template-columns: 100%;
		grid-template-areas:
			'header'
			'main'
			'footer';
		min-height: 100vh;
		background-color: var(--bg-0);
	}

	.app-layout :global(.site-header) {
		grid-area: header;
	}

	.main-content {
		grid-area: main;
		width: 100%;
		overflow-x: hidden;
	}

	.app-layout :global(.bottom-nav) {
		grid-area: footer;
	}

	/* Desktop: Hide bottom nav from grid */
	@media (min-width: 768px) {
		.app-layout {
			grid-template-rows: auto 1fr;
			grid-template-areas:
				'header'
				'main';
		}

		.app-layout :global(.bottom-nav) {
			display: none;
		}
	}
</style>
