<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys } from '$lib/query/client';
	import EventCard from './EventCard.svelte';
	import type { Event } from '$lib/server/api/polymarket-client';
	import { authState } from '$lib/stores/auth.svelte';
	import { openSignInModal } from '$lib/stores/modal.svelte';

	const watchlistQuery = createQuery<Event[]>(() => ({
		queryKey: [...queryKeys.watchlist.all],
		queryFn: async () => {
			const response = await fetch('/api/watchlist');

			if (response.status === 401) {
				return [];
			}

			if (!response.ok) {
				throw new Error('Failed to fetch watchlist');
			}

			return response.json();
		},
		enabled: !!authState.user,
		staleTime: 30000,
		gcTime: 5 * 60 * 1000
	}));

	const watchlistEvents = $derived(watchlistQuery.data || []);
	const hasBookmarks = $derived(watchlistEvents.length > 0);
</script>

{#if authState.user}
	{#if watchlistQuery.isLoading}
		<div class="watchlist-section">
			<h2 class="section-title">Your Watchlist</h2>
			<div class="watchlist-scroll">
				{#each { length: 3 }, i (i)}
					<div class="skeleton-card">
						<div class="skeleton-header">
							<div class="skeleton-icon"></div>
							<div class="skeleton-title"></div>
						</div>
						<div class="skeleton-text"></div>
						<div class="skeleton-text short"></div>
					</div>
				{/each}
			</div>
		</div>
	{:else if watchlistQuery.error}
		<div class="watchlist-section">
			<h2 class="section-title">Your Watchlist</h2>
			<div class="error-state">
				<p>Failed to load watchlist</p>
				<button class="retry-btn" onclick={() => watchlistQuery.refetch()}> Retry </button>
			</div>
		</div>
	{:else if hasBookmarks}
		<div class="watchlist-section">
			<div class="section-header">
				<h2 class="section-title">Your Watchlist</h2>
				<span class="bookmark-count">{watchlistEvents.length}</span>
			</div>
			<div class="watchlist-scroll">
				{#each watchlistEvents as event (event.id)}
					<div class="watchlist-card">
						<EventCard {event} variant="compact" />
					</div>
				{/each}
			</div>
		</div>
	{/if}
{:else}
	<div class="watchlist-section">
		<div class="auth-prompt">
			<div class="prompt-content">
				<h3>Create Your Watchlist</h3>
				<p>Sign in to bookmark markets and track your favorites</p>
				<button class="sign-in-btn" onclick={openSignInModal}> Sign In to Bookmark </button>
			</div>
		</div>
	</div>
{/if}

<style>
	.watchlist-section {
		margin-bottom: var(--space-2xl);
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		margin-bottom: var(--space-md);
	}

	.section-title {
		font-size: 20px;
		font-weight: 700;
		color: var(--text-0);
		margin: 0;
	}

	.bookmark-count {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 24px;
		height: 24px;
		padding: 0 8px;
		background: var(--primary-hover-bg);
		color: var(--primary);
		border-radius: var(--radius-full);
		font-size: 12px;
		font-weight: 600;
	}

	.watchlist-scroll {
		display: flex;
		gap: 12px;
		overflow-x: auto;
		overflow-y: hidden;
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		padding-bottom: 8px;
	}

	.watchlist-scroll::-webkit-scrollbar {
		display: none;
	}

	.watchlist-card {
		flex: 0 0 auto;
		width: 320px;
		scroll-snap-align: start;
	}

	@media (max-width: 640px) {
		.watchlist-card {
			width: 280px;
		}
	}

	.skeleton-card {
		flex: 0 0 auto;
		width: 320px;
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-card);
		padding: var(--spacing-3);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
	}

	.skeleton-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	.skeleton-icon {
		width: 32px;
		height: 32px;
		background: linear-gradient(90deg, var(--bg-2) 0%, var(--bg-3) 50%, var(--bg-2) 100%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: var(--radius-sm);
	}

	.skeleton-title {
		flex: 1;
		height: 16px;
		background: linear-gradient(90deg, var(--bg-2) 0%, var(--bg-3) 50%, var(--bg-2) 100%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: var(--radius-sm);
	}

	.skeleton-text {
		height: 12px;
		background: linear-gradient(90deg, var(--bg-2) 0%, var(--bg-3) 50%, var(--bg-2) 100%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: var(--radius-sm);
	}

	.skeleton-text.short {
		width: 60%;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-3);
		padding: var(--space-xl);
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-card);
	}

	.error-state p {
		color: var(--text-2);
		margin: 0;
	}

	.retry-btn {
		padding: var(--spacing-2) var(--spacing-4);
		background: var(--primary);
		color: var(--bg-0);
		border: none;
		border-radius: var(--radius-button);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.retry-btn:hover {
		background: var(--primary-hover);
	}

	.auth-prompt {
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--primary) 8%, var(--bg-1)),
			color-mix(in srgb, var(--primary) 3%, var(--bg-1))
		);
		border: 1px solid color-mix(in srgb, var(--primary) 15%, var(--bg-3));
		border-radius: var(--radius-card);
		padding: var(--space-xl);
	}

	.prompt-content {
		text-align: center;
		max-width: 400px;
		margin: 0 auto;
	}

	.prompt-content h3 {
		font-size: 18px;
		font-weight: 700;
		color: var(--text-0);
		margin: 0 0 var(--spacing-2) 0;
	}

	.prompt-content p {
		font-size: 14px;
		color: var(--text-2);
		margin: 0 0 var(--space-md) 0;
	}

	.sign-in-btn {
		padding: var(--spacing-3) var(--spacing-5);
		background: var(--primary);
		color: var(--bg-0);
		border: none;
		border-radius: var(--radius-button);
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-fast);
		min-height: var(--target-comfortable);
	}

	.sign-in-btn:hover {
		background: var(--primary-hover);
		transform: translateY(-1px);
	}

	.sign-in-btn:active {
		transform: translateY(0);
	}

	@media (max-width: 640px) {
		.section-title {
			font-size: 18px;
		}
	}
</style>
