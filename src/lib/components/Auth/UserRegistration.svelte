<script lang="ts">
	/**
	 * User Registration Flow Component
	 * Automatically registers user in our database after Dynamic authentication
	 */
	import { isSignedIn } from '@dynamic-labs-sdk/client';
	import { onMount } from 'svelte';
	import { dynamicClient } from '$lib/stores/auth';

	// Local state
	let isRegistering = $state(false);
	let isRegistered = $state(false);
	let error = $state<string | null>(null);
	let registeredUser = $state<any>(null);
	let lastRegisteredUserId = $state<string | null>(null);
	let hasCheckedWallet = $state(false);

	/**
	 * Register user in our database
	 * Called automatically when user authenticates with Dynamic
	 */
	async function registerUser() {
		if (!$dynamicClient) {
			return;
		}

		// Check if user is signed in
		if (!isSignedIn($dynamicClient)) {
			return;
		}

		if (isRegistered || isRegistering) {
			return; // Already registered or in progress
		}

		isRegistering = true;
		error = null;

		try {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$dynamicClient.token}`
				}
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Registration failed');
			}

			const data = await response.json();
			isRegistered = true;
			registeredUser = data.user;
			console.log('User registered successfully:', data.user);

			// Check if wallet address needs to be updated after registration
			checkAndUpdateWallet();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to register user';
			console.error('User registration error:', err);
		} finally {
			isRegistering = false;
		}
	}

	/**
	 * Check if wallet address is available and update user record if needed
	 * Called after registration to capture embedded wallet address
	 */
	async function checkAndUpdateWallet() {
		if (!$dynamicClient || hasCheckedWallet) {
			return;
		}

		// Wait a bit for Dynamic to fully initialize the wallet
		await new Promise((resolve) => setTimeout(resolve, 1000));

		try {
			// Get wallet address from user's verified credentials
			const user = $dynamicClient.user;
			const verifiedCredentials = user?.verifiedCredentials;

			if (verifiedCredentials && verifiedCredentials.length > 0) {
				const walletAddress = verifiedCredentials[0].address;

				// Only update if we don't already have a wallet address
				if (walletAddress && registeredUser?.walletAddress !== walletAddress) {
					const response = await fetch('/api/auth/update-wallet', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${$dynamicClient.token}`
						},
						body: JSON.stringify({ walletAddress })
					});

					if (response.ok) {
						const data = await response.json();
						registeredUser = { ...registeredUser, walletAddress };
						console.log('Wallet address updated:', walletAddress);
					}
				}
			}
		} catch (err) {
			console.error('Failed to update wallet address:', err);
			// Don't throw - this is a non-critical update
		} finally {
			hasCheckedWallet = true;
		}
	}

	// Auto-register when user signs in (only once per user)
	$effect(() => {
		if ($dynamicClient && isSignedIn($dynamicClient)) {
			const currentUserId = $dynamicClient.user?.id;

			// Only register if we have a user ID and haven't registered this user yet
			if (currentUserId && currentUserId !== lastRegisteredUserId && !isRegistering) {
				lastRegisteredUserId = currentUserId;
				registerUser();
			}
		}
	});
</script>

<!-- Registration status display -->
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

			<dt>Wallet Address:</dt>
			<dd class="mono">
				{#if registeredUser.walletAddress}
					{registeredUser.walletAddress}
				{:else}
					<span class="pending">Initializing wallet...</span>
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
