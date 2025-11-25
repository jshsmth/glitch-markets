<script lang="ts">
	/**
	 * Authentication button component
	 * Shows social login buttons or user info based on auth state
	 */
	import { logout } from '@dynamic-labs-sdk/client';
	import { authState } from '$lib/stores/auth.svelte';
	import SocialLoginButton from './SocialLoginButton.svelte';

	// Derive authenticated state directly from authState.user for better performance
	const authenticated = $derived(!!authState.user);

	/**
	 * Handle logout button click
	 */
	async function handleLogout() {
		if (!authState.client) return;

		try {
			await logout(authState.client);
		} catch (err) {
			console.error('Logout error:', err);
		}
	}
</script>

<div class="auth-button-container">
	{#if authState.isInitializing}
		<div class="auth-loading">
			<div class="loading-skeleton"></div>
		</div>
	{:else if authenticated && authState.user}
		<div class="user-info">
			<div class="user-details">
				<span class="user-name">
					{authState.user.email || authState.user.verifiedCredentials?.[0]?.address || 'User'}
				</span>
			</div>
			<button class="logout-btn" onclick={handleLogout}> Logout </button>
		</div>
	{:else}
		<div class="login-options">
			<p class="login-prompt">Sign in to continue</p>
			<div class="social-buttons">
				<SocialLoginButton provider="google" />
				<SocialLoginButton provider="twitter" />
			</div>
		</div>
	{/if}
</div>

<style>
	.auth-button-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background-color: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: 0.5rem;
	}

	.user-details {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.user-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-0);
	}

	.logout-btn {
		background-color: var(--bg-3);
		color: var(--text-0);
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.logout-btn:hover {
		background-color: var(--bg-4);
	}

	.login-options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.login-prompt {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-2);
		text-align: center;
	}

	.social-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.auth-loading {
		padding: 0.75rem 1rem;
		background-color: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: 0.5rem;
	}

	.loading-skeleton {
		height: 2rem;
		background: linear-gradient(90deg, var(--bg-2) 25%, var(--bg-3) 50%, var(--bg-2) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 0.375rem;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
