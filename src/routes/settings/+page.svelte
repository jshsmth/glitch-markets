<script lang="ts">
	import { authState } from '$lib/stores/auth.svelte';

	let isRegistering = $state(false);
	let registrationStatus = $state<'idle' | 'success' | 'error'>('idle');
	let statusMessage = $state('');
	let proxyWalletAddress = $state<string | null>(null);

	async function registerWithPolymarket() {
		if (!authState.user) {
			statusMessage = 'You must be signed in to register with Polymarket';
			registrationStatus = 'error';
			return;
		}

		isRegistering = true;
		registrationStatus = 'idle';
		statusMessage = '';

		try {
			const response = await fetch('/api/polymarket/register', {
				method: 'POST'
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || data.error || 'Registration failed');
			}

			proxyWalletAddress = data.proxyWalletAddress;
			statusMessage = data.message || 'Successfully registered with Polymarket!';
			registrationStatus = 'success';
		} catch (error) {
			console.error('Polymarket registration error:', error);
			statusMessage = error instanceof Error ? error.message : 'Failed to register with Polymarket';
			registrationStatus = 'error';
		} finally {
			isRegistering = false;
		}
	}
</script>

<svelte:head>
	<title>Settings - Glitch Markets</title>
</svelte:head>

<h1>Settings</h1>

<section class="settings-section">
	<h2>Polymarket Integration</h2>
	<p class="section-description">
		Register with Polymarket to enable trading. This creates your proxy wallet and API credentials.
	</p>

	{#if !authState.user}
		<p class="warning-message">Please sign in to register with Polymarket.</p>
	{:else}
		<button
			class="register-button"
			onclick={registerWithPolymarket}
			disabled={isRegistering}
			aria-busy={isRegistering}
		>
			{#if isRegistering}
				<span class="spinner"></span>
				Registering...
			{:else}
				Register with Polymarket
			{/if}
		</button>

		{#if registrationStatus === 'success'}
			<div class="status-message success">
				<span class="status-icon">✓</span>
				{statusMessage}
				{#if proxyWalletAddress}
					<div class="wallet-address">
						<strong>Proxy Wallet:</strong>
						<code>{proxyWalletAddress}</code>
					</div>
				{/if}
			</div>
		{/if}

		{#if registrationStatus === 'error'}
			<div class="status-message error">
				<span class="status-icon">✗</span>
				{statusMessage}
			</div>
		{/if}
	{/if}
</section>

<style>
	h1 {
		font-size: 32px;
		font-weight: 600;
		color: var(--text-0);
		margin: 0 0 var(--spacing-6) 0;
	}

	h2 {
		font-size: 20px;
		font-weight: 600;
		color: var(--text-0);
		margin: 0 0 var(--spacing-2) 0;
	}

	.settings-section {
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: 12px;
		padding: var(--spacing-5);
		max-width: 600px;
	}

	.section-description {
		color: var(--text-2);
		font-size: 14px;
		margin: 0 0 var(--spacing-4) 0;
		line-height: 1.5;
	}

	.warning-message {
		color: var(--warning);
		font-size: 14px;
		margin: 0;
	}

	.register-button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 12px 20px;
		background: var(--primary);
		color: var(--text-0);
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.register-button:hover:not(:disabled) {
		background: var(--primary-hover);
	}

	.register-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.status-message {
		margin-top: var(--spacing-4);
		padding: 12px 16px;
		border-radius: 8px;
		font-size: 14px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.status-message.success {
		background: color-mix(in srgb, var(--success) 10%, transparent);
		border: 1px solid var(--success);
		color: var(--success);
	}

	.status-message.error {
		background: color-mix(in srgb, var(--danger) 10%, transparent);
		border: 1px solid var(--danger);
		color: var(--danger);
	}

	.status-icon {
		font-weight: bold;
	}

	.wallet-address {
		font-size: 13px;
		color: var(--text-1);
		word-break: break-all;
	}

	.wallet-address code {
		background: var(--bg-2);
		padding: 2px 6px;
		border-radius: 4px;
		font-family: monospace;
	}
</style>
