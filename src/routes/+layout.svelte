<script lang="ts">
	import '$lib/styles/colors.css';
	import '$lib/styles/app.css';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { dev } from '$app/environment';
	import { createQueryClient } from '$lib/query/client';
	import { initializeAuth, updateAuthState } from '$lib/stores/auth.svelte';
	import { initializeTheme } from '$lib/stores/theme.svelte';
	import { signInModalState, closeSignInModal } from '$lib/stores/modal.svelte';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import TopHeader from '$lib/components/layout/TopHeader.svelte';
	import BottomNav from '$lib/components/layout/BottomNav.svelte';
	import SignInModal from '$lib/components/auth/SignInModal.svelte';
	// @ts-expect-error - virtual module from vite-plugin-pwa
	import { pwaInfo } from 'virtual:pwa-info';

	let { children, data } = $props();

	const queryClient = $derived(data?.queryClient || createQueryClient());
	const supabase = $derived(data?.supabase);

	onMount(() => {
		initializeTheme();

		// Initialize auth state from server session
		initializeAuth(data?.session);

		// Listen for auth state changes from Supabase
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, session) => {
			// Update local auth state
			updateAuthState(session);

			// Invalidate all load functions that depend on session
			invalidate('supabase:auth');

			// Trigger wallet creation for new sign-ups
			if (session?.user && _event === 'SIGNED_IN') {
				handleUserSignIn(session.user.id);
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	});

	/**
	 * Handle user sign-in by creating server wallet if needed
	 */
	async function handleUserSignIn(userId: string) {
		try {
			const response = await fetch('/api/auth/register', {
				method: 'POST'
			});

			if (!response.ok) {
				console.error('Failed to register user in database:', await response.text());
			}
		} catch (error) {
			console.error('Error registering user:', error);
		}
	}

	const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	import { onNavigate } from '$app/navigation';
	import { navigating } from '$app/stores';

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html webManifestLink}
	<link rel="icon" href="/favicon.ico" sizes="48x48" />
	<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
</svelte:head>

<QueryClientProvider client={queryClient}>
	<!-- Loading indicator for page navigation -->
	{#if $navigating}
		<div class="loading-bar"></div>
	{/if}

	<div class="app-layout">
		<TopHeader />

		<main class="main-content">
			{@render children()}
		</main>

		<BottomNav />
	</div>

	<!-- Global modals rendered at root level -->
	<SignInModal isOpen={signInModalState.isOpen} onClose={closeSignInModal} />

	{#if dev}
		<SvelteQueryDevtools buttonPosition="bottom-right" />
	{/if}
</QueryClientProvider>

<style>
	.loading-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, transparent, var(--primary), transparent);
		background-size: 50% 100%;
		animation: loading-slide 1s ease-in-out infinite;
		z-index: var(--z-modal);
		pointer-events: none;
	}

	@keyframes loading-slide {
		0% {
			background-position: -50% 0;
		}
		100% {
			background-position: 150% 0;
		}
	}

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
		position: relative;
		z-index: 1;
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
