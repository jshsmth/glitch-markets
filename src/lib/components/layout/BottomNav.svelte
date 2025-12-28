<script lang="ts">
	import { page } from '$app/stores';
	import { preloadData } from '$app/navigation';
	import { onMount } from 'svelte';
	import HomeIcon from '$lib/components/icons/HomeIcon.svelte';
	import CompassIcon from '$lib/components/icons/CompassIcon.svelte';
	import MenuIcon from '$lib/components/icons/MenuIcon.svelte';
	import PokerChipIcon from '$lib/components/icons/PokerChipIcon.svelte';
	import UserIcon from '$lib/components/icons/UserIcon.svelte';
	import DollarCircleIcon from '$lib/components/icons/DollarCircleIcon.svelte';
	import SettingsIcon from '$lib/components/icons/SettingsIcon.svelte';
	import LogoutIcon from '$lib/components/icons/LogoutIcon.svelte';
	import LeaderboardIcon from '$lib/components/icons/LeaderboardIcon.svelte';
	import DocumentTextIcon from '$lib/components/icons/DocumentTextIcon.svelte';
	import { Logger } from '$lib/utils/logger';

	const log = Logger.forComponent('BottomNav');
	import LegalIcon from '$lib/components/icons/LegalIcon.svelte';
	import ElectricityIcon from '$lib/components/icons/ElectricityIcon.svelte';
	import MoonIcon from '$lib/components/icons/MoonIcon.svelte';
	import SunIcon from '$lib/components/icons/SunIcon.svelte';
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import { openDepositModal, openSignInModal } from '$lib/stores/modal.svelte';
	import { authState } from '$lib/stores/auth.svelte';
	import { themeState, toggleTheme } from '$lib/stores/theme.svelte';
	import { TIMEOUTS } from '$lib/config/constants';
	import { goto } from '$app/navigation';

	import type { Component } from 'svelte';

	type NavItemBase = {
		label: string;
		icon: Component;
	};

	type NavLinkItem = NavItemBase & {
		type: 'link';
		href: string;
		requiresAuth?: boolean;
	};

	type NavActionItem = NavItemBase & {
		type: 'action';
		action: 'more';
	};

	type NavItem = NavLinkItem | NavActionItem;

	const navItems: NavItem[] = [
		{
			type: 'link',
			label: 'Home',
			href: '/',
			icon: HomeIcon
		},
		{
			type: 'link',
			label: 'Discover',
			href: '/search',
			icon: CompassIcon
		},
		{
			type: 'link',
			label: 'Portfolio',
			href: '/portfolio',
			icon: PokerChipIcon,
			requiresAuth: true
		},
		{
			type: 'action',
			label: 'More',
			icon: MenuIcon,
			action: 'more'
		}
	];

	let moreMenuOpen = $state(false);

	function isActive(item: NavItem): boolean {
		if (item.type === 'action') {
			if (item.action === 'more') return moreMenuOpen;
			return false;
		}
		return $page.url.pathname === item.href;
	}

	function handleNavClick(event: MouseEvent, item: NavItem) {
		if (item.type === 'action') {
			event.preventDefault();
			if (item.action === 'more') {
				moreMenuOpen = true;
			}
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

	function handleSignIn() {
		moreMenuOpen = false;
		openSignInModal();
	}

	async function handleLogout() {
		const supabase = $page.data.supabase;
		if (!supabase) return;

		try {
			await supabase.auth.signOut();
			moreMenuOpen = false;
			goto('/');
		} catch (err) {
			log.error('Logout error', err);
		}
	}

	function handleThemeToggle() {
		toggleTheme();
	}

	function handleLeaderboardClick() {
		moreMenuOpen = false;
		goto('/leaderboard');
	}

	function handleSettingsClick() {
		moreMenuOpen = false;
		goto('/settings');
	}

	function closeMoreMenu() {
		moreMenuOpen = false;
	}

	onMount(() => {
		const currentPath = $page.url.pathname;
		const preloadRoutes = () => {
			navItems.forEach((item) => {
				if (item.type === 'link' && item.href !== currentPath) {
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
			href={item.type === 'link' ? item.href : '#'}
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

<!-- More Menu Sheet -->
<BottomSheet open={moreMenuOpen} title="More" onClose={closeMoreMenu}>
	<nav aria-label="More options">
		<ul class="menu-list" role="menu">
			{#if authState.user}
				<li>
					<button class="menu-item" role="menuitem" onclick={handleDeposit}>
						<DollarCircleIcon size={22} color="currentColor" />
						<span>Deposit</span>
					</button>
				</li>
			{/if}
			<li>
				<button class="menu-item" role="menuitem" onclick={handleLeaderboardClick}>
					<LeaderboardIcon size={22} color="currentColor" />
					<span>Leaderboard</span>
				</button>
			</li>
			<li>
				<button class="menu-item" role="menuitem" onclick={handleSettingsClick}>
					<SettingsIcon size={22} color="currentColor" />
					<span>Settings</span>
				</button>
			</li>
			<li>
				<button class="menu-item" role="menuitem" onclick={handleThemeToggle}>
					{#if themeState.current === 'dark'}
						<SunIcon size={22} color="currentColor" />
						<span>Light Mode</span>
					{:else}
						<MoonIcon size={22} color="currentColor" />
						<span>Dark Mode</span>
					{/if}
				</button>
			</li>
			<li class="menu-divider"></li>
			<li>
				<a
					href="https://docs.polymarket.com/quickstart/introduction/main"
					target="_blank"
					rel="noopener noreferrer"
					class="menu-item"
					role="menuitem"
				>
					<ElectricityIcon size={22} color="currentColor" />
					<span>APIs</span>
				</a>
			</li>
			<li>
				<a
					href="https://docs.polymarket.com/polymarket-learn/get-started/what-is-polymarket#introduction"
					target="_blank"
					rel="noopener noreferrer"
					class="menu-item"
					role="menuitem"
				>
					<DocumentTextIcon size={22} color="currentColor" />
					<span>Documentation</span>
				</a>
			</li>
			<li>
				<a
					href="https://polymarket.com/tos"
					target="_blank"
					rel="noopener noreferrer"
					class="menu-item"
					role="menuitem"
				>
					<LegalIcon size={22} color="currentColor" />
					<span>Terms of Use</span>
				</a>
			</li>
			{#if authState.user}
				<li class="menu-divider"></li>
				<li>
					<button class="menu-item menu-item-danger" role="menuitem" onclick={handleLogout}>
						<LogoutIcon size={22} color="currentColor" />
						<span>Sign Out</span>
					</button>
				</li>
			{:else}
				<li class="menu-divider"></li>
				<li>
					<button class="menu-item menu-item-primary" role="menuitem" onclick={handleSignIn}>
						<UserIcon size={22} color="currentColor" />
						<span>Sign In</span>
					</button>
				</li>
			{/if}
		</ul>
	</nav>
</BottomSheet>

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

	.menu-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1);
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		width: 100%;
		padding: var(--spacing-3) var(--spacing-4);
		background: transparent;
		border: none;
		border-radius: var(--radius-lg);
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--text-0);
		text-decoration: none;
		cursor: pointer;
		transition: var(--transition-fast);
	}

	.menu-item:hover {
		background: var(--bg-2);
	}

	.menu-item:active {
		background: var(--bg-3);
	}

	.menu-item-primary {
		background: var(--primary);
		color: var(--button-primary-text);
	}

	.menu-item-primary:hover {
		background: var(--primary-hover);
	}

	.menu-item-danger {
		color: var(--danger);
	}

	.menu-item-danger:hover {
		background: var(--danger-bg);
	}

	.menu-divider {
		height: 1px;
		background: var(--bg-3);
		margin: var(--spacing-2) 0;
		list-style: none;
	}
</style>
