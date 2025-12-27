<script lang="ts">
	import { authState } from '$lib/stores/auth.svelte';
	import { Logger } from '$lib/utils/logger';

	const log = Logger.forComponent('SettingsPage');

	interface DebugInfo {
		user: {
			id: string;
			email: string | null;
			createdAt: string;
			lastLoginAt: string | null;
		};
		serverWallet: {
			address: string | null;
			walletId: string | null;
			publicKey: string | null;
		};
		polymarket: {
			proxyWalletAddress: string;
			walletAddress: string;
			isDeployed: boolean;
			deployedAt: string | null;
			deploymentTxHash: string | null;
			createdAt: string;
			hasApiCredentials: boolean;
		} | null;
		balance: {
			balance: string;
			balanceRaw: string;
			allowance: string;
			allowanceRaw: string;
			decimals: number;
			hasAllowance: boolean;
			needsApproval: boolean;
		} | null;
		approvals: {
			ctf: {
				isApproved: boolean;
				operator: string;
				contract: string;
			};
			usdc: {
				allowance: string;
				spender: string;
				contract: string;
				hasUnlimitedApproval: boolean;
			};
		};
		contracts: {
			usdcE: string;
			ctf: string;
			exchange: string;
		};
	}

	let debugInfo = $state<DebugInfo | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let copiedField = $state<string | null>(null);

	function fetchDebugInfo() {
		error = null;
		log.debug('Fetching debug info...');

		fetch('/api/user/debug')
			.then(async (response) => {
				log.debug('Response status', { status: response.status });
				if (!response.ok) {
					const errorData = await response.json();
					log.error('API error:', errorData);
					throw new Error(errorData.message || 'Failed to fetch debug information');
				}
				return response.json();
			})
			.then((data) => {
				debugInfo = data;
				log.debug('Debug info received', { data });
				isLoading = false;
			})
			.catch((err) => {
				log.error('Fetch error:', err);
				error = err instanceof Error ? err.message : 'Unknown error';
				isLoading = false;
			});
	}

	function copyToClipboard(text: string, fieldName: string) {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				copiedField = fieldName;
				setTimeout(() => {
					copiedField = null;
				}, 2000);
			})
			.catch((err) => {
				log.error('Failed to copy:', err);
			});
	}

	function shortenAddress(address: string): string {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}

	// Track the last user ID we fetched for to prevent duplicate fetches
	let lastFetchedUserId = $state<string | null>(null);

	$effect(() => {
		log.debug('Effect triggered', {
			authInitializing: authState.isInitializing,
			userId: authState.user?.id
		});

		// Don't do anything while auth is still initializing
		if (authState.isInitializing) {
			return;
		}

		if (authState.user) {
			// Only fetch if we haven't fetched for this user yet
			if (lastFetchedUserId !== authState.user.id) {
				log.debug('Fetching debug info for new user', { userId: authState.user.id });
				lastFetchedUserId = authState.user.id;
				fetchDebugInfo();
			}
		} else {
			log.debug('No authenticated user, resetting state');
			isLoading = false;
			debugInfo = null;
			lastFetchedUserId = null;
		}
	});
</script>

<svelte:head>
	<title>Settings - Glitch Markets</title>
</svelte:head>

<div class="settings-container">
	<div class="settings-header">
		<h1>Settings</h1>
	</div>

	{#if authState.isInitializing || isLoading}
		<div class="loading-card">
			<span class="spinner"></span>
			<p>Loading...</p>
		</div>
	{:else if !authState.user}
		<div class="warning-card">
			<span class="warning-icon">⚠️</span>
			<p>Please sign in to view your settings.</p>
		</div>
	{:else if error}
		<div class="error-card">
			<span class="error-icon">❌</span>
			<p>{error}</p>
			<button class="retry-btn" onclick={() => fetchDebugInfo()}>Retry</button>
		</div>
	{:else if debugInfo}
		<!-- Account Overview -->
		<section class="settings-section">
			<div class="section-header">
				<h2>Account</h2>
				<span class="status-badge success">Active</span>
			</div>

			<div class="compact-grid">
				<div class="info-row">
					<span class="label">Email</span>
					<span class="value">{debugInfo.user.email || 'N/A'}</span>
				</div>
				<div class="info-row">
					<span class="label">Server Wallet</span>
					<div class="value-with-copy">
						<code>{shortenAddress(debugInfo.serverWallet.address || 'Not created')}</code>
						{#if debugInfo.serverWallet.address}
							<button
								class="copy-btn-small"
								onclick={() => {
									const address = debugInfo?.serverWallet.address;
									if (address) copyToClipboard(address, 'serverWallet');
								}}
							>
								{copiedField === 'serverWallet' ? '✓' : '📋'}
							</button>
						{/if}
					</div>
				</div>
			</div>
		</section>

		<!-- Polymarket Status -->
		<section class="settings-section">
			<div class="section-header">
				<h2>Polymarket</h2>
				{#if debugInfo.polymarket?.isDeployed && debugInfo.approvals.ctf.isApproved && debugInfo.approvals.usdc.hasUnlimitedApproval}
					<span class="status-badge success">Ready</span>
				{:else if debugInfo.polymarket}
					<span class="status-badge warning">Setup Incomplete</span>
				{:else}
					<span class="status-badge error">Not Connected</span>
				{/if}
			</div>

			{#if debugInfo.polymarket}
				<div class="compact-grid">
					<div class="info-row">
						<span class="label">Proxy Wallet</span>
						<div class="value-with-copy">
							<code>{shortenAddress(debugInfo.polymarket.proxyWalletAddress)}</code>
							<button
								class="copy-btn-small"
								onclick={() => {
									const address = debugInfo?.polymarket?.proxyWalletAddress;
									if (address) copyToClipboard(address, 'proxyWallet');
								}}
							>
								{copiedField === 'proxyWallet' ? '✓' : '📋'}
							</button>
						</div>
					</div>
					<div class="info-row">
						<span class="label">Balance</span>
						<span class="value balance">${debugInfo.balance?.balance || '0.00'}</span>
					</div>
					<div class="info-row">
						<span class="label">Deployed</span>
						<span class="value">{debugInfo.polymarket.isDeployed ? '✅ Yes' : '❌ No'}</span>
					</div>
					<div class="info-row">
						<span class="label">CTF Approved</span>
						<span class="value">{debugInfo.approvals.ctf.isApproved ? '✅ Yes' : '❌ No'}</span>
					</div>
					<div class="info-row">
						<span class="label">USDC.e Approved</span>
						<span class="value"
							>{debugInfo.approvals.usdc.hasUnlimitedApproval ? '✅ Unlimited' : '⚠️ Limited'}</span
						>
					</div>
					{#if debugInfo.polymarket.deploymentTxHash}
						<div class="info-row">
							<span class="label">Deployment Tx</span>
							<a
								href="https://polygonscan.com/tx/{debugInfo.polymarket.deploymentTxHash}"
								target="_blank"
								rel="noopener noreferrer"
								class="value link"
							>
								{shortenAddress(debugInfo.polymarket.deploymentTxHash)}
							</a>
						</div>
					{/if}
				</div>
			{:else}
				<p class="empty-message">Not connected to Polymarket</p>
			{/if}
		</section>

		<!-- Contracts (Collapsed) -->
		<details class="settings-section collapsible">
			<summary>
				<h2>Contract Addresses</h2>
			</summary>
			<div class="compact-grid">
				<div class="info-row">
					<span class="label">USDC.e</span>
					<a
						href="https://polygonscan.com/address/{debugInfo.contracts.usdcE}"
						target="_blank"
						rel="noopener noreferrer"
						class="value link"
					>
						{shortenAddress(debugInfo.contracts.usdcE)}
					</a>
				</div>
				<div class="info-row">
					<span class="label">CTF</span>
					<a
						href="https://polygonscan.com/address/{debugInfo.contracts.ctf}"
						target="_blank"
						rel="noopener noreferrer"
						class="value link"
					>
						{shortenAddress(debugInfo.contracts.ctf)}
					</a>
				</div>
				<div class="info-row">
					<span class="label">Exchange</span>
					<a
						href="https://polygonscan.com/address/{debugInfo.contracts.exchange}"
						target="_blank"
						rel="noopener noreferrer"
						class="value link"
					>
						{shortenAddress(debugInfo.contracts.exchange)}
					</a>
				</div>
			</div>
		</details>
	{/if}
</div>

<style>
	.settings-container {
		max-width: 800px;
		margin: 0 auto;
		padding: var(--spacing-4);
	}

	.settings-header {
		margin-bottom: var(--spacing-5);
	}

	h1 {
		font-size: 24px;
		font-weight: 600;
		color: var(--text-0);
		margin: 0;
	}

	.settings-section {
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: 12px;
		padding: var(--spacing-4);
		margin-bottom: var(--spacing-3);
	}

	.settings-section.collapsible {
		cursor: pointer;
	}

	.settings-section.collapsible summary {
		list-style: none;
		cursor: pointer;
		user-select: none;
	}

	.settings-section.collapsible summary::-webkit-details-marker {
		display: none;
	}

	.settings-section.collapsible summary h2::after {
		content: '▼';
		font-size: 12px;
		margin-left: var(--spacing-2);
		opacity: 0.5;
	}

	.settings-section.collapsible[open] summary h2::after {
		content: '▲';
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-3);
		padding-bottom: var(--spacing-3);
		border-bottom: 1px solid var(--bg-3);
	}

	h2 {
		font-size: 16px;
		font-weight: 600;
		color: var(--text-0);
		margin: 0;
	}

	.status-badge {
		padding: 4px 10px;
		border-radius: 10px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.status-badge.success {
		background: color-mix(in srgb, var(--success) 15%, transparent);
		color: var(--success);
	}

	.status-badge.warning {
		background: color-mix(in srgb, var(--warning) 15%, transparent);
		color: var(--warning);
	}

	.status-badge.error {
		background: color-mix(in srgb, var(--error) 15%, transparent);
		color: var(--error);
	}

	.compact-grid {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-2) 0;
		gap: var(--spacing-3);
	}

	.info-row .label {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-2);
		flex-shrink: 0;
	}

	.info-row .value {
		font-size: 13px;
		color: var(--text-0);
		text-align: right;
	}

	.info-row .value.balance {
		font-weight: 600;
		color: var(--primary);
		font-variant-numeric: tabular-nums;
	}

	.info-row .value.link {
		color: var(--primary);
		text-decoration: none;
		transition: color 0.2s;
	}

	.info-row .value.link:hover {
		color: var(--primary-hover);
		text-decoration: underline;
	}

	.info-row code {
		font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
		font-size: 12px;
		color: var(--text-0);
		background: var(--bg-2);
		padding: 2px 6px;
		border-radius: 4px;
	}

	.value-with-copy {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	.copy-btn-small {
		padding: 2px 6px;
		background: var(--bg-3);
		border: 1px solid var(--bg-4);
		border-radius: 4px;
		color: var(--text-2);
		font-size: 11px;
		cursor: pointer;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.copy-btn-small:hover {
		background: var(--bg-4);
		border-color: var(--primary);
		color: var(--primary);
	}

	.warning-card,
	.loading-card,
	.error-card {
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: 12px;
		padding: var(--spacing-4);
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
	}

	.warning-card {
		border-color: var(--warning);
		background: color-mix(in srgb, var(--warning) 5%, var(--bg-1));
	}

	.error-card {
		border-color: var(--error);
		background: color-mix(in srgb, var(--error) 5%, var(--bg-1));
	}

	.warning-icon,
	.error-icon {
		font-size: 20px;
		flex-shrink: 0;
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid var(--bg-3);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
	}

	.retry-btn {
		margin-left: auto;
		padding: var(--spacing-2) var(--spacing-3);
		background: var(--primary);
		border: none;
		border-radius: 6px;
		color: white;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.retry-btn:hover {
		background: var(--primary-hover);
	}

	.empty-message {
		color: var(--text-2);
		font-size: 13px;
		font-style: italic;
		margin: 0;
	}

	@media (max-width: 640px) {
		.settings-container {
			padding: var(--spacing-3);
		}

		.info-row {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-1);
		}

		.info-row .value {
			text-align: left;
		}
	}
</style>
