<script lang="ts">
	import type { Event } from '$lib/server/api/polymarket-client';
	import EventCard from './EventCard.svelte';

	interface Props {
		events: Event[];
		loading?: boolean;
		error?: Error | null;
		onRetry?: () => void;
		onLoadMore?: () => void | Promise<void>;
		hasMore?: boolean;
	}

	let {
		events,
		loading = false,
		error = null,
		onRetry,
		onLoadMore,
		hasMore = false
	}: Props = $props();

	let sentinel: HTMLDivElement | undefined = $state();
	let loadingMore = $state(false);

	$effect(() => {
		if (!sentinel || !onLoadMore || !hasMore) return;

		const observer = new IntersectionObserver(
			async (entries) => {
				const entry = entries[0];
				if (entry.isIntersecting && !loadingMore && !loading && hasMore && onLoadMore) {
					loadingMore = true;
					try {
						await onLoadMore();
					} finally {
						loadingMore = false;
					}
				}
			},
			{
				rootMargin: '200px'
			}
		);

		observer.observe(sentinel);

		return () => {
			observer.disconnect();
		};
	});
</script>

<div class="event-list-container">
	{#if loading && events.length === 0}
		<div class="event-grid">
			{#each { length: 6 }, i (i)}
				<div class="skeleton-card">
					<div class="skeleton-header">
						<div class="skeleton-icon"></div>
						<div class="skeleton-title"></div>
					</div>
					<div class="skeleton-text"></div>
					<div class="skeleton-text short"></div>
					<div class="skeleton-stats">
						<div class="skeleton-stat"></div>
						<div class="skeleton-stat"></div>
						<div class="skeleton-stat"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if error}
		<div class="empty-state">
			<div class="empty-icon">⚠️</div>
			<h3>Failed to load events</h3>
			<p>{error.message || 'An unexpected error occurred'}</p>
			{#if onRetry}
				<button class="retry-button" onclick={onRetry}>Retry</button>
			{/if}
		</div>
	{:else if events.length === 0}
		<div class="empty-state">
			<div class="empty-icon">🔍</div>
			<h3>No events found</h3>
			<p>Try adjusting your filters or check back later for new events.</p>
		</div>
	{:else}
		<div class="event-grid">
			{#each events as event (event.id)}
				<EventCard {event} />
			{/each}
		</div>

		{#if hasMore}
			<div bind:this={sentinel} class="sentinel">
				{#if loadingMore}
					<div class="loading-more">
						<div class="spinner"></div>
						<p>Loading more events...</p>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.event-list-container {
		width: 100%;
	}

	.event-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-md);
	}

	@media (max-width: 768px) {
		.event-grid {
			grid-template-columns: 1fr;
			gap: var(--space-sm);
		}
	}

	@media (min-width: 769px) and (max-width: 1024px) {
		.event-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	/* Loading skeleton styles */
	.skeleton-card {
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-card);
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.skeleton-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-xs);
	}

	.skeleton-icon {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		background: linear-gradient(90deg, var(--bg-2) 0%, var(--bg-3) 50%, var(--bg-2) 100%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: var(--radius-sm);
	}

	.skeleton-title {
		flex: 1;
		height: 18px;
		background: linear-gradient(90deg, var(--bg-2) 0%, var(--bg-3) 50%, var(--bg-2) 100%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: var(--radius-sm);
	}

	.skeleton-text {
		height: 14px;
		background: linear-gradient(90deg, var(--bg-2) 0%, var(--bg-3) 50%, var(--bg-2) 100%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: var(--radius-sm);
	}

	.skeleton-text.short {
		width: 45%;
	}

	.skeleton-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-lg);
		margin-top: var(--space-sm);
	}

	.skeleton-stat {
		height: 36px;
		background: linear-gradient(90deg, var(--bg-2) 0%, var(--bg-3) 50%, var(--bg-2) 100%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: var(--radius-sm);
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	/* Empty state styles */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-2xl) var(--space-lg);
		text-align: center;
		min-height: 400px;
	}

	.empty-icon {
		font-size: 64px;
		margin-bottom: var(--space-md);
		opacity: 0.5;
	}

	.empty-state h3 {
		font-size: 24px;
		font-weight: 600;
		color: var(--text-0);
		margin: 0 0 var(--space-sm) 0;
	}

	.empty-state p {
		font-size: 16px;
		color: var(--text-2);
		margin: 0 0 var(--space-lg) 0;
		max-width: 400px;
	}

	.retry-button {
		padding: var(--space-sm) var(--space-lg);
		background: var(--primary);
		color: var(--bg-0);
		border: none;
		border-radius: var(--radius-button);
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: background var(--transition-fast);
		min-height: var(--target-comfortable);
	}

	.retry-button:hover {
		background: var(--primary-hover);
	}

	.retry-button:active {
		background: var(--primary-active);
	}

	/* Infinite scroll styles */
	.sentinel {
		min-height: 100px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: var(--space-lg);
	}

	.loading-more {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-lg);
	}

	.loading-more p {
		font-size: 14px;
		color: var(--text-2);
		margin: 0;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--bg-3);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
