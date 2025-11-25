<script lang="ts">
	/**
	 * Polymarket Authorization Component
	 * Handles one-time signature for Polymarket CLOB API credentials
	 */
	import { isSignedIn, getWalletAccounts, signMessage } from '@dynamic-labs-sdk/client';
	import { dynamicClient } from '$lib/stores/auth';

	// Local state
	let isRegistering = $state(false);
	let isRegistered = $state(false);
	let error = $state<string | null>(null);
	let hasCheckedRegistration = $state(false);

	/**
	 * Check if user is already registered with Polymarket
	 */
	async function checkRegistration() {
		if (!$dynamicClient || !isSignedIn($dynamicClient)) {
			return;
		}

		try {
			const response = await fetch('/api/polymarket/status', {
				headers: {
					Authorization: `Bearer ${$dynamicClient.token}`
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
	 * Signs authorization message and sends to backend
	 */
	async function registerWithPolymarket() {
		if (!$dynamicClient) {
			error = 'Authentication required';
			return;
		}

		isRegistering = true;
		error = null;

		try {
			// Get the user's wallet account
			const walletAccounts = getWalletAccounts();
			if (!walletAccounts || walletAccounts.length === 0) {
				throw new Error('No wallet found. Please connect a wallet first.');
			}

			const walletAccount = walletAccounts[0];
			const walletAddress = walletAccount.address;

			// Create authorization message
			const timestamp = Date.now();
			const messageText = `I authorize Glitch Markets to trade on my behalf.\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;

			// Request user signature using the Dynamic SDK
			const signature = await signMessage({ walletAccount, message: messageText });

			// Send to backend
			const response = await fetch('/api/polymarket/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$dynamicClient.token}`
				},
				body: JSON.stringify({
					signature,
					walletAddress,
					timestamp,
					message: messageText
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Registration failed');
			}

			isRegistered = true;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Registration failed';
			console.error('Polymarket registration error:', err);
		} finally {
			isRegistering = false;
		}
	}

	// Check registration status when client is ready (only once)
	$effect(() => {
		if ($dynamicClient && isSignedIn($dynamicClient) && !hasCheckedRegistration) {
			hasCheckedRegistration = true;
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
			{isRegistering ? 'Authorizing...' : 'Enable Polymarket Trading'}
		</button>
		<p class="info-text">
			Sign a one-time message to authorize trading. Your credentials are encrypted and stored
			securely.
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
