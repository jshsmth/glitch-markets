<script lang="ts">
	import QRCode from 'qrcode';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import CopyIcon from '$lib/components/icons/CopyIcon.svelte';
	import CheckCircleIcon from '$lib/components/icons/CheckCircleIcon.svelte';
	import ChevronLeftIcon from '$lib/components/icons/ChevronLeftIcon.svelte';
	import type {
		SupportedAsset,
		SupportedAssetsResponse,
		DepositAddressResponse,
		ChainType
	} from '$lib/types/bridge';
	import { determineChainType } from '$lib/types/bridge';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	let supportedAssets = $state<SupportedAsset[]>([]);
	let assetsLoading = $state(true);
	let assetsError = $state<string | null>(null);
	let selectedAsset = $state<SupportedAsset | null>(null);
	let depositAddress = $state<string | null>(null);
	let addressLoading = $state(false);
	let addressError = $state<string | null>(null);
	let userWalletAddress = $state<string | null>(null);
	let qrCanvas = $state<HTMLCanvasElement | null>(null);
	let qrError = $state(false);
	let copySuccess = $state(false);
	let copyTimeout = $state<ReturnType<typeof setTimeout> | null>(null);

	let showAssetSelector = $derived(!selectedAsset);
	let modalTitle = $derived(
		selectedAsset ? `Deposit ${selectedAsset.token.symbol}` : 'Deposit Funds'
	);

	$effect(() => {
		if (isOpen) {
			assetsLoading = true;
			assetsError = null;
			fetchSupportedAssets();
			fetchUserWalletAddress();
		}
	});

	$effect(() => {
		if (selectedAsset && userWalletAddress) {
			fetchDepositAddress(selectedAsset, userWalletAddress);
		}
	});

	$effect(() => {
		if (depositAddress && qrCanvas) {
			generateQRCode(depositAddress);
		}
	});

	$effect(() => {
		return () => {
			if (copyTimeout) clearTimeout(copyTimeout);
		};
	});

	function resetModalState() {
		selectedAsset = null;
		depositAddress = null;
		addressError = null;
		assetsError = null;
		copySuccess = false;
		qrError = false;
		if (copyTimeout) {
			clearTimeout(copyTimeout);
			copyTimeout = null;
		}
	}

	async function fetchSupportedAssets() {
		assetsLoading = true;
		assetsError = null;

		try {
			const response = await fetch('/api/bridge/supported-assets');
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data: SupportedAssetsResponse = await response.json();
			console.log('[DepositModal] Supported assets response:', data);

			// Filter to USDC on EVM chains only
			const evmChainIds = ['1', '10', '137', '42161', '56', '8453', '43114'];
			supportedAssets = (data.supportedAssets || []).filter((asset) => {
				const isUSDC = asset.token.symbol.toUpperCase() === 'USDC';
				const isEVM =
					evmChainIds.includes(asset.chainId) ||
					(!asset.chainId.includes('1151111081099710') &&
						asset.chainName.toLowerCase() !== 'solana' &&
						asset.chainName.toLowerCase() !== 'bitcoin' &&
						!asset.chainId.includes('btc'));
				return isUSDC && isEVM;
			});
			console.log('[DepositModal] Filtered USDC assets:', supportedAssets);
		} catch (err) {
			console.error('Failed to fetch supported assets:', err);
			assetsError = err instanceof Error ? err.message : 'Failed to load assets';
		} finally {
			assetsLoading = false;
		}
	}

	async function fetchUserWalletAddress() {
		try {
			const response = await fetch('/api/user/profile');
			if (!response.ok) {
				throw new Error('Failed to fetch user profile');
			}
			const profile = await response.json();
			userWalletAddress = profile.serverWalletAddress || null;
		} catch (err) {
			console.error('Failed to fetch user wallet address:', err);
		}
	}

	async function fetchDepositAddress(asset: SupportedAsset, userAddress: string) {
		addressLoading = true;
		addressError = null;
		depositAddress = null;

		try {
			const response = await fetch('/api/bridge/deposit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ address: userAddress })
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data: DepositAddressResponse = await response.json();
			console.log('[DepositModal] Deposit address response:', data);
			const chainType: ChainType = determineChainType(asset.chainId);
			console.log('[DepositModal] Chain type for', asset.chainName, ':', chainType);
			const address = data.address[chainType];
			console.log('[DepositModal] Selected address:', address);

			if (!address) {
				throw new Error('No deposit address available for this chain');
			}

			depositAddress = address;
		} catch (err) {
			console.error('Failed to fetch deposit address:', err);
			addressError = err instanceof Error ? err.message : 'Failed to generate address';
		} finally {
			addressLoading = false;
		}
	}

	async function generateQRCode(address: string) {
		if (!qrCanvas) return;

		try {
			await QRCode.toCanvas(qrCanvas, address, {
				width: 200,
				margin: 2,
				color: { dark: '#000000', light: '#ffffff' },
				errorCorrectionLevel: 'M'
			});
			qrError = false;
		} catch (err) {
			console.error('QR code generation failed:', err);
			qrError = true;
		}
	}

	async function handleCopyAddress() {
		if (!depositAddress) return;

		try {
			await navigator.clipboard.writeText(depositAddress);
			copySuccess = true;

			if (copyTimeout) clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => {
				copySuccess = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy address:', err);
			// Fallback: select text for manual copy
			const textElement = document.querySelector('.address-full');
			if (textElement) {
				const selection = window.getSelection();
				const range = document.createRange();
				range.selectNodeContents(textElement);
				selection?.removeAllRanges();
				selection?.addRange(range);
			}
		}
	}

	function handleAssetSelect(asset: SupportedAsset) {
		selectedAsset = asset;
	}

	function handleBackToAssets() {
		selectedAsset = null;
		depositAddress = null;
		addressError = null;
		qrError = false;
	}

	function handleModalClose() {
		resetModalState();
		onClose();
	}

	function formatAddress(address: string): string {
		if (address.length <= 16) return address;
		return `${address.slice(0, 8)}...${address.slice(-8)}`;
	}

	function retryFetchAssets() {
		fetchSupportedAssets();
	}

	function retryFetchAddress() {
		if (selectedAsset && userWalletAddress) {
			fetchDepositAddress(selectedAsset, userWalletAddress);
		}
	}
</script>

{#snippet modalContent()}
	<div class="deposit-modal-content">
		{#if showAssetSelector}
			<div class="asset-selector">
				<p class="section-label">Select a network to deposit from</p>

				{#if assetsLoading}
					<div class="asset-list" aria-busy="true" aria-label="Loading networks">
						{#each ['skeleton-1', 'skeleton-2', 'skeleton-3'] as id (id)}
							<div class="asset-item skeleton">
								<div class="skeleton-content">
									<div class="skeleton-line wide"></div>
									<div class="skeleton-line narrow"></div>
								</div>
							</div>
						{/each}
					</div>
				{:else if assetsError}
					<div class="error-state" role="alert">
						<p class="error-message">Failed to load networks</p>
						<p class="error-detail">{assetsError}</p>
						<Button variant="secondary" size="small" onclick={retryFetchAssets}>Try Again</Button>
					</div>
				{:else if supportedAssets.length === 0}
					<div class="empty-state">
						<p>No deposit options available at this time</p>
						<p class="empty-subtext">Please try again later</p>
					</div>
				{:else}
					<div class="asset-list" role="listbox" aria-label="Available networks">
						{#each supportedAssets as asset (`${asset.chainId}-${asset.token.address}`)}
							<button
								class="asset-item"
								role="option"
								aria-selected="false"
								onclick={() => handleAssetSelect(asset)}
							>
								<div class="asset-info">
									<span class="asset-chain">{asset.chainName}</span>
									<span class="asset-token">{asset.token.symbol}</span>
								</div>
								<div class="asset-minimum">
									<span class="minimum-label">Min:</span>
									<span class="minimum-value">${asset.minCheckoutUsd.toFixed(2)}</span>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{:else}
			<div class="address-display">
				{#if addressLoading}
					<div class="loading-state" aria-busy="true">
						<div class="spinner"></div>
						<p>Generating deposit address...</p>
					</div>
				{:else if addressError}
					<div class="error-state" role="alert">
						<p class="error-message">Failed to generate address</p>
						<p class="error-detail">{addressError}</p>
						<div class="error-actions">
							<Button variant="secondary" size="small" onclick={retryFetchAddress}>
								Try Again
							</Button>
							<Button variant="tertiary" size="small" onclick={handleBackToAssets}>
								<ChevronLeftIcon size={16} />
								Back to Networks
							</Button>
						</div>
					</div>
				{:else if depositAddress}
					<div class="deposit-info">
						<div class="qr-container">
							{#if qrError}
								<div class="qr-error">QR code unavailable</div>
							{:else}
								<canvas
									bind:this={qrCanvas}
									class="qr-canvas"
									aria-label="QR code for deposit address"
								></canvas>
							{/if}
						</div>

						<div class="address-section">
							<p class="address-label">Deposit Address</p>
							<div class="address-box">
								<span class="address-text">{formatAddress(depositAddress)}</span>
								<button
									class="copy-button"
									class:success={copySuccess}
									onclick={handleCopyAddress}
									aria-label={copySuccess ? 'Address copied' : 'Copy address'}
								>
									{#if copySuccess}
										<CheckCircleIcon size={20} color="var(--success)" />
									{:else}
										<CopyIcon size={20} color="var(--text-2)" />
									{/if}
								</button>
							</div>
							<p class="address-full" aria-label="Full deposit address">{depositAddress}</p>
						</div>

						{#if selectedAsset}
							<div class="minimum-warning">
								<span class="warning-icon">!</span>
								<span>Minimum deposit: ${selectedAsset.minCheckoutUsd.toFixed(2)} USD</span>
							</div>
						{/if}

						<div class="address-actions">
							<Button variant="tertiary" size="small" onclick={handleBackToAssets}>
								<ChevronLeftIcon size={16} />
								Back to Networks
							</Button>
							<Button variant="primary" onclick={handleModalClose}>Done</Button>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/snippet}

<Modal {isOpen} onClose={handleModalClose} title={modalTitle} maxWidth="420px">
	{@render modalContent()}
</Modal>

<style>
	.deposit-modal-content {
		min-height: 200px;
	}

	.section-label {
		font-size: 14px;
		color: var(--text-2);
		margin: 0 0 16px 0;
	}

	.asset-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.asset-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.15s ease;
		width: 100%;
		text-align: left;
	}

	.asset-item:hover {
		background: var(--primary-hover-bg);
		border-color: rgba(var(--primary-rgb), 0.3);
	}

	.asset-item:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.asset-item:active {
		transform: scale(0.98);
	}

	.asset-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.asset-chain {
		font-size: 16px;
		font-weight: 500;
		color: var(--text-0);
	}

	.asset-token {
		font-size: 13px;
		color: var(--text-2);
	}

	.asset-minimum {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 13px;
	}

	.minimum-label {
		color: var(--text-3);
	}

	.minimum-value {
		color: var(--text-1);
		font-weight: 500;
	}

	.asset-item.skeleton {
		cursor: default;
		pointer-events: none;
	}

	.skeleton-content {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
	}

	.skeleton-line {
		height: 16px;
		background: linear-gradient(90deg, var(--bg-3) 25%, var(--bg-4) 50%, var(--bg-3) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 4px;
	}

	.skeleton-line.wide {
		width: 60%;
	}

	.skeleton-line.narrow {
		width: 40%;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		padding: 48px 24px;
		color: var(--text-2);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--bg-4);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 32px 24px;
		text-align: center;
	}

	.error-message {
		font-size: 16px;
		font-weight: 500;
		color: var(--danger);
		margin: 0;
	}

	.error-detail {
		font-size: 14px;
		color: var(--text-2);
		margin: 0;
	}

	.error-actions {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 8px;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 48px 24px;
		text-align: center;
		color: var(--text-2);
	}

	.empty-subtext {
		font-size: 14px;
		color: var(--text-3);
		margin: 0;
	}

	.address-display {
		display: flex;
		flex-direction: column;
	}

	.deposit-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24px;
	}

	.qr-container {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.qr-canvas {
		display: block;
		border-radius: 8px;
	}

	.qr-error {
		width: 200px;
		height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-3);
		font-size: 14px;
	}

	.address-section {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.address-label {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-2);
		margin: 0;
	}

	.address-box {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: 10px;
		gap: 12px;
	}

	.address-text {
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 14px;
		color: var(--text-0);
		word-break: break-all;
	}

	.address-full {
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 11px;
		color: var(--text-3);
		word-break: break-all;
		margin: 0;
		padding: 0 4px;
		user-select: all;
	}

	.copy-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8px;
		background: transparent;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.copy-button:hover {
		background: var(--primary-hover-bg);
	}

	.copy-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.copy-button.success {
		background: color-mix(in srgb, var(--success) 15%, transparent);
	}

	.minimum-warning {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		background: color-mix(in srgb, var(--warning) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--warning) 30%, transparent);
		border-radius: 10px;
		font-size: 14px;
		color: var(--text-1);
		width: 100%;
	}

	.warning-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		background: var(--warning);
		color: var(--bg-0);
		font-size: 12px;
		font-weight: 700;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.address-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		width: 100%;
		margin-top: 8px;
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner,
		.skeleton-line {
			animation: none;
		}

		.asset-item,
		.copy-button {
			transition: none;
		}
	}
</style>
