<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys } from '$lib/query/client';
	import EventCard from './EventCard.svelte';
	import type { Event } from '$lib/server/api/polymarket-client';
	import { authState } from '$lib/stores/auth.svelte';
	import { openSignInModal } from '$lib/stores/modal.svelte';
	import ChevronRightIcon from '$lib/components/icons/ChevronRightIcon.svelte';
	import ChevronLeftIcon from '$lib/components/icons/ChevronLeftIcon.svelte';

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

	let scrollContainer: HTMLElement | null = $state(null);
	let showLeftArrow = $state(false);
	let showRightArrow = $state(false);
	let showAllMode = $state(false);

	let currentPage = $state(0);
	const totalDots = $derived(watchlistEvents.length);

	function handleScroll() {
		if (!scrollContainer) return;

		const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
		showLeftArrow = scrollLeft > 20;
		showRightArrow = scrollLeft < scrollWidth - clientWidth - 20;

		const cardWidth = 320;
		const scrollPosition = scrollLeft + clientWidth / 2;
		currentPage = Math.floor(scrollPosition / cardWidth);
	}

	function scrollLeft() {
		if (!scrollContainer) return;
		scrollContainer.scrollBy({ left: -340, behavior: 'smooth' });
	}

	function scrollRight() {
		if (!scrollContainer) return;
		scrollContainer.scrollBy({ left: 340, behavior: 'smooth' });
	}

	function toggleShowAll() {
		showAllMode = !showAllMode;
	}
</script>

{#if authState.user}
	{#if watchlistQuery.isLoading}
		<div class="watchlist-section">
			<div class="section-header">
				<h2 class="section-title">Your Watchlist</h2>
			</div>
			<div class="watchlist-scroll">
				{#each { length: 3 }, i (i)}
					<div class="skeleton skeleton-card"></div>
				{/each}
			</div>
		</div>
	{:else if watchlistQuery.error}
		<div class="watchlist-section">
			<div class="section-header">
				<h2 class="section-title">Your Watchlist</h2>
			</div>
			<div class="error-state">
				<p>Failed to load watchlist</p>
				<button class="retry-btn" onclick={() => watchlistQuery.refetch()}> Retry </button>
			</div>
		</div>
	{:else if hasBookmarks}
		<div class="watchlist-section">
			<div class="section-header">
				<div class="title-group">
					<h2 class="section-title">Your Watchlist</h2>
					<span class="bookmark-count">{watchlistEvents.length}</span>
				</div>
				{#if watchlistEvents.length > 3}
					<button class="see-all-btn" onclick={toggleShowAll}>
						{showAllMode ? 'Show Less' : 'See All'}
						<ChevronRightIcon size={16} />
					</button>
				{/if}
			</div>

			<div class="watchlist-container">
				{#if showLeftArrow}
					<button
						class="scroll-arrow scroll-arrow-left"
						onclick={scrollLeft}
						aria-label="Scroll left"
					>
						<ChevronLeftIcon size={24} />
					</button>
				{/if}

				<div
					class="watchlist-scroll"
					class:show-all={showAllMode}
					bind:this={scrollContainer}
					onscroll={handleScroll}
				>
					{#each watchlistEvents as event, i (event.id)}
						<div class="watchlist-card" style="animation-delay: {i * 50}ms">
							<EventCard {event} variant="compact" />
						</div>
					{/each}
				</div>

				{#if showRightArrow && !showAllMode}
					<button
						class="scroll-arrow scroll-arrow-right"
						onclick={scrollRight}
						aria-label="Scroll right"
					>
						<ChevronRightIcon size={24} />
					</button>
				{/if}

				{#if !showAllMode}
					<div class="scroll-fade scroll-fade-left" class:visible={showLeftArrow}></div>
					<div class="scroll-fade scroll-fade-right" class:visible={showRightArrow}></div>
				{/if}
			</div>

			{#if !showAllMode && totalDots > 1}
				<div class="pagination-dots">
					{#each Array.from({ length: Math.min(totalDots, 10) }, (_, i) => i) as i (i)}
						<div class="dot" class:active={i === currentPage}></div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
{:else}
	<div class="watchlist-section">
		<div class="auth-prompt">
			<div class="prompt-content">
				<h3>Create Your Watchlist</h3>
				<p>Sign in to bookmark markets and track your favorites</p>
				<button class="sign-in-btn" onclick={() => openSignInModal()}> Sign In to Bookmark </button>
			</div>
		</div>
	</div>
{/if}

<style>
	@import '$lib/styles/skeleton.css';

	.watchlist-section {
		margin-bottom: var(--space-lg);
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-md);
	}

	.title-group {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
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

	.see-all-btn {
		display: flex;
		align-items: center;
		gap: var(--spacing-1);
		padding: var(--spacing-2) var(--spacing-3);
		background: transparent;
		color: var(--primary);
		border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
		border-radius: var(--radius-button);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.see-all-btn:hover {
		background: var(--primary-hover-bg);
		border-color: var(--primary);
	}

	.see-all-btn:active {
		transform: scale(0.98);
	}

	.watchlist-container {
		position: relative;
	}

	.watchlist-scroll {
		display: flex;
		gap: 12px;
		overflow-x: auto;
		overflow-y: visible;
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		padding-top: 4px;
		padding-bottom: 8px;
		margin-top: -4px;
		transition: all var(--transition-normal);
	}

	.watchlist-scroll.show-all {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		overflow-x: visible;
		scroll-snap-type: none;
		gap: 12px;
	}

	.watchlist-scroll::-webkit-scrollbar {
		display: none;
	}

	.watchlist-card {
		flex: 0 0 auto;
		width: 320px;
		scroll-snap-align: start;
		animation: slideIn 0.3s ease-out;
		animation-fill-mode: both;
	}

	.show-all .watchlist-card {
		width: auto;
		animation: fadeIn 0.3s ease-out;
		animation-fill-mode: both;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(-20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* Desktop scroll arrows */
	.scroll-arrow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 40px;
		height: 40px;
		display: none;
		align-items: center;
		justify-content: center;
		background: var(--bg-0);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-full);
		cursor: pointer;
		z-index: 10;
		transition: all var(--transition-fast);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.scroll-arrow:hover {
		background: var(--bg-1);
		border-color: var(--primary);
		transform: translateY(-50%) scale(1.05);
	}

	.scroll-arrow:active {
		transform: translateY(-50%) scale(0.95);
	}

	.scroll-arrow-left {
		left: -20px;
	}

	.scroll-arrow-right {
		right: -20px;
	}

	/* Show arrows on desktop when scrollable */
	@media (min-width: 1024px) {
		.scroll-arrow {
			display: flex;
		}
	}

	/* Gradient fade indicators */
	.scroll-fade {
		position: absolute;
		top: 0;
		bottom: 8px;
		width: 60px;
		pointer-events: none;
		opacity: 0;
		transition: opacity var(--transition-normal);
		z-index: 5;
	}

	.scroll-fade.visible {
		opacity: 1;
	}

	.scroll-fade-left {
		left: 0;
		background: linear-gradient(to right, var(--bg-0), transparent);
	}

	.scroll-fade-right {
		right: 0;
		background: linear-gradient(to left, var(--bg-0), transparent);
	}

	/* Pagination dots */
	.pagination-dots {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: var(--spacing-3);
	}

	.dot {
		width: 6px;
		height: 6px;
		background: var(--bg-3);
		border-radius: var(--radius-full);
		transition: all var(--transition-fast);
	}

	.dot.active {
		width: 20px;
		background: var(--primary);
	}

	/* Hide dots on desktop */
	@media (min-width: 768px) {
		.pagination-dots {
			display: none;
		}
	}

	/* Watchlist card hover effects */
	.watchlist-card {
		transition: transform var(--transition-fast);
	}

	@media (hover: hover) {
		.watchlist-card:hover {
			transform: translateY(-2px);
		}
	}

	@media (max-width: 640px) {
		.watchlist-card {
			width: 280px;
		}

		.see-all-btn {
			font-size: 13px;
			padding: var(--spacing-1) var(--spacing-2);
		}

		.section-title {
			font-size: 18px;
		}
	}

	.skeleton-card {
		flex: 0 0 auto;
		width: 320px;
		min-height: 200px;
		border-radius: var(--radius-card);
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
