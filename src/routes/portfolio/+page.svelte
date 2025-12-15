<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import ArrowDownIcon from '$lib/components/icons/ArrowDownIcon.svelte';
	import ArrowUpIcon from '$lib/components/icons/ArrowUpIcon.svelte';
	import MoneyIcon from '$lib/components/icons/MoneyIcon.svelte';
	import { openDepositModal, openWithdrawModal } from '$lib/stores/modal.svelte';
	import { authState } from '$lib/stores/auth.svelte';
	import { balanceState } from '$lib/stores/balance.svelte';
	import { goto } from '$app/navigation';

	const formattedBalance = $derived.by(() => {
		if (balanceState.isLoading) return '...';
		if (!balanceState.hasProxyWallet) return '$0.00';
		if (balanceState.balance === null) return '$0.00';

		const numBalance = parseFloat(balanceState.balance);
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(numBalance);
	});

	function handleDeposit() {
		openDepositModal();
	}

	function handleWithdraw() {
		openWithdrawModal();
	}

	$effect(() => {
		if (!authState.isInitializing && !authState.user) {
			goto('/');
		}
	});
</script>

<svelte:head>
	<title>Portfolio - Glitch Markets</title>
	<meta name="description" content="View your portfolio, positions, and trading history" />
</svelte:head>

<div class="page-container">
	<div class="cards-grid">
		<div class="portfolio-card">
			<div class="card-header">
				<span class="card-label">Portfolio</span>
				<div class="cash-badge">
					<MoneyIcon size={14} color="var(--success)" />
					<span>{formattedBalance}</span>
				</div>
			</div>

			<span class="value">{formattedBalance}</span>

			<div class="card-actions">
				<Button variant="primary" fullWidth onclick={handleDeposit}>
					{#snippet iconBefore()}
						<ArrowDownIcon size={18} color="currentColor" />
					{/snippet}
					Deposit
				</Button>
				<Button variant="secondary" fullWidth onclick={handleWithdraw}>
					{#snippet iconBefore()}
						<ArrowUpIcon size={18} color="currentColor" />
					{/snippet}
					Withdraw
				</Button>
			</div>
		</div>
	</div>
</div>

<style>
	.page-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: var(--space-lg) 12px;
	}

	@media (min-width: 768px) {
		.page-container {
			padding: var(--space-lg) 24px;
		}
	}

	.cards-grid {
		display: grid;
		gap: var(--space-md);
	}

	@media (min-width: 768px) {
		.cards-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.portfolio-card {
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-xl);
		padding: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.card-label {
		font-size: 14px;
		font-weight: 500;
		color: var(--text-2);
	}

	.cash-badge {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		background: var(--bg-2);
		border-radius: var(--radius-full);
		font-size: 13px;
		font-weight: 600;
		color: var(--text-1);
	}

	.value {
		font-size: 32px;
		font-weight: 600;
		color: var(--text-0);
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.card-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-top: auto;
	}
</style>
