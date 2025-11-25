<script lang="ts">
	/**
	 * Polymarket Authorization Component
	 * Registers server wallet with Polymarket for automated trading
	 */
	import { isSignedIn } from '@dynamic-labs-sdk/client';
	import { authState, isAuthenticated } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';

	const authenticated = $derived(isAuthenticated());

	let isRegistering = $state(false);
	let isRegistered = $state(false);
	let error = $state<string | null>(null);

	/**
	 * Check if user is already registered with Polymarket
	 */
	async function checkRegistration() {
		if (!authState.client || !isSignedIn(authState.client)) {
			return;
		}

		try {
			const response = await fetch('/api/polymarket/status', {
				headers: {
					Authorization: `Bearer ${authState.client.token}`
				}
			});

			if (response.ok) {
				const data = await response.json();
				isRegistered = data.registered;
			}
		} catch (err) {
			console.error('Failed to check registration status:', err);
		}
	}

	/**
	 * Register with Polymarket
	 * Backend signs with server wallet and registers with CLOB
	 */
	async function registerWithPolymarket() {
		if (!authState.client) {
			error = 'Authentication required';
			return;
		}

		isRegistering = true;
		error = null;

		try {
			const response = await fetch('/api/polymarket/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${authState.client.token}`
				}
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Registration failed');
			}

			const data = await response.json();
			if (dev) {
				console.log('Polymarket registration successful', {
					proxyWalletAddress: data.proxyWalletAddress
				});
			}

			isRegistered = true;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Registration failed';
			console.error('Polymarket registration error:', err);
		} finally {
			isRegistering = false;
		}
	}

	onMount(() => {
		if (authenticated) {
			checkRegistration();
		}
	});

	$effect(() => {
		if (authenticated) {
			checkRegistration();
		}
	});
</script>

<div class="polymarket-auth">
	{#if isRegistered}
		<div class="success">
			<svg
				width="20"
				height="20"
				viewBox="0 0 20 20"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z"
					fill="currentColor"
				/>
			</svg>
			<span>Ready to trade on Polymarket</span>
		</div>
	{:else}
		<button class="enable-trading-btn" onclick={registerWithPolymarket} disabled={isRegistering}>
			{isRegistering ? 'Enabling Trading...' : 'Enable Polymarket Trading'}
		</button>
		<p class="info-text">
			Registers your server wallet with Polymarket for automated trading. Your credentials are
			encrypted and stored securely.
		</p>
	{/if}

	{#if error}
		<div class="error">{error}</div>
	{/if}
</div>

<style>
	.polymarket-auth {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background-color: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: 0.5rem;
	}

	.success {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: var(--success-bg, #efe);
		color: var(--success-text, #0a0);
		border-radius: 0.375rem;
		font-weight: 500;
	}

	.enable-trading-btn {
		width: 100%;
		padding: 0.875rem 1.5rem;
		background-color: var(--primary);
		color: var(--text-0);
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.enable-trading-btn:hover:not(:disabled) {
		background-color: var(--primary-hover);
	}

	.enable-trading-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.info-text {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-2);
		line-height: 1.4;
	}

	.error {
		padding: 0.75rem;
		background-color: var(--error-bg, #fee);
		color: var(--error-text, #c00);
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}
</style>
