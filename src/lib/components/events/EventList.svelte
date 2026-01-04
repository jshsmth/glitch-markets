<script lang="ts">
	import type { Event } from '$lib/server/api/polymarket-client';
	import EventCard from './EventCard.svelte';
	import ResolvedEventCard from './ResolvedEventCard.svelte';
	import ResolvedMultiEventCard from './ResolvedMultiEventCard.svelte';
	import { useScrollTrigger } from '$lib/composables/useScrollTrigger.svelte';

	interface Props {
		events: Event[];
		loading?: boolean;
		error?: Error | null;
		onRetry?: () => void;
		onLoadMore?: () => void | Promise<void>;
		hasMore?: boolean;
		loadMoreInterval?: number;
		loadMoreRootMargin?: string;
		title?: string;
	}

	let {
		events,
		loading = false,
		error = null,
		onRetry,
		onLoadMore,
		hasMore = false,
		loadMoreInterval = 500,
		loadMoreRootMargin = '200px',
		title = 'Trending'
	}: Props = $props();

	function isResolved(event: Event): boolean {
		return event.closed === true;
	}

	function isMultiMarket(event: Event): boolean {
		return (event.markets?.length || 0) > 1;
	}

	const scrollTrigger = useScrollTrigger({
		get onLoadMore() {
			return onLoadMore || (() => {});
		},
		get hasMore() {
			return hasMore;
		},
		get isLoading() {
			return loading;
		},
		get loadMoreInterval() {
			return loadMoreInterval;
		},
		get rootMargin() {
			return loadMoreRootMargin;
		}
	});
</script>

<div class="event-list-container">
	<h2 class="section-title">{title}</h2>
	{#if loading && events.length === 0}
		<div class="event-grid">
			{#each { length: 6 }, i (i)}
				<div class="skeleton skeleton-card"></div>
			{/each}
		</div>
	{:else if error}
		<div class="empty-state" role="alert" aria-live="polite">
			<div class="empty-icon" aria-hidden="true">⚠️</div>
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
				{#if isResolved(event)}
					{#if isMultiMarket(event)}
						<ResolvedMultiEventCard {event} />
					{:else}
						<ResolvedEventCard {event} />
					{/if}
				{:else}
					<EventCard {event} />
				{/if}
			{/each}
		</div>

		{#if hasMore}
			<div bind:this={scrollTrigger.sentinelRef} class="sentinel">
				{#if scrollTrigger.isLoadingMore}
					<div class="loading-dots">
						<span></span>
						<span></span>
						<span></span>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	@import '$lib/styles/skeleton.css';

	.event-list-container {
		width: 100%;
	}

	.section-title {
		font-size: 24px;
		font-weight: 700;
		color: var(--text-0);
		margin: 0;
		padding-bottom: var(--space-md);
		margin-bottom: var(--space-lg);
		border-bottom: 1px solid var(--bg-3);
	}

	@media (max-width: 640px) {
		.section-title {
			font-size: 20px;
			padding-bottom: var(--space-sm);
			margin-bottom: var(--space-md);
		}
	}

	.event-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 16px;
	}

	@media (min-width: 641px) {
		.event-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1025px) {
		.event-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.skeleton-card {
		min-height: 220px;
		border-radius: var(--radius-card);
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
		min-height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: var(--space-md);
	}

	.loading-dots {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: var(--space-sm);
	}

	.loading-dots span {
		width: 8px;
		height: 8px;
		background-color: var(--primary);
		border-radius: 50%;
		animation: dotPulse 1.4s ease-in-out infinite;
	}

	.loading-dots span:nth-child(1) {
		animation-delay: 0s;
	}

	.loading-dots span:nth-child(2) {
		animation-delay: 0.2s;
	}

	.loading-dots span:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes dotPulse {
		0%,
		80%,
		100% {
			opacity: 0.3;
			transform: scale(0.8);
		}
		40% {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
