<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { UsdcIcon, PolygonIcon } from '$lib/components/icons/chains';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	let amount = $state('');
	let destinationAddress = $state('');
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	let availableBalance = $state(0);
	let networkFee = $derived(amount && parseFloat(amount) > 0 ? 0.1 : 0);

	let isValidAmount = $derived.by(() => {
		const numAmount = parseFloat(amount);
		return !isNaN(numAmount) && numAmount > 0 && numAmount <= availableBalance;
	});

	let isValidAddress = $derived.by(() => {
		return destinationAddress.length === 42 && destinationAddress.startsWith('0x');
	});

	let canSubmit = $derived(isValidAmount && isValidAddress && !isLoading);

	let receiveAmount = $derived.by(() => {
		const numAmount = parseFloat(amount);
		if (isNaN(numAmount) || numAmount <= 0) return 0;
		return Math.max(0, numAmount - networkFee);
	});

	function handleMaxClick() {
		amount = availableBalance.toString();
	}

	function handleAmountChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const value = input.value;
		if (value === '' || /^\d*\.?\d*$/.test(value)) {
			amount = value;
		}
	}

	async function handleWithdraw() {
		if (!canSubmit) return;

		isLoading = true;
		error = null;

		try {
			// TODO: Call /api/withdraw endpoint
			await new Promise((resolve) => setTimeout(resolve, 1500));
			handleClose();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to process withdrawal';
		} finally {
			isLoading = false;
		}
	}

	function handleClose() {
		amount = '';
		destinationAddress = '';
		error = null;
		isLoading = false;
		onClose();
	}
</script>

{#snippet modalContent()}
	<div class="withdraw-modal-content">
		<div class="balance-section">
			<div class="balance-row">
				<span class="balance-label">Available balance</span>
				<div class="balance-value">
					<UsdcIcon size={18} />
					<span>${availableBalance.toFixed(2)}</span>
				</div>
			</div>
		</div>

		<div class="input-section">
			<label class="input-label" for="withdraw-amount">Amount</label>
			<div class="input-wrapper">
				<div class="input-prefix">
					<UsdcIcon size={20} />
				</div>
				<input
					id="withdraw-amount"
					type="text"
					inputmode="decimal"
					placeholder="0.00"
					value={amount}
					oninput={handleAmountChange}
					class="amount-input"
					disabled={isLoading}
				/>
				<button
					type="button"
					class="max-button"
					onclick={handleMaxClick}
					disabled={isLoading || availableBalance === 0}
				>
					MAX
				</button>
			</div>
		</div>

		<div class="input-section">
			<label class="input-label" for="destination-address">Destination address</label>
			<div class="input-wrapper address-wrapper">
				<input
					id="destination-address"
					type="text"
					placeholder="0x..."
					bind:value={destinationAddress}
					class="address-input"
					disabled={isLoading}
					spellcheck="false"
					autocomplete="off"
				/>
			</div>
			<span class="input-hint">Enter the Polygon wallet address to receive USDC</span>
		</div>

		<div class="summary-section">
			<div class="summary-row">
				<span class="summary-label">Network</span>
				<div class="summary-value">
					<PolygonIcon size={16} color="#8247E5" />
					<span>Polygon</span>
				</div>
			</div>
			<div class="summary-row">
				<span class="summary-label">Network fee</span>
				<span class="summary-value fee">${networkFee.toFixed(2)}</span>
			</div>
			<div class="summary-row total">
				<span class="summary-label">You'll receive</span>
				<span class="summary-value">${receiveAmount.toFixed(2)}</span>
			</div>
		</div>

		{#if error}
			<div class="error-banner" role="alert">
				<span class="error-icon">!</span>
				<span>{error}</span>
			</div>
		{/if}

		{#if availableBalance === 0}
			<div class="info-banner">
				<span class="info-icon">i</span>
				<span>You don't have any funds to withdraw. Deposit USDC first to start trading.</span>
			</div>
		{/if}

		<Button
			variant="primary"
			fullWidth
			size="large"
			onclick={handleWithdraw}
			disabled={!canSubmit || availableBalance === 0}
			loading={isLoading}
		>
			{isLoading ? 'Processing...' : 'Withdraw'}
		</Button>
	</div>
{/snippet}

<Modal {isOpen} onClose={handleClose} title="Withdraw USDC" maxWidth="480px">
	{@render modalContent()}
</Modal>

<style>
	.withdraw-modal-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
		padding-top: var(--spacing-2);
	}

	.balance-section {
		background: var(--bg-2);
		border-radius: var(--radius-lg);
		padding: var(--spacing-4);
	}

	.balance-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.balance-label {
		font-size: var(--text-md);
		color: var(--text-2);
	}

	.balance-value {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		color: var(--text-0);
	}

	.input-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
	}

	.input-label {
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		color: var(--text-1);
	}

	.input-wrapper {
		display: flex;
		align-items: center;
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-lg);
		padding: var(--spacing-1);
		transition: border-color var(--transition-fast);
	}

	.input-wrapper:focus-within {
		border-color: var(--primary);
	}

	.input-prefix {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 var(--spacing-3);
	}

	.amount-input {
		flex: 1;
		background: transparent;
		border: none;
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: var(--text-0);
		padding: var(--spacing-3) 0;
		outline: none;
		min-width: 0;
	}

	.amount-input::placeholder {
		color: var(--text-3);
	}

	.amount-input:disabled {
		opacity: 0.6;
	}

	.max-button {
		background: var(--primary-hover-bg);
		border: none;
		border-radius: var(--radius-md);
		padding: var(--spacing-2) var(--spacing-3);
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		color: var(--primary);
		cursor: pointer;
		transition: all var(--transition-fast);
		margin-right: var(--spacing-2);
	}

	.max-button:hover:not(:disabled) {
		background: var(--primary-hover-bg-medium);
	}

	.max-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.address-wrapper {
		padding: var(--spacing-1) var(--spacing-4);
	}

	.address-input {
		flex: 1;
		background: transparent;
		border: none;
		font-size: var(--text-md);
		font-family: var(--font-mono);
		color: var(--text-0);
		padding: var(--spacing-3) 0;
		outline: none;
		min-width: 0;
	}

	.address-input::placeholder {
		color: var(--text-3);
		font-family: inherit;
	}

	.address-input:disabled {
		opacity: 0.6;
	}

	.input-hint {
		font-size: var(--text-sm);
		color: var(--text-3);
	}

	.summary-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3);
		padding: var(--spacing-4);
		background: var(--bg-2);
		border-radius: var(--radius-lg);
	}

	.summary-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.summary-row.total {
		padding-top: var(--spacing-3);
		border-top: 1px solid var(--bg-4);
	}

	.summary-label {
		font-size: var(--text-md);
		color: var(--text-2);
	}

	.summary-value {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: var(--text-md);
		font-weight: var(--font-semibold);
		color: var(--text-0);
	}

	.summary-value.fee {
		color: var(--text-2);
	}

	.summary-row.total .summary-label {
		font-weight: var(--font-semibold);
		color: var(--text-1);
	}

	.summary-row.total .summary-value {
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
	}

	.error-banner {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-3);
		padding: var(--spacing-3) var(--spacing-4);
		background: color-mix(in srgb, var(--danger) 12%, transparent);
		border-radius: var(--radius-lg);
		font-size: var(--text-sm);
		color: var(--danger);
		line-height: 1.4;
	}

	.error-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		min-width: 18px;
		font-size: var(--text-xs);
		font-weight: var(--font-bold);
		border-radius: var(--radius-full);
		background: var(--danger);
		color: var(--bg-0);
	}

	.info-banner {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-3);
		padding: var(--spacing-3) var(--spacing-4);
		background: color-mix(in srgb, var(--primary) 10%, transparent);
		border-radius: var(--radius-lg);
		font-size: var(--text-sm);
		color: var(--text-1);
		line-height: 1.4;
	}

	.info-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		min-width: 18px;
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		border-radius: var(--radius-full);
		background: var(--primary);
		color: var(--bg-0);
	}

	@media (prefers-reduced-motion: reduce) {
		.input-wrapper,
		.max-button {
			transition: none;
		}
	}
</style>
