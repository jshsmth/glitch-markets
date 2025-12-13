<script lang="ts">
	import { page } from '$app/stores';
	import { preloadData } from '$app/navigation';
	import { untrack } from 'svelte';
	import HomeIcon from '$lib/components/icons/HomeIcon.svelte';
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte';
	import PokerChipIcon from '$lib/components/icons/PokerChipIcon.svelte';
	import MenuIcon from '$lib/components/icons/MenuIcon.svelte';
	import DollarCircleIcon from '$lib/components/icons/DollarCircleIcon.svelte';
	import SettingsIcon from '$lib/components/icons/SettingsIcon.svelte';
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import { openDepositModal, openSignInModal } from '$lib/stores/modal.svelte';
	import { authState } from '$lib/stores/auth.svelte';
	import { TIMEOUTS } from '$lib/config/constants';

	import type { Component } from 'svelte';

	interface NavItem {
		label: string;
		href: string;
		icon: Component;
		isMore?: boolean;
		requiresAuth?: boolean;
	}

	const navItems: NavItem[] = [
		{
			label: 'Home',
			href: '/',
			icon: HomeIcon
		},
		{
			label: 'Search',
			href: '/search',
			icon: SearchIcon
		},
		{
			label: 'Portfolio',
			href: '/portfolio',
			icon: PokerChipIcon,
			requiresAuth: true
		},
		{
			label: 'More',
			href: '#',
			icon: MenuIcon,
			isMore: true
		}
	];

	let moreMenuOpen = $state(false);

	function isActive(href: string): boolean {
		if (href === '#') return false;
		return $page.url.pathname === href;
	}

	function handleNavClick(event: MouseEvent, item: NavItem) {
		if (item.isMore) {
			event.preventDefault();
			moreMenuOpen = true;
			return;
		}

		if (item.requiresAuth && !authState.user) {
			event.preventDefault();
			openSignInModal();
		}
	}

	function handleDeposit() {
		moreMenuOpen = false;
		openDepositModal();
	}

	function closeMoreMenu() {
		moreMenuOpen = false;
	}

	let hasPreloaded = $state(false);
	$effect(() => {
		if (untrack(() => hasPreloaded)) return;
		hasPreloaded = true;

		const currentPath = $page.url.pathname;
		const preloadRoutes = () => {
			navItems.forEach((item) => {
				if (!item.isMore && item.href !== currentPath) {
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
			class:active={isActive(item.href) || (item.isMore && moreMenuOpen)}
			aria-current={isActive(item.href) ? 'page' : undefined}
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

<BottomSheet open={moreMenuOpen} title="More" onClose={closeMoreMenu}>
	<nav aria-label="More options">
		<ul class="menu-list" role="menu">
			<li role="menuitem">
				<button class="menu-item" onclick={handleDeposit}>
					<DollarCircleIcon size={22} color="currentColor" />
					<span>Deposit</span>
				</button>
			</li>
			<li role="menuitem">
				<a href="/settings" class="menu-item" onclick={closeMoreMenu}>
					<SettingsIcon size={22} color="currentColor" />
					<span>Settings</span>
				</a>
			</li>
		</ul>
	</nav>
</BottomSheet>

<style>
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: calc(var(--target-large) + env(safe-area-inset-bottom, 0px)); /* 64px + safe area */
		background-color: var(--bg-1);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-top: 1px solid var(--bg-4);
		display: flex;
		justify-content: space-around;
		align-items: flex-start;
		padding: 0 var(--spacing-2); /* 8px */
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
		gap: var(--spacing-1); /* 4px - tight spacing for icon+label pair */
		padding: var(--spacing-2) var(--spacing-1); /* 8px 4px */
		min-height: var(--target-comfortable); /* 44px - WCAG 2.1 AA */
		min-width: var(--target-comfortable);
		color: var(--text-2); /* Better contrast than text-3 (Principle #9) */
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

	/* Hide bottom nav on desktop */
	@media (min-width: 768px) {
		.bottom-nav {
			display: none;
		}
	}

	/* Tablet size - slightly larger */
	@media (min-width: 375px) and (max-width: 767px) {
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

	/* More menu styles */
	.menu-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 14px 16px;
		background: transparent;
		border: none;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 500;
		color: var(--text-0);
		text-decoration: none;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.menu-item:hover {
		background: var(--bg-2);
	}

	.menu-item:active {
		background: var(--bg-3);
	}
</style>
