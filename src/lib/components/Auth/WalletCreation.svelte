<script lang="ts">
	/**
	 * Wallet Creation Component
	 * Creates an embedded wallet for the user using Dynamic's WaaS API
	 */
	import { authState } from '$lib/stores/auth.svelte';
	import { refreshUser } from '@dynamic-labs-sdk/client';
	import { dev } from '$app/environment';

	interface WalletInfo {
		address: string;
		chain: string;
		walletName: string;
	}

	interface WalletCreationResponse {
		success: boolean;
		status: 'created' | 'existing';
		wallets: WalletInfo[];
		message: string;
	}

	// Props
	interface Props {
		chains?: ('EVM' | 'SVM' | 'SUI')[];
		autoCreate?: boolean;
	}

	let { chains = ['EVM'], autoCreate = false }: Props = $props();

	let isCreating = $state(false);
	let hasCreated = $state(false);
	let error = $state<string | null>(null);
	let walletData = $state<WalletCreationResponse | null>(null);
	let autoCreateTriggered = $state(false);

	/**
	 * Create embedded wallet via API
	 */
	async function createWallet() {
		if (!authState.client || !authState.client.token) {
			error = 'Not authenticated';
			return;
		}

		if (isCreating || hasCreated) {
			return; // Already in progress or completed
		}

		isCreating = true;
		error = null;

		try {
			const response = await fetch('/api/wallet/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${authState.client.token}`
				},
				body: JSON.stringify({ chains })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to create wallet');
			}

			const data = (await response.json()) as WalletCreationResponse;
			hasCreated = true;
			walletData = data;
			if (dev) {
				console.log('Wallet creation response:', data);
			}

			await refreshUser();
			if (dev) {
				console.log('Dynamic user refreshed after wallet creation');
			}

			if (data.wallets && data.wallets.length > 0) {
				const walletAddress = data.wallets[0].address;
				await updateWalletInDatabase(walletAddress);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create wallet';
			console.error('Wallet creation error:', err);
		} finally {
			isCreating = false;
		}
	}

	/**
	 * Update wallet address in database
	 */
	async function updateWalletInDatabase(walletAddress: string) {
		if (!authState.client || !authState.client.token) {
			return;
		}

		try {
			const response = await fetch('/api/auth/update-wallet', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${authState.client.token}`
				},
				body: JSON.stringify({ walletAddress })
			});

			if (response.ok) {
				if (dev) {
					console.log('Wallet address updated in database:', walletAddress);
				}
			} else {
				console.warn('Failed to update wallet in database');
			}
		} catch (err) {
			console.error('Failed to update wallet address:', err);
		}
	}

	// Use $effect for cleaner reactive auto-create logic
	$effect(() => {
		if (
			autoCreate &&
			authState.client?.token &&
			!autoCreateTriggered &&
			!isCreating &&
			!hasCreated
		) {
			autoCreateTriggered = true;
			setTimeout(() => createWallet(), 500);
		}
	});
</script>

<div class="wallet-creation">
	{#if isCreating}
		<div class="status-box creating">
			<div class="spinner"></div>
			<p>Creating embedded wallet...</p>
		</div>
	{:else if hasCreated && walletData}
		<div class="status-box success">
			<h3>
				{walletData.status === 'created' ? '✓ Wallet Created' : '✓ Wallet Already Exists'}
			</h3>
			<p class="message">{walletData.message}</p>

			{#if walletData.wallets && walletData.wallets.length > 0}
				<div class="wallets-list">
					<h4>Wallet Addresses:</h4>
					{#each walletData.wallets as wallet (wallet.address)}
						<div class="wallet-item">
							<span class="chain-badge">{wallet.chain}</span>
							<code class="address">{wallet.address}</code>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else if error}
		<div class="status-box error">
			<h3>Wallet Creation Error</h3>
			<p>{error}</p>
			<button onclick={createWallet} disabled={isCreating}>
				{isCreating ? 'Retrying...' : 'Try Again'}
			</button>
		</div>
	{:else}
		<button class="create-button" onclick={createWallet} disabled={isCreating}>
			Create Embedded Wallet
		</button>
	{/if}
</div>

<style>
	.wallet-creation {
		margin: 1rem 0;
	}

	.status-box {
		padding: 1rem;
		border-radius: 0.5rem;
		border: 1px solid var(--bg-4);
	}

	.status-box.creating {
		background-color: var(--bg-2);
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.status-box.success {
		background-color: var(--success-bg, #efe);
		border-color: var(--success-border, #aea);
	}

	.status-box.error {
		background-color: var(--error-bg, #fee);
		border-color: var(--error-border, #fcc);
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid var(--bg-4);
		border-top-color: var(--text-0);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.status-box.creating p {
		margin: 0;
		color: var(--text-1);
		font-size: 0.875rem;
	}

	.status-box.success h3,
	.status-box.error h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.status-box.success h3 {
		color: var(--success-text, #0a0);
	}

	.status-box.error h3 {
		color: var(--error-text, #c00);
	}

	.message {
		margin: 0 0 1rem 0;
		color: var(--text-1);
		font-size: 0.875rem;
	}

	.wallets-list {
		margin-top: 1rem;
	}

	.wallets-list h4 {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-0);
	}

	.wallet-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		padding: 0.5rem;
		background-color: var(--bg-1);
		border-radius: 0.375rem;
	}

	.chain-badge {
		padding: 0.25rem 0.5rem;
		background-color: var(--bg-3);
		color: var(--text-1);
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 0.25rem;
		text-transform: uppercase;
	}

	.address {
		font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
		font-size: 0.75rem;
		color: var(--text-0);
		word-break: break-all;
	}

	.create-button {
		width: 100%;
		padding: 0.75rem 1rem;
		background-color: var(--primary, #3b82f6);
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.create-button:hover:not(:disabled) {
		opacity: 0.9;
	}

	.create-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.status-box.error button {
		padding: 0.5rem 1rem;
		background-color: var(--error-text, #c00);
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
		margin-top: 0.5rem;
	}

	.status-box.error button:hover:not(:disabled) {
		opacity: 0.9;
	}

	.status-box.error button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.status-box.error p {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		color: var(--error-text, #c00);
	}
</style>
