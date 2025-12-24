<script lang="ts">
	import '$lib/styles/colors.css';
	import '$lib/styles/app.css';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { createQueryClient } from '$lib/query/client';
	import {
		initializeAuth,
		updateAuthState,
		refreshProfile,
		authState
	} from '$lib/stores/auth.svelte';
	import { initializeTheme } from '$lib/stores/theme.svelte';
	import {
		initializeWalletSync,
		initializeWalletFromProfile,
		walletState
	} from '$lib/stores/wallet.svelte';
	import { initializeBalanceSync } from '$lib/stores/balance.svelte';
	import {
		initializeWatchlist,
		clearWatchlist,
		setQueryClient
	} from '$lib/stores/watchlist.svelte';
	import { migrateLocalStorageBookmarks, shouldOfferMigration } from '$lib/utils/migrate-bookmarks';
	import {
		signInModalState,
		closeSignInModal,
		depositModalState,
		closeDepositModal,
		withdrawModalState,
		closeWithdrawModal
	} from '$lib/stores/modal.svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import TopHeader from '$lib/components/layout/TopHeader.svelte';
	import BottomNav from '$lib/components/layout/BottomNav.svelte';
	import SignInModal from '$lib/components/auth/SignInModal.svelte';
	import DepositModal from '$lib/components/wallet/DepositModal.svelte';
	import LazyWithdrawModal from '$lib/components/modals/LazyWithdrawModal.svelte';
	import ReloadPrompt from '$lib/components/pwa/ReloadPrompt.svelte';
	// @ts-expect-error - virtual module from vite-plugin-pwa
	import { pwaInfo } from 'virtual:pwa-info';

	injectAnalytics({ mode: dev ? 'development' : 'production' });

	let { children, data } = $props();

	const queryClient = $derived(data?.queryClient || createQueryClient());
	const supabase = $derived(data?.supabase);

	$effect(() => {
		if (browser) {
			initializeAuth(data?.session);
			initializeWalletFromProfile(data?.profile ?? null);
		}
	});

	onMount(() => {
		initializeTheme();
		setQueryClient(queryClient);

		const cleanupWalletSync = initializeWalletSync();
		const cleanupBalanceSync = initializeBalanceSync(queryClient);

		// Only call registration if user has session but no server wallet
		if (data?.session?.user && !data?.profile?.serverWalletAddress) {
			handleUserSignIn();
		}

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange(async (_event, session) => {
			updateAuthState(session);

			if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
				await invalidate('supabase:auth');
			}

			if (session?.user && (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED')) {
				if (!walletState.serverWalletAddress && !data?.profile?.serverWalletAddress) {
					handleUserSignIn();
				}
			}
		});

		return () => {
			subscription.unsubscribe();
			cleanupWalletSync();
			cleanupBalanceSync();
		};
	});

	$effect(() => {
		if (browser && authState.user) {
			initializeWatchlist();

			if (shouldOfferMigration()) {
				migrateLocalStorageBookmarks().then((result) => {
					if (result.migrated > 0) {
						console.log(`Migrated ${result.migrated} bookmarks to database`);
					}
				});
			}

			if ('requestIdleCallback' in window) {
				requestIdleCallback(
					() => {
						fetch('/api/bridge/supported-assets')
							.then((r) => r.json())
							.catch(() => {});
					},
					{ timeout: 2000 }
				);
			} else {
				setTimeout(() => {
					fetch('/api/bridge/supported-assets')
						.then((r) => r.json())
						.catch(() => {});
				}, 1000);
			}
		} else if (browser) {
			clearWatchlist();
		}
	});

	async function handleUserSignIn() {
		try {
			const response = await fetch('/api/auth/register', { method: 'POST' });

			if (!response.ok) {
				return;
			}

			refreshProfile();
		} catch {
			// Silent fail - user can still use the app
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
