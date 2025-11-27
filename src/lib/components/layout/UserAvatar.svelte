<script lang="ts">
	import { authState } from '$lib/stores/auth.svelte';
	import { themeState, toggleTheme } from '$lib/stores/theme.svelte';
	import { authenticateWithSocial, logout } from '@dynamic-labs-sdk/client';
	import { browser } from '$app/environment';
	import MoonIcon from '$lib/components/icons/MoonIcon.svelte';
	import SunIcon from '$lib/components/icons/SunIcon.svelte';

	interface Props {
		size?: number;
	}

	let { size = 36 }: Props = $props();

	/**
	 * Generate a consistent gradient based on user ID
	 */
	function generateAvatarGradient(userId: string): string {
		// Simple hash function
		let hash = 0;
		for (let i = 0; i < userId.length; i++) {
			hash = userId.charCodeAt(i) + ((hash << 5) - hash);
		}

		// Generate two hue values
		const hue1 = Math.abs(hash % 360);
		const hue2 = Math.abs((hash * 2) % 360);

		// Create gradient with vibrant, saturated colors
		return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 60%))`;
	}

	/**
	 * Get user initials from email or ID
	 */
	function getUserInitials(user: typeof authState.user): string {
		if (!user) return '';

		// Try to get initials from email
		if (user.email) {
			const parts = user.email.split('@')[0].split('.');
			if (parts.length >= 2) {
				return (parts[0][0] + parts[1][0]).toUpperCase();
			}
			return user.email.substring(0, 2).toUpperCase();
		}

		// Fallback to user ID
		if (user.id) {
			return user.id.substring(0, 2).toUpperCase();
		}

		return 'GM'; // Glitch Markets
	}

	let gradient = $derived(
		authState.user ? generateAvatarGradient(authState.user.id || 'default') : ''
	);
	let initials = $derived(getUserInitials(authState.user));
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

	// Close dropdown when clicking outside
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
	{#if authState.user}
		<button
			class="avatar"
			style="background: {gradient}"
			onclick={handleAvatarClick}
			aria-label="Account menu"
		>
			<span class="initials">{initials}</span>
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

	.avatar {
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: transform 0.15s ease;
	}

	.avatar:hover {
		transform: scale(1.05);
	}

	.avatar:active {
		transform: scale(0.95);
	}

	.initials {
		color: #ffffff;
		font-weight: 600;
		font-size: calc(var(--size) * 0.4);
		text-transform: uppercase;
		user-select: none;
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
