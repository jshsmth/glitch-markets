<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="error-container">
	<div class="error-content">
		<h1>{$page.status}</h1>
		<p class="error-message">{$page.error?.message || 'Something went wrong'}</p>
		<a href="/" class="home-link">Go home</a>
	</div>
</div>

<style>
	.error-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-6);
		background: var(--bg-0);
	}

	.error-content {
		text-align: center;
		max-width: 500px;
	}

	h1 {
		font-size: 4rem;
		font-weight: 700;
		color: var(--primary);
		margin-bottom: var(--spacing-4);
	}

	.error-message {
		font-size: 1.125rem;
		color: var(--text-1);
		margin-bottom: var(--spacing-8);
	}

	.home-link {
		display: inline-block;
		padding: var(--spacing-3) var(--spacing-6);
		background: var(--primary);
		color: var(--bg-0);
		border-radius: var(--radius-md);
		text-decoration: none;
		font-weight: 600;
		transition: var(--transition-colors);
	}

	.home-link:hover {
		background: var(--primary-hover);
	}
</style>
