<script lang="ts">
	import { page } from '$app/stores';
	import { preloadData } from '$app/navigation';
	import { onMount } from 'svelte';
	import HomeIcon from '$lib/components/icons/HomeIcon.svelte';
	import CompassIcon from '$lib/components/icons/CompassIcon.svelte';
	import PokerChipIcon from '$lib/components/icons/PokerChipIcon.svelte';
	import LeaderboardIcon from '$lib/components/icons/LeaderboardIcon.svelte';
	import { openSignInModal } from '$lib/stores/modal.svelte';
	import { authState } from '$lib/stores/auth.svelte';
	import { TIMEOUTS } from '$lib/config/constants';

	import type { Component } from 'svelte';

	type NavItem = {
		label: string;
		href: string;
		icon: Component;
		requiresAuth?: boolean;
	};

	const navItems: NavItem[] = [
		{
			label: 'Home',
			href: '/',
			icon: HomeIcon
		},
		{
			label: 'Discover',
			href: '/search',
			icon: CompassIcon
		},
		{
			label: 'Portfolio',
			href: '/portfolio',
			icon: PokerChipIcon,
			requiresAuth: true
		},
		{
			label: 'Leaderboard',
			href: '/leaderboard',
			icon: LeaderboardIcon
		}
	];

	function isActive(item: NavItem): boolean {
		return $page.url.pathname === item.href;
	}

	function handleNavClick(event: MouseEvent, item: NavItem) {
		if (item.requiresAuth && !authState.user) {
			event.preventDefault();
			openSignInModal();
		}
	}

	onMount(() => {
		const currentPath = $page.url.pathname;
		const preloadRoutes = () => {
			navItems.forEach((item) => {
				if (item.href !== currentPath) {
					preloadData(item.href).catch(() => {});
				}
			});
		};

		if ('requestIdleCallback' in window) {
			requestIdleCallback(preloadRoutes, { timeout: TIMEOUTS.IDLE_CALLBACK_SHORT });
		} else {
			setTimeout(preloadRoutes, TIMEOUTS.SDK_INIT_FALLBACK);
		}
	});
</script>

<nav class="bottom-nav" aria-label="Main navigation">
	{#each navItems as item (item.label)}
		{@const Icon = item.icon}
		<a
			href={item.href}
			class="nav-item"
			class:active={isActive(item)}
			aria-current={isActive(item) ? 'page' : undefined}
			aria-label={item.label}
			onclick={(e) => handleNavClick(e, item)}
			data-sveltekit-preload-data="tap"
			data-sveltekit-noscroll
		>
			<span class="nav-icon">
				<Icon size={22} color="currentColor" />
			</span>
			<span class="nav-label">{item.label}</span>
		</a>
	{/each}
</nav>

<style>
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: calc(var(--target-large) + env(safe-area-inset-bottom, 0px));
		background-color: var(--bg-1);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-top: 1px solid var(--bg-4);
		display: flex;
		justify-content: space-around;
		align-items: flex-start;
		padding: 0 var(--spacing-2);
		padding-top: 6px;
		padding-bottom: env(safe-area-inset-bottom, 8px);
		z-index: var(--z-bottom-nav);
	}

	.nav-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-1);
		padding: var(--spacing-2) var(--spacing-1);
		min-height: var(--target-comfortable); /* WCAG 2.1 AA */
		min-width: var(--target-comfortable);
		color: var(--text-2); /* Better contrast than text-3 */
		text-decoration: none;
		border-radius: var(--radius-md);
		transition:
			var(--transition-colors),
			transform var(--transition-fast);
		cursor: pointer;
	}

	.nav-item:hover {
		background-color: var(--bg-2);
	}

	.nav-item:active {
		transform: scale(0.95);
	}

	.nav-item.active {
		color: var(--primary);
	}

	.nav-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.nav-label {
		font-size: var(--text-xs);
		font-weight: var(--font-semibold);
		white-space: nowrap;
		line-height: 1;
		letter-spacing: var(--tracking-wide);
	}

	@media (min-width: 768px) {
		.bottom-nav {
			display: none;
		}
	}

	@media (min-width: 414px) and (max-width: 767px) {
		.bottom-nav {
			height: calc(68px + env(safe-area-inset-bottom, 0px));
		}

		.nav-icon {
			font-size: 22px;
		}

		.nav-label {
			font-size: 12px;
		}
	}
</style>
