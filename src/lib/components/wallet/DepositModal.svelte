<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import CopyIcon from '$lib/components/icons/CopyIcon.svelte';
	import CheckCircleIcon from '$lib/components/icons/CheckCircleIcon.svelte';
	import ChevronDownIcon from '$lib/components/icons/ChevronDownIcon.svelte';
	import {
		UsdcIcon,
		EthereumIcon,
		PolygonIcon,
		OptimismIcon,
		ArbitrumIcon,
		BscIcon,
		BaseIcon,
		AvalancheIcon
	} from '$lib/components/icons/chains';
	import type {
		SupportedAsset,
		SupportedAssetsResponse,
		DepositAddressResponse,
		ChainType
	} from '$lib/types/bridge';
	import { determineChainType } from '$lib/types/bridge';
	import { walletState } from '$lib/stores/wallet.svelte';

	// Module-level cache persists across modal open/close
	const CACHE_DURATION_MS = 5 * 60 * 1000;

	interface CacheEntry<T> {
		data: T;
		timestamp: number;
	}

	let assetsCache: CacheEntry<SupportedAsset[]> | null = null;
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- module-level cache, not reactive state
	let depositAddressCache: Map<string, CacheEntry<string>> = new Map();

	function isCacheValid<T>(cache: CacheEntry<T> | null | undefined): cache is CacheEntry<T> {
		if (!cache) return false;
		return Date.now() - cache.timestamp < CACHE_DURATION_MS;
	}

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
	let addressError = $state<string | null>(null);
	let qrCanvas = $state<HTMLCanvasElement | null>(null);
	let qrError = $state(false);
	let copySuccess = $state(false);
	let copyTimeout = $state<ReturnType<typeof setTimeout> | null>(null);
	let chainDropdownOpen = $state(false);
	let addressTextRef = $state<HTMLParagraphElement | null>(null);

	let modalTitle = $derived(selectedAsset ? `Deposit USDC` : 'Deposit Funds');

	const chainIcons: Record<string, typeof EthereumIcon> = {
		'1': EthereumIcon,
		'10': OptimismIcon,
		'137': PolygonIcon,
		'42161': ArbitrumIcon,
		'56': BscIcon,
		'8453': BaseIcon,
		'43114': AvalancheIcon
	};

	const chainColors: Record<string, string> = {
		'1': '#627EEA',
		'10': '#FF0420',
		'137': '#8247E5',
		'42161': '#28A0F0',
		'56': '#F0B90B',
		'8453': '#0052FF',
		'43114': '#E84142'
	};

	function getChainIcon(chainId: string) {
		return chainIcons[chainId] || EthereumIcon;
	}

	function getChainColor(chainId: string) {
		return chainColors[chainId] || 'var(--text-1)';
	}

	$effect(() => {
		if (isOpen) {
			if (!isCacheValid(assetsCache)) {
				assetsLoading = true;
			}
			assetsError = null;
			fetchSupportedAssets();
		}
	});

	$effect(() => {
		const userAddress = walletState.serverWalletAddress;
		if (selectedAsset && userAddress) {
			fetchDepositAddress(selectedAsset, userAddress);
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

	$effect(() => {
		if (chainDropdownOpen) {
			const handleClickOutside = (e: MouseEvent) => {
				const target = e.target as HTMLElement;
				if (!target.closest('.chain-dropdown')) {
					chainDropdownOpen = false;
				}
			};
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});

	function resetModalState() {
		copySuccess = false;
		qrError = false;
		chainDropdownOpen = false;
		if (copyTimeout) {
			clearTimeout(copyTimeout);
			copyTimeout = null;
		}
		addressError = null;
		assetsError = null;
	}

	async function fetchSupportedAssets() {
		if (isCacheValid(assetsCache)) {
			supportedAssets = assetsCache.data;
			if (supportedAssets.length > 0 && !selectedAsset) {
				selectedAsset = supportedAssets[0];
			}
			assetsLoading = false;
			return;
		}

		assetsLoading = true;
		assetsError = null;

		try {
			const response = await fetch('/api/bridge/supported-assets');
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data: SupportedAssetsResponse = await response.json();
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
			assetsCache = { data: supportedAssets, timestamp: Date.now() };

			if (supportedAssets.length > 0 && !selectedAsset) {
				selectedAsset = supportedAssets[0];
			}
		} catch (err) {
			console.error('Failed to fetch supported assets:', err);
			assetsError = err instanceof Error ? err.message : 'Failed to load assets';
		} finally {
			assetsLoading = false;
		}
	}

	async function fetchDepositAddress(asset: SupportedAsset, userAddress: string) {
		const chainType: ChainType = determineChainType(asset.chainId);
		const cacheKey = `${userAddress}-${chainType}`;

		const cachedEntry = depositAddressCache.get(cacheKey);
		if (isCacheValid(cachedEntry)) {
			depositAddress = cachedEntry.data;
			addressError = null;
			return;
		}

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
			const address = data.address[chainType];

			if (!address) {
				throw new Error('No deposit address available for this chain');
			}

			depositAddressCache.set(cacheKey, { data: address, timestamp: Date.now() });
			depositAddress = address;
		} catch (err) {
			console.error('Failed to fetch deposit address:', err);
			addressError = err instanceof Error ? err.message : 'Failed to generate address';
		}
	}

	async function generateQRCode(address: string) {
		if (!qrCanvas) return;

		try {
			const QRCode = await import('qrcode');
			await QRCode.toCanvas(qrCanvas, address, {
				width: 180,
				margin: 2,
				color: { dark: '#000000', light: '#ffffff' },
				errorCorrectionLevel: 'M'
			});
			qrError = false;
		} catch {
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
			if (addressTextRef) {
				const selection = window.getSelection();
				const range = document.createRange();
				range.selectNodeContents(addressTextRef);
				selection?.removeAllRanges();
				selection?.addRange(range);
			}
		}
	}

	function handleChainSelect(asset: SupportedAsset) {
		selectedAsset = asset;
		chainDropdownOpen = false;
	}

	function handleModalClose() {
		resetModalState();
		onClose();
	}

	function retryFetchAssets() {
		fetchSupportedAssets();
	}

	function retryFetchAddress() {
		const userAddress = walletState.serverWalletAddress;
		if (selectedAsset && userAddress) {
			fetchDepositAddress(selectedAsset, userAddress);
		}
	}
</script>

{#snippet modalContent()}
	<div class="deposit-modal-content">
		{#if assetsLoading}
			<div class="selectors-row">
				<div class="selector-group">
					<span class="selector-label">Supported token</span>
					<div class="selector-button skeleton">
						<div class="skeleton-circle"></div>
						<div class="skeleton-text"></div>
					</div>
				</div>
				<div class="selector-group">
					<span class="selector-label">Supported chain</span>
					<div class="selector-button skeleton">
						<div class="skeleton-circle"></div>
						<div class="skeleton-text"></div>
					</div>
				</div>
			</div>
			<div class="qr-section">
				<div class="qr-container skeleton-qr"></div>
			</div>
			<div class="address-section">
				<div class="address-header">
					<div class="skeleton-text-sm"></div>
					<div class="skeleton-text-xs"></div>
				</div>
				<div class="skeleton-address"></div>
				<div class="skeleton-button"></div>
			</div>
			<div class="skeleton-banner"></div>
		{:else if assetsError}
			<div class="error-state" role="alert">
				<p class="error-message">Failed to load networks</p>
				<p class="error-detail">{assetsError}</p>
				<Button variant="secondary" size="small" onclick={retryFetchAssets}>Try Again</Button>
			</div>
		{:else if supportedAssets.length === 0}
			<div class="empty-state">
				<p>No deposit options available</p>
			</div>
		{:else}
			<div class="selectors-row">
				<div class="selector-group">
					<span class="selector-label">Supported token</span>
					<div class="selector-button token-selector">
						<UsdcIcon size={20} />
						<span class="selector-value">USDC</span>
					</div>
				</div>

				<div class="selector-group">
					<span class="selector-label">Supported chain</span>
					<div class="chain-dropdown">
						<button
							class="selector-button chain-selector"
							class:open={chainDropdownOpen}
							onclick={() => (chainDropdownOpen = !chainDropdownOpen)}
							aria-expanded={chainDropdownOpen}
							aria-haspopup="listbox"
						>
							{#if selectedAsset}
								{@const ChainIcon = getChainIcon(selectedAsset.chainId)}
								<ChainIcon size={20} color={getChainColor(selectedAsset.chainId)} />
								<span class="selector-value">{selectedAsset.chainName}</span>
							{/if}
							<ChevronDownIcon size={16} color="var(--text-3)" />
						</button>

						{#if chainDropdownOpen}
							<div class="dropdown-menu" role="listbox">
								{#each supportedAssets as asset (`${asset.chainId}-${asset.token.address}`)}
									{@const ChainIcon = getChainIcon(asset.chainId)}
									<button
										class="dropdown-item"
										class:selected={selectedAsset?.chainId === asset.chainId}
										role="option"
										aria-selected={selectedAsset?.chainId === asset.chainId}
										onclick={() => handleChainSelect(asset)}
									>
										<ChainIcon size={20} color={getChainColor(asset.chainId)} />
										<span class="chain-name">{asset.chainName}</span>
										<span class="chain-min">Min ${asset.minCheckoutUsd.toFixed(0)}</span>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<div class="qr-section">
				{#if addressError}
					<div class="qr-error-state">
						<p class="error-message">Failed to generate address</p>
						<Button variant="secondary" size="small" onclick={retryFetchAddress}>Retry</Button>
					</div>
				{:else if depositAddress}
					<div class="qr-wrapper">
						<div class="qr-container">
							{#if qrError}
								<div class="qr-error">QR unavailable</div>
							{:else}
								<canvas bind:this={qrCanvas} class="qr-canvas" aria-label="Deposit QR code"
								></canvas>
								{#if selectedAsset}
									{@const ChainIcon = getChainIcon(selectedAsset.chainId)}
									<div class="qr-chain-badge">
										<ChainIcon size={24} color={getChainColor(selectedAsset.chainId)} />
									</div>
								{/if}
							{/if}
						</div>
					</div>
				{:else}
					<div class="qr-container skeleton-qr"></div>
				{/if}
			</div>

			{#if addressError}
				<!-- Error state handled in QR section -->
			{:else if depositAddress}
				<div class="address-section">
					<div class="address-header">
						<span class="address-label">
							Your deposit address
							<span class="info-tooltip">ⓘ</span>
						</span>
						<a
							href="https://fun.xyz/terms"
							target="_blank"
							rel="noopener noreferrer"
							class="terms-link">Terms apply</a
						>
					</div>
					<p class="address-text" bind:this={addressTextRef}>{depositAddress}</p>
					<button
						class="copy-button"
						class:success={copySuccess}
						onclick={handleCopyAddress}
						aria-label={copySuccess ? 'Address copied' : 'Copy address'}
					>
						{#if copySuccess}
							<CheckCircleIcon size={16} color="var(--success)" />
							<span>Copied!</span>
						{:else}
							<CopyIcon size={16} color="var(--text-2)" />
							<span>Copy address</span>
						{/if}
					</button>
				</div>

				{#if selectedAsset}
					<div class="info-banner warning">
						<span class="info-icon warning-icon">!</span>
						<span
							>Send only USDC on {selectedAsset.chainName}. Minimum deposit: ${selectedAsset.minCheckoutUsd.toFixed(
								2
							)}</span
						>
					</div>
				{/if}
			{:else}
				<div class="address-section">
					<div class="address-header">
						<div class="skeleton-text-sm"></div>
						<div class="skeleton-text-xs"></div>
					</div>
					<div class="skeleton-address"></div>
					<div class="skeleton-button"></div>
				</div>
				<div class="skeleton-banner"></div>
			{/if}
		{/if}
	</div>
{/snippet}

<Modal {isOpen} onClose={handleModalClose} title={modalTitle} maxWidth="480px">
	{@render modalContent()}
</Modal>

<style>
	.deposit-modal-content {
		display: flex;
		flex-direction: column;
		gap: 24px;
		padding-top: 8px;
	}

	.selectors-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	.selector-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.selector-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-2);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.selector-button {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 12px 14px;
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: 12px;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-0);
		cursor: default;
		transition: all 0.15s ease;
	}

	.selector-button.chain-selector {
		cursor: pointer;
	}

	.selector-button.chain-selector:hover {
		background: var(--bg-2);
		border-color: var(--bg-5);
	}

	.selector-button.chain-selector.open {
		border-color: var(--primary);
		background: var(--bg-2);
	}

	.selector-button.skeleton {
		pointer-events: none;
	}

	.skeleton-circle {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: linear-gradient(90deg, var(--bg-3) 25%, var(--bg-4) 50%, var(--bg-3) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.skeleton-text {
		width: 60px;
		height: 14px;
		border-radius: 4px;
		background: linear-gradient(90deg, var(--bg-3) 25%, var(--bg-4) 50%, var(--bg-3) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.skeleton-qr {
		width: 180px;
		height: 180px;
		background: linear-gradient(90deg, var(--bg-3) 25%, var(--bg-4) 50%, var(--bg-3) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.skeleton-text-sm {
		width: 120px;
		height: 16px;
		border-radius: 4px;
		background: linear-gradient(90deg, var(--bg-3) 25%, var(--bg-4) 50%, var(--bg-3) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.skeleton-text-xs {
		width: 70px;
		height: 14px;
		border-radius: 4px;
		background: linear-gradient(90deg, var(--bg-3) 25%, var(--bg-4) 50%, var(--bg-3) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.skeleton-address {
		width: 100%;
		height: 52px;
		border-radius: 12px;
		background: linear-gradient(90deg, var(--bg-3) 25%, var(--bg-4) 50%, var(--bg-3) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.skeleton-button {
		width: 100%;
		height: 48px;
		border-radius: 12px;
		background: linear-gradient(90deg, var(--bg-3) 25%, var(--bg-4) 50%, var(--bg-3) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.skeleton-banner {
		width: 100%;
		height: 48px;
		border-radius: 12px;
		background: linear-gradient(90deg, var(--bg-3) 25%, var(--bg-4) 50%, var(--bg-3) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	.selector-value {
		flex: 1;
	}

	.chain-dropdown {
		position: relative;
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		min-width: 200px;
		width: max-content;
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-popover);
		z-index: var(--z-dropdown);
		max-height: 280px;
		overflow-y: auto;
		padding: 6px;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 12px 14px;
		background: transparent;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		color: var(--text-0);
		cursor: pointer;
		transition: background 0.1s ease;
		text-align: left;
		white-space: nowrap;
	}

	.dropdown-item:hover {
		background: var(--bg-2);
	}

	.dropdown-item.selected {
		background: var(--primary-hover-bg);
	}

	.chain-name {
		flex: 1;
		font-weight: 500;
	}

	.chain-min {
		font-size: 12px;
		color: var(--text-3);
		margin-left: 12px;
	}

	.qr-section {
		display: flex;
		justify-content: center;
		padding: 4px 0;
	}

	.qr-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.qr-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-4);
		background: #ffffff;
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-qr);
	}

	.qr-canvas {
		display: block;
		border-radius: 4px;
	}

	.qr-chain-badge {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 44px;
		height: 44px;
		background: #ffffff;
		border-radius: var(--radius-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--shadow-qr-badge);
	}

	.qr-error {
		width: 180px;
		height: 180px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-3);
		font-size: 13px;
	}

	.qr-error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 32px;
	}

	.address-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.address-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.address-label {
		font-size: 14px;
		font-weight: 500;
		color: var(--text-1);
	}

	.terms-link {
		font-size: 13px;
		font-weight: 600;
		color: var(--primary);
		text-decoration: underline;
	}

	.terms-link:hover {
		opacity: 0.8;
	}

	.info-tooltip {
		color: var(--text-3);
		font-size: 14px;
		margin-left: 4px;
		cursor: help;
	}

	.address-text {
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 13px;
		color: var(--text-1);
		word-break: break-all;
		margin: 0;
		user-select: all;
		line-height: 1.5;
	}

	.copy-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		padding: 12px 16px;
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: 12px;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-1);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.copy-button:hover {
		background: var(--bg-3);
		border-color: var(--bg-5);
	}

	.copy-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.copy-button.success {
		background: color-mix(in srgb, var(--success) 8%, transparent);
		border-color: color-mix(in srgb, var(--success) 30%, transparent);
		color: var(--success);
	}

	.info-banner {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 12px 14px;
		border-radius: 12px;
		font-size: 13px;
		color: var(--text-1);
		line-height: 1.4;
	}

	.info-banner.warning {
		background: color-mix(in srgb, var(--warning) 12%, transparent);
		border: none;
	}

	.info-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		min-width: 18px;
		font-size: 10px;
		font-weight: 700;
		border-radius: 50%;
	}

	.info-icon.warning-icon {
		background: var(--warning);
		color: var(--bg-0);
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
		font-size: 15px;
		font-weight: 500;
		color: var(--danger);
		margin: 0;
	}

	.error-detail {
		font-size: 13px;
		color: var(--text-2);
		margin: 0;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 48px 24px;
		color: var(--text-2);
	}

	@media (prefers-reduced-motion: reduce) {
		.skeleton-circle,
		.skeleton-text,
		.skeleton-text-sm,
		.skeleton-text-xs,
		.skeleton-qr,
		.skeleton-address,
		.skeleton-button,
		.skeleton-banner {
			animation: none;
		}

		.selector-button,
		.copy-button,
		.dropdown-item {
			transition: none;
		}
	}
</style>
