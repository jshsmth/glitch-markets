<script lang="ts">
	import { authState } from '$lib/stores/auth.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	// Placeholder data
	const cashBalance = $state('$0.00');
	const pendingDeposits = $state('$0.00');
	const pendingWithdrawals = $state('$0.00');

	function handleDeposit() {
		// TODO: Open deposit modal
		console.log('Deposit clicked');
	}

	function handleWithdraw() {
		// TODO: Open withdraw modal
		console.log('Withdraw clicked');
	}
</script>

<svelte:head>
	<title>Wallet - Glitch Markets</title>
	<meta name="description" content="Manage your cash balance, deposits, and withdrawals" />
</svelte:head>

<div class="wallet-page">
	<header class="page-header">
		<h1>Wallet</h1>
		{#if authState.user}
			<p class="user-email">{authState.user.email || 'Welcome'}</p>
		{/if}
	</header>

	<div class="balance-section">
		<div class="balance-card main">
			<div class="card-label">Available Cash</div>
			<div class="card-value">{cashBalance}</div>
			<div class="card-actions">
				<Button variant="primary" onclick={handleDeposit}>Deposit</Button>
				<Button variant="secondary" onclick={handleWithdraw}>Withdraw</Button>
			</div>
		</div>

		<div class="balance-grid">
			<div class="balance-card">
				<div class="card-label">Pending Deposits</div>
				<div class="card-value small">{pendingDeposits}</div>
			</div>

			<div class="balance-card">
				<div class="card-label">Pending Withdrawals</div>
				<div class="card-value small">{pendingWithdrawals}</div>
			</div>
		</div>
	</div>

	<section class="transactions-section">
		<h2>Recent Transactions</h2>
		<div class="empty-state">
			<div class="empty-icon">💰</div>
			<h3>No transactions yet</h3>
			<p>Your deposit and withdrawal history will appear here</p>
		</div>
	</section>
</div>

<style>
	.wallet-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-lg) 0;
	}

	.page-header {
		margin-bottom: var(--space-xl);
	}

	.page-header h1 {
		font-size: var(--h1-size);
		font-weight: var(--h1-weight);
		letter-spacing: var(--h1-tracking);
		color: var(--text-0);
		margin-bottom: var(--space-xs);
	}

	.user-email {
		font-size: var(--body-sm-size);
		color: var(--text-2);
		margin: 0;
	}

	/* Balance Section */
	.balance-section {
		margin-bottom: var(--space-xl);
	}

	.balance-card {
		background-color: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-card);
		padding: var(--space-lg);
	}

	.balance-card.main {
		margin-bottom: var(--space-md);
	}

	.card-label {
		font-size: var(--caption-size);
		font-weight: var(--caption-weight);
		letter-spacing: var(--caption-tracking);
		text-transform: uppercase;
		color: var(--text-2);
		margin-bottom: var(--space-xs);
	}

	.card-value {
		font-size: var(--h1-size);
		font-weight: var(--h1-weight);
		letter-spacing: var(--h1-tracking);
		color: var(--text-0);
		font-family: var(--font-mono);
		margin-bottom: var(--space-lg);
	}

	.card-value.small {
		font-size: var(--h3-size);
		margin-bottom: 0;
	}

	.card-actions {
		display: flex;
		gap: var(--space-sm);
	}

	.balance-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-md);
	}

	/* Transactions Section */
	.transactions-section {
		margin-bottom: var(--space-xl);
	}

	.transactions-section h2 {
		font-size: var(--h3-size);
		font-weight: var(--h3-weight);
		letter-spacing: var(--h3-tracking);
		color: var(--text-0);
		margin-bottom: var(--space-lg);
	}

	/* Empty State */
	.empty-state {
		background-color: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-card);
		padding: var(--space-2xl);
		text-align: center;
	}

	.empty-icon {
		font-size: 48px;
		margin-bottom: var(--space-md);
	}

	.empty-state h3 {
		font-size: var(--h4-size);
		font-weight: var(--h4-weight);
		color: var(--text-0);
		margin-bottom: var(--space-xs);
	}

	.empty-state p {
		font-size: var(--body-sm-size);
		color: var(--text-2);
		margin: 0;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.card-actions {
			flex-direction: column;
		}

		.balance-grid {
			grid-template-columns: 1fr;
		}

		.card-value {
			font-size: var(--h2-size);
		}
	}
</style>
