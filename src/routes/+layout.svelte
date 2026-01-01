<script lang="ts">
	import '$lib/styles/colors.css';
	import '$lib/styles/app.css';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { createQueryClient } from '$lib/query/client';
	import {
		signInModalState,
		closeSignInModal,
		depositModalState,
		closeDepositModal,
		withdrawModalState,
		closeWithdrawModal
	} from '$lib/stores/modal.svelte';
	import { navigating } from '$app/stores';
	import TopHeader from '$lib/components/layout/TopHeader.svelte';
	import BottomNav from '$lib/components/layout/BottomNav.svelte';
	import SignInModal from '$lib/components/auth/SignInModal.svelte';
	import DepositModal from '$lib/components/wallet/DepositModal.svelte';
	import LazyWithdrawModal from '$lib/components/modals/LazyWithdrawModal.svelte';
	import ReloadPrompt from '$lib/components/pwa/ReloadPrompt.svelte';
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';
	import SlowLoadingIndicator from '$lib/components/ui/SlowLoadingIndicator.svelte';
	import { useAuthInitialization } from '$lib/composables/layout/use-auth-initialization.svelte';
	import { useClientInitialization } from '$lib/composables/layout/use-client-initialization';
	import { useRoutePreloading } from '$lib/composables/layout/use-route-preloading';
	import { useAuthListener } from '$lib/composables/layout/use-auth-listener.svelte';
	import { useWatchlistInitialization } from '$lib/composables/layout/use-watchlist-initialization.svelte';
	import {
		useNavigationTimeout,
		useViewTransitions
	} from '$lib/composables/layout/use-navigation-handling.svelte';
	import { handleUserRegistration } from '$lib/composables/layout/use-user-registration';
	// @ts-expect-error - virtual module from vite-plugin-pwa
	import { pwaInfo } from 'virtual:pwa-info';

	injectAnalytics({ mode: dev ? 'development' : 'production' });
	injectSpeedInsights();

	let { children, data } = $props();

	const queryClient = $derived(data?.queryClient || createQueryClient());
	const supabase = $derived(data?.supabase);
	const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');
	const session = $derived(data?.session);
	const profile = $derived(data?.profile);

	// Composables use $effect internally which properly tracks these reactive values
	// svelte-ignore state_referenced_locally
	useAuthInitialization(session, profile);
	useClientInitialization();
	useRoutePreloading();
	// svelte-ignore state_referenced_locally
	useAuthListener(supabase, session, profile, handleUserRegistration);
	useWatchlistInitialization();
	useNavigationTimeout();
	useViewTransitions();
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

	<!-- Slow loading indicator -->
	<SlowLoadingIndicator isNavigating={!!$navigating} />

	<!-- Toast notifications -->
	<ToastContainer />

	<a href="#main-content" class="skip-link">Skip to main content</a>

	<div class="app-layout">
		<TopHeader />

		<main id="main-content" class="main-content">
			{@render children()}
		</main>

		<BottomNav />
	</div>

	<!-- Global modals rendered at root level -->
	<SignInModal
		isOpen={signInModalState.isOpen}
		initialMode={signInModalState.initialMode}
		onClose={closeSignInModal}
	/>
	<DepositModal isOpen={depositModalState.isOpen} onClose={closeDepositModal} />
	<LazyWithdrawModal isOpen={withdrawModalState.isOpen} onClose={closeWithdrawModal} />

	<!-- PWA update prompt -->
	<ReloadPrompt />

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

	.skip-link {
		position: absolute;
		top: -100px;
		left: 0;
		background: var(--primary);
		color: var(--button-primary-text);
		padding: var(--spacing-3) var(--spacing-4);
		text-decoration: none;
		font-weight: var(--font-semibold);
		border-radius: 0 0 var(--radius-md) 0;
		z-index: var(--z-toast);
		transition: top var(--transition-fast);
	}

	.skip-link:focus {
		top: 0;
		outline: none;
		box-shadow: var(--focus-ring);
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
		padding-bottom: var(--space-xl); /* Prevent bottom content cutoff on mobile */
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

		.main-content {
			padding-bottom: var(--space-lg); /* Less padding on desktop without bottom nav */
		}
	}
</style>
