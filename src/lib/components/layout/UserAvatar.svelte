<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { authState } from '$lib/stores/auth.svelte';
	import { walletState } from '$lib/stores/wallet.svelte';
	import { themeState, toggleTheme } from '$lib/stores/theme.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import MoonIcon from '$lib/components/icons/MoonIcon.svelte';
	import SunIcon from '$lib/components/icons/SunIcon.svelte';
	import ChevronDownIcon from '$lib/components/icons/ChevronDownIcon.svelte';
	import SettingsIcon from '$lib/components/icons/SettingsIcon.svelte';
	import LeaderboardIcon from '$lib/components/icons/LeaderboardIcon.svelte';
	import CopyIcon from '$lib/components/icons/CopyIcon.svelte';
	import DocumentTextIcon from '$lib/components/icons/DocumentTextIcon.svelte';
	import LegalIcon from '$lib/components/icons/LegalIcon.svelte';
	import ElectricityIcon from '$lib/components/icons/ElectricityIcon.svelte';
	import LogoutIcon from '$lib/components/icons/LogoutIcon.svelte';
	import { openSignInModal } from '$lib/stores/modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		size?: number;
		hideChevron?: boolean;
	}

	let { size = 36, hideChevron = false }: Props = $props();

	const avatarGradient = 'linear-gradient(135deg, var(--gold-light) 0%, var(--gold-base) 100%)';
	let showDropdown = $state(false);
	let closeTimeout: ReturnType<typeof setTimeout> | null = null;
	let windowWidth = $state(1024);

	let isMobile = $derived(windowWidth <= 767);

	onMount(() => {
		windowWidth = window.innerWidth;

		const handleResize = () => {
			windowWidth = window.innerWidth;
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	onDestroy(() => {
		if (closeTimeout) {
			clearTimeout(closeTimeout);
			closeTimeout = null;
		}
	});

	function handleAvatarClick() {
		if (authState.user && isMobile) {
			showDropdown = !showDropdown;
		}
	}

	function handleAvatarMouseEnter() {
		if (!isMobile && authState.user) {
			if (closeTimeout) {
				clearTimeout(closeTimeout);
				closeTimeout = null;
			}
			showDropdown = true;
		}
	}

	function handleAvatarMouseLeave() {
		if (!isMobile) {
			closeTimeout = setTimeout(() => {
				showDropdown = false;
			}, 150);
		}
	}

	function handleDropdownMouseEnter() {
		if (!isMobile && closeTimeout) {
			clearTimeout(closeTimeout);
			closeTimeout = null;
		}
	}

	function handleDropdownMouseLeave() {
		if (!isMobile) {
			closeTimeout = setTimeout(() => {
				showDropdown = false;
			}, 150);
		}
	}

	async function handleLogout() {
		const supabase = $page.data.supabase;
		if (!supabase) return;

		try {
			await supabase.auth.signOut();
			showDropdown = false;
			goto('/');
		} catch (err) {
			console.error('Logout error:', err);
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (isMobile) {
			const target = event.target as HTMLElement;
			if (!target.closest('.avatar-container')) {
				showDropdown = false;
			}
		}
	}

	function handleThemeToggle() {
		toggleTheme();
	}

	async function handleCopyAddress() {
		const address = walletState.serverWalletAddress;
		if (!address) return;

		try {
			await navigator.clipboard.writeText(address);
		} catch (err) {
			console.error('Failed to copy address:', err);
		}
	}

	function handleLeaderboardClick() {
		showDropdown = false;
		goto('/leaderboard');
	}

	function handleSettingsClick() {
		showDropdown = false;
		goto('/settings');
	}

	function formatAddress(address: string): string {
		if (!address) return '';
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="avatar-container" style="--size: {size}px">
	{#if authState.isInitializing}
		<div class="skeleton avatar-skeleton"></div>
	{:else if authState.user}
		<button
			class="avatar-button"
			onclick={handleAvatarClick}
			onmouseenter={handleAvatarMouseEnter}
			onmouseleave={handleAvatarMouseLeave}
			aria-label="Account menu"
			aria-expanded={showDropdown}
		>
			<div class="avatar" style="background: {avatarGradient}"></div>
			{#if !hideChevron}
				<ChevronDownIcon size={16} color="var(--text-2)" />
			{/if}
		</button>

		{#if showDropdown}
			<div
				class="dropdown"
				role="menu"
				tabindex="-1"
				onmouseenter={handleDropdownMouseEnter}
				onmouseleave={handleDropdownMouseLeave}
			>
				<div class="dropdown-header">
					<div class="header-avatar" style="background: {avatarGradient}"></div>
					<div class="header-info">
						{#if walletState.isLoading}
							<div class="wallet-skeleton"></div>
						{:else if walletState.serverWalletAddress}
							<div class="header-address">
								<span class="address-text">{formatAddress(walletState.serverWalletAddress)}</span>
								<button
									class="copy-button"
									onclick={handleCopyAddress}
									aria-label="Copy wallet address"
								>
									<CopyIcon size={16} color="var(--text-2)" />
								</button>
							</div>
							{#if walletState.isRegistered}
								<div class="header-subtext ready-badge">Ready to Trade</div>
							{/if}
						{/if}
					</div>
					<button class="settings-button" onclick={handleSettingsClick} aria-label="Settings">
						<SettingsIcon size={20} color="var(--text-2)" />
					</button>
				</div>

				<div class="dropdown-divider"></div>

				<button class="dropdown-item" onclick={handleLeaderboardClick}>
					<span class="dropdown-item-icon">
						<LeaderboardIcon size={18} color="currentColor" />
					</span>
					<span>Leaderboard</span>
				</button>

				<a
					href="https://docs.polymarket.com/quickstart/introduction/main"
					target="_blank"
					rel="noopener noreferrer"
					class="dropdown-item"
					onclick={() => (showDropdown = false)}
				>
					<span class="dropdown-item-icon">
						<ElectricityIcon size={18} color="currentColor" />
					</span>
					<span>APIs</span>
				</a>

				<button class="dropdown-item" onclick={handleThemeToggle}>
					<span class="dropdown-item-icon">
						{#if themeState.current === 'dark'}
							<SunIcon size={18} color="currentColor" />
						{:else}
							<MoonIcon size={18} color="currentColor" />
						{/if}
					</span>
					<span>{themeState.current === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
				</button>

				<div class="dropdown-divider"></div>

				<a
					href="https://docs.polymarket.com/polymarket-learn/get-started/what-is-polymarket#introduction"
					target="_blank"
					rel="noopener noreferrer"
					class="dropdown-item"
					onclick={() => (showDropdown = false)}
				>
					<span class="dropdown-item-icon">
						<DocumentTextIcon size={18} color="currentColor" />
					</span>
					<span>Documentation</span>
				</a>

				<a
					href="https://polymarket.com/tos"
					target="_blank"
					rel="noopener noreferrer"
					class="dropdown-item"
					onclick={() => (showDropdown = false)}
				>
					<span class="dropdown-item-icon">
						<LegalIcon size={18} color="currentColor" />
					</span>
					<span>Terms of Use</span>
				</a>

				<button class="dropdown-item logout-item" onclick={handleLogout}>
					<span class="dropdown-item-icon">
						<LogoutIcon size={18} color="currentColor" />
					</span>
					<span>Logout</span>
				</button>
			</div>
		{/if}
	{:else}
		<div class="auth-buttons">
			<Button
				variant="tertiary"
				size="small"
				onclick={() => openSignInModal('signin')}
				aria-label="Log in"
			>
				Log In
			</Button>
			<Button
				variant="primary"
				size="small"
				onclick={() => openSignInModal('signup')}
				aria-label="Sign up"
			>
				Sign Up
			</Button>
		</div>
	{/if}
</div>

<style>
	@import '$lib/styles/skeleton.css';

	.avatar-container {
		position: relative;
		display: inline-block;
	}

	.avatar-skeleton {
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		flex-shrink: 0;
	}

	.avatar-button {
		display: flex;
		align-items: center;
		gap: 4px;
		background: none;
		border: none;
		padding: 4px 6px 4px 4px;
		border-radius: 24px;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			transform 0.15s ease;
	}

	.avatar-button:hover {
		background-color: var(--primary-hover-bg);
	}

	.avatar-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.avatar-button:active {
		transform: scale(0.98);
	}

	.avatar {
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.auth-buttons {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		background-color: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: 12px;
		box-shadow: var(--shadow-md);
		min-width: 280px;
		z-index: var(--z-popover);
		overflow: hidden;
		padding: 12px;
		animation: dropdown-appear 0.12s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes dropdown-appear {
		from {
			opacity: 0;
			transform: translateY(-4px) scale(0.97);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.dropdown-item {
		width: 100%;
		padding: 10px 12px;
		background: none;
		border: none;
		border-radius: 8px;
		color: var(--text-0);
		text-align: left;
		cursor: pointer;
		font-size: 14px;
		font-weight: 500;
		transition: all 0.1s ease;
		display: flex;
		align-items: center;
		gap: 12px;
		text-decoration: none;
	}

	.dropdown-item-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		color: var(--text-1);
		transition: color 0.1s ease;
	}

	.dropdown-item:hover {
		background-color: var(--primary-hover-bg);
	}

	.dropdown-item:hover .dropdown-item-icon {
		color: var(--primary);
	}

	.dropdown-item:active {
		background-color: var(--primary-hover-bg-medium);
		transform: scale(0.98);
	}

	.dropdown-item:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.logout-item {
		color: var(--error);
	}

	.logout-item:hover {
		background-color: rgba(255, 59, 48, 0.1);
	}

	.logout-item:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring); /* Primary focus ring on red item */
	}

	.dropdown-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 4px;
		margin-bottom: 4px;
	}

	.header-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.header-info {
		flex: 1;
		min-width: 0;
	}

	.header-address {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 8px;
		background-color: var(--bg-2);
		border: 1px solid transparent;
		border-radius: 6px;
		transition: all 0.15s ease;
	}

	.header-address:hover {
		background-color: var(--primary-hover-bg);
		border-color: rgba(var(--primary-rgb), 0.2);
	}

	.address-text {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-0);
		font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
	}

	.copy-button {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 4px;
		cursor: pointer;
		border-radius: 4px;
		transition: background-color 0.15s ease;
		flex-shrink: 0;
	}

	.copy-button:hover {
		background-color: var(--primary-hover-bg);
		color: var(--primary);
	}

	.copy-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.copy-button:active {
		transform: scale(0.95);
	}

	.settings-button {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 8px;
		cursor: pointer;
		border-radius: 8px;
		transition: background-color 0.15s ease;
		flex-shrink: 0;
	}

	.settings-button:hover {
		background-color: var(--primary-hover-bg);
		color: var(--primary);
	}

	.settings-button:active {
		transform: scale(0.95);
	}

	.settings-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.dropdown-divider {
		height: 1px;
		background-color: var(--bg-4);
		margin: 8px 0;
	}

	.wallet-skeleton {
		width: 120px;
		height: 40px;
		border-radius: 8px;
		background: linear-gradient(90deg, var(--bg-2) 0%, var(--bg-3) 50%, var(--bg-2) 100%);
		background-size: 200% 100%;
		animation: shimmer 2.5s ease-in-out infinite;
	}

	.header-subtext {
		font-size: 11px;
		color: var(--text-3);
		padding: 4px 8px 0 8px;
		font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
	}

	.ready-badge {
		color: var(--success);
		font-weight: 600;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}
</style>
