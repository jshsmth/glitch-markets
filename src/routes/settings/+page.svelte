<script lang="ts">
	import { authState } from '$lib/stores/auth.svelte';
	import { walletState } from '$lib/stores/wallet.svelte';
</script>

<svelte:head>
	<title>Settings - Glitch Markets</title>
</svelte:head>

<h1>Settings</h1>

<section class="settings-section">
	<h2>Polymarket Integration</h2>
	<p class="section-description">
		Your trading wallet is automatically set up when you sign in. No manual action required.
	</p>

	{#if !authState.user}
		<p class="warning-message">Please sign in to view your Polymarket integration status.</p>
	{:else if walletState.isLoading}
		<div class="status-message loading">
			<span class="spinner"></span>
			Loading wallet information...
		</div>
	{:else if walletState.isRegistered && walletState.proxyWalletAddress}
		<div class="status-message success">
			<span class="status-icon">✓</span>
			<strong>Ready to Trade</strong>
			<div class="wallet-info">
				<div class="wallet-row">
					<span class="label">Server Wallet:</span>
					<code class="wallet-code">{walletState.serverWalletAddress || 'Loading...'}</code>
				</div>
				<div class="wallet-row">
					<span class="label">Proxy Wallet:</span>
					<code class="wallet-code">{walletState.proxyWalletAddress}</code>
				</div>
			</div>
		</div>
	{:else}
		<div class="status-message pending">
			<span class="spinner"></span>
			<strong>Setting up your trading wallet...</strong>
			<p class="pending-text">
				Your wallet is being deployed on-chain. This usually takes a few seconds. Refresh the page if
				this takes longer than a minute.
			</p>
		</div>
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

	.status-message {
		margin-top: var(--spacing-4);
		padding: 16px;
		border-radius: 8px;
		font-size: 14px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.status-message.success {
		background: color-mix(in srgb, var(--success) 10%, transparent);
		border: 1px solid var(--success);
		color: var(--text-0);
	}

	.status-message.pending {
		background: color-mix(in srgb, var(--primary) 10%, transparent);
		border: 1px solid var(--primary);
		color: var(--text-0);
	}

	.status-message.loading {
		background: var(--bg-2);
		border: 1px solid var(--bg-3);
		color: var(--text-1);
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 12px;
	}

	.status-icon {
		color: var(--success);
		font-size: 16px;
		font-weight: bold;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.pending-text {
		margin: 0;
		font-size: 13px;
		color: var(--text-2);
		line-height: 1.5;
	}

	.wallet-info {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 4px;
	}

	.wallet-row {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.label {
		font-size: 12px;
		color: var(--text-2);
		font-weight: 500;
	}

	.wallet-code {
		font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
		font-size: 13px;
		color: var(--text-0);
		background: var(--bg-2);
		padding: 8px 12px;
		border-radius: 6px;
		word-break: break-all;
		border: 1px solid var(--bg-3);
	}
</style>
