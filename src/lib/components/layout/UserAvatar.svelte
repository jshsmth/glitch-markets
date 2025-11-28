<script lang="ts">
	import { authState } from '$lib/stores/auth.svelte';
	import { themeState, toggleTheme } from '$lib/stores/theme.svelte';
	import { authenticateWithSocial, logout } from '@dynamic-labs-sdk/client';
	import { browser } from '$app/environment';
	import MoonIcon from '$lib/components/icons/MoonIcon.svelte';
	import SunIcon from '$lib/components/icons/SunIcon.svelte';
	import ChevronDownIcon from '$lib/components/icons/ChevronDownIcon.svelte';

	interface Props {
		size?: number;
		hideChevron?: boolean;
	}

	let { size = 36, hideChevron = false }: Props = $props();

	/**
	 * Generate a consistent gradient based on user ID using brand colors
	 */
	function generateAvatarGradient(userId: string): string {
		// Brand color palette from design system
		const brandColors = [
			['#00d9ff', '#00aed9'], // Cyan gradient (primary)
			['#00d9ff', '#0083a3'], // Cyan to darker cyan
			['#33cfff', '#0083a3'], // Light cyan to dark cyan
			['#00c447', '#00d9ff'], // Success to cyan
			['#00d9ff', '#00c447'], // Cyan to success
			['#66dbff', '#00aed9'] // Light cyan to medium cyan
		];

		// Generate consistent hash from user ID
		let hash = 0;
		for (let i = 0; i < userId.length; i++) {
			hash = userId.charCodeAt(i) + ((hash << 5) - hash);
		}

		// Select gradient based on hash
		const gradientIndex = Math.abs(hash) % brandColors.length;
		const [color1, color2] = brandColors[gradientIndex];

		return `linear-gradient(135deg, ${color1}, ${color2})`;
	}

	let gradient = $derived(
		authState.user ? generateAvatarGradient(authState.user.id || 'default') : ''
	);
	let showDropdown = $state(false);

	async function handleSignIn() {
		if (!browser) return;

		try {
			const redirectUrl = window.location.origin + window.location.pathname;
			await authenticateWithSocial({
				provider: 'google',
				redirectUrl
			});
		} catch (err) {
			console.error('Sign in error:', err);
		}
	}

	function handleAvatarClick() {
		if (authState.user) {
			showDropdown = !showDropdown;
		}
	}

	async function handleLogout() {
		if (!authState.client) return;

		try {
			await logout(authState.client);
			showDropdown = false;
		} catch (err) {
			console.error('Logout error:', err);
		}
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.avatar-container')) {
			showDropdown = false;
		}
	}

	function handleThemeToggle() {
		toggleTheme();
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="avatar-container" style="--size: {size}px">
	{#if authState.isInitializing}
		<!-- Skeleton placeholder to prevent flash -->
		<div class="avatar-skeleton"></div>
	{:else if authState.user}
		<button class="avatar-button" onclick={handleAvatarClick} aria-label="Account menu">
			<div class="avatar" style="background: {gradient}"></div>
			{#if !hideChevron}
				<ChevronDownIcon size={16} color="var(--text-2)" />
			{/if}
		</button>

		{#if showDropdown}
			<div class="dropdown">
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
				<button class="dropdown-item" onclick={handleLogout}>Logout</button>
			</div>
		{/if}
	{:else}
		<button class="sign-in-button" onclick={handleSignIn} aria-label="Sign in">Sign In</button>
	{/if}
</div>

<style>
	.avatar-container {
		position: relative;
		display: inline-block;
	}

	.avatar-skeleton {
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		background-color: var(--bg-3);
		opacity: 0.5;
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
		background-color: var(--bg-2);
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

	.sign-in-button {
		background-color: var(--bg-2);
		color: var(--text-0);
		border: 1px solid var(--bg-4);
		padding: 8px 16px;
		border-radius: 6px;
		font-weight: 600;
		font-size: 14px;
		cursor: pointer;
		transition:
			background-color 0.2s,
			border-color 0.2s;
		white-space: nowrap;
	}

	.sign-in-button:hover {
		background-color: var(--bg-3);
		border-color: var(--primary);
	}

	.sign-in-button:active {
		transform: scale(0.98);
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		background-color: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		min-width: 160px;
		z-index: 1001;
		overflow: hidden;
	}

	.dropdown-item {
		width: 100%;
		padding: 12px 16px;
		background: none;
		border: none;
		color: var(--text-0);
		text-align: left;
		cursor: pointer;
		font-size: 14px;
		transition: background-color 0.15s;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.dropdown-item-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.dropdown-item:hover {
		background-color: var(--bg-2);
	}

	.dropdown-item:active {
		background-color: var(--bg-3);
	}
</style>
