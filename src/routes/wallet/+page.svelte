<svelte:head>
	<title>Wallet - Glitch Markets</title>
	<meta name="description" content="Manage your cash balance, deposits, and withdrawals" />
</svelte:head>

<div class="page-container">
	<h1>Wallet</h1>
</div>

<style>
	.page-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: var(--space-lg) var(--spacing-3);
	}

	@media (min-width: 768px) {
		.page-container {
			padding: var(--space-lg) var(--spacing-6);
		}
	}

	h1 {
		font-size: var(--h1-size);
		font-weight: var(--h1-weight);
		letter-spacing: var(--h1-tracking);
		color: var(--text-0);
	}
</style>
