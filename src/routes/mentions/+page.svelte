<script lang="ts">
	// Mentions markets page - markets where you've been mentioned or tagged
</script>

<div class="page-container">
	<div class="page-header">
		<h1>Mentions</h1>
		<p class="page-description">Markets where you've been mentioned or tagged</p>
	</div>

	<div class="content">
		<!-- Mentions-specific layout and filters will go here -->
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

	.page-header {
		margin-bottom: var(--space-lg);
	}

	h1 {
		font-size: var(--h1-size);
		font-weight: var(--h1-weight);
		letter-spacing: var(--h1-tracking);
		color: var(--text-0);
		margin: 0 0 var(--space-xs) 0;
	}

	.page-description {
		font-size: 16px;
		color: var(--text-2);
		margin: 0;
	}
</style>
