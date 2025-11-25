<script lang="ts">
	/**
	 * User Registration Flow Component
	 * Automatically registers user in our database after Dynamic authentication
	 */
	import { isSignedIn } from '@dynamic-labs-sdk/client';
	import { authState } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';

	const authenticated = $derived(!!authState.user);

	interface RegisteredUser {
		userId: string;
		email?: string;
		serverWalletAddress?: string;
		hasServerWallet?: boolean;
	}

	let isRegistering = $state(false);
	let isRegistered = $state(false);
	let error = $state<string | null>(null);
	let registeredUser = $state<RegisteredUser | null>(null);
	// Use SvelteSet to track registration attempts and prevent race conditions
	let registrationAttempts = $state(new Set<string>());

	/**
	 * Register user in our database
	 * Called automatically when user authenticates with Dynamic
	 */
	async function registerUser() {
		if (!authState.client) {
			return;
		}

		if (!isSignedIn(authState.client)) {
			return;
		}

		const currentUserId = authState.client.user?.id;

		// Check if already registered or registration in progress
		if (!currentUserId || registrationAttempts.has(currentUserId) || isRegistering) {
			return;
		}

		// Mark this user ID as having a registration attempt
		registrationAttempts.add(currentUserId);
		isRegistering = true;
		error = null;

		try {
			const response = await fetch('/api/auth/register', {
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
			isRegistered = true;
			registeredUser = data.user;
			if (dev) {
				console.log('User registered successfully:', data.user);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to register user';
			console.error('User registration error:', err);
		} finally {
			isRegistering = false;
		}
	}

	onMount(() => {
		if (authenticated) {
			registerUser();
		}
	});

	$effect(() => {
		if (authenticated) {
			registerUser();
		}
	});
</script>

{#if isRegistering}
	<div class="registration-status">
		<p>Registering user...</p>
	</div>
{:else if isRegistered && registeredUser}
	<div class="registration-success">
		<h3>✓ User Registered</h3>
		<dl>
			<dt>User ID:</dt>
			<dd class="mono">{registeredUser.userId}</dd>

			{#if registeredUser.email}
				<dt>Email:</dt>
				<dd>{registeredUser.email}</dd>
			{/if}

			<dt>Server Wallet Address:</dt>
			<dd class="mono">
				{#if registeredUser.serverWalletAddress}
					{registeredUser.serverWalletAddress}
				{:else if registeredUser.hasServerWallet === false}
					<span class="pending">Creating server wallet...</span>
				{:else}
					<span class="pending">N/A</span>
				{/if}
			</dd>
		</dl>
	</div>
{:else if error}
	<div class="registration-error">
		<h3>Registration Error</h3>
		<p>{error}</p>
		<button onclick={registerUser} disabled={isRegistering}>
			{isRegistering ? 'Retrying...' : 'Try Again'}
		</button>
	</div>
{/if}

<style>
	.registration-status {
		padding: 1rem;
		background-color: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: 0.5rem;
		margin: 1rem 0;
		text-align: center;
	}

	.registration-status p {
		margin: 0;
		color: var(--text-1);
		font-size: 0.875rem;
	}

	.registration-success {
		padding: 1rem;
		background-color: var(--success-bg, #efe);
		border: 1px solid var(--success-border, #aea);
		border-radius: 0.5rem;
		margin: 1rem 0;
	}

	.registration-success h3 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		color: var(--success-text, #0a0);
	}

	.registration-success dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.5rem 1rem;
		margin: 0;
	}

	.registration-success dt {
		font-weight: 600;
		color: var(--text-1);
		font-size: 0.875rem;
	}

	.registration-success dd {
		margin: 0;
		color: var(--text-0);
		font-size: 0.875rem;
	}

	.registration-success dd.mono {
		font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
		font-size: 0.8125rem;
		word-break: break-all;
	}

	.registration-error {
		padding: 1rem;
		background-color: var(--error-bg, #fee);
		border: 1px solid var(--error-border, #fcc);
		border-radius: 0.5rem;
		margin: 1rem 0;
	}

	.registration-error h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		color: var(--error-text, #c00);
	}

	.registration-error p {
		margin: 0 0 1rem 0;
		font-size: 0.875rem;
		color: var(--error-text, #c00);
	}

	.registration-error button {
		padding: 0.5rem 1rem;
		background-color: var(--error-text, #c00);
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.registration-error button:hover:not(:disabled) {
		opacity: 0.9;
	}

	.registration-error button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.pending {
		color: var(--text-2);
		font-style: italic;
	}
</style>
