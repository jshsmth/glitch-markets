<svelte:head>
	<title>Portfolio - Glitch Markets</title>
	<meta name="description" content="View your portfolio, positions, and trading history" />
</svelte:head>

<div class="page-container">
	<h1>Portfolio</h1>
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

	h1 {
		font-size: var(--h1-size);
		font-weight: var(--h1-weight);
		letter-spacing: var(--h1-tracking);
		color: var(--text-0);
		margin: 0;
	}
</style>
