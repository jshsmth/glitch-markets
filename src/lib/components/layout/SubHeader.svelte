<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { ChevronLeftIcon, ChevronRightIcon } from '$lib/components/icons';
	import { categories, SCROLL_AMOUNT, SCROLL_THRESHOLD } from '$lib/config/categories';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { EXCLUDED_SPORTS_TAG_IDS, appendExcludedTags } from '$lib/config/filters';

	let activeCategory = $derived.by(() => {
		const pathname = $page.url.pathname;
		if (pathname === '/') return 'trending';
		const pathCategory = pathname.slice(1);
		if (pathCategory === 'pop-culture') return 'culture';
		return pathCategory;
	});
	let scrollContainer = $state<HTMLDivElement>();
	let showSwipeHint = $state(false);
	let hasOverflow = $state(false);
	let canScrollLeft = $state(false);
	let canScrollRight = $state(false);

	const queryClient = useQueryClient();

	const categoryTagMap: Record<string, string> = {
		'/politics': 'politics',
		'/finance': 'finance',
		'/tech': 'tech',
		'/pop-culture': 'pop-culture',
		'/world': 'world',
		'/economy': 'economy',
		'/geopolitics': 'geopolitics'
	};

	async function prefetchCategoryData(href: string) {
		if (!browser) return;

		const tagSlug = categoryTagMap[href];
		if (tagSlug) {
			await queryClient.prefetchInfiniteQuery({
				queryKey: ['events', tagSlug.replace('/', ''), tagSlug, 'active', 'volume24hr'],
				queryFn: async () => {
					const params = new SvelteURLSearchParams({
						tag_slug: tagSlug,
						archived: 'false',
						order: 'volume24hr',
						ascending: 'false',
						limit: '20',
						offset: '0',
						active: 'true',
						closed: 'false'
					});
					const res = await fetch(`/api/events?${params}`);
					if (!res.ok) throw new Error('Failed to fetch');
					return res.json();
				},
				initialPageParam: 0
			});

			await queryClient.prefetchQuery({
				queryKey: ['tags', tagSlug.replace('/', ''), 'related'],
				queryFn: async () => {
					const res = await fetch(`/api/tags/slug/${tagSlug}/related`);
					if (!res.ok) throw new Error('Failed to fetch');
					return res.json();
				}
			});
		} else if (href === '/') {
			await queryClient.prefetchQuery({
				queryKey: ['events', 'all', 0],
				queryFn: async () => {
					const params = new SvelteURLSearchParams({
						limit: '20',
						active: 'true',
						archived: 'false',
						closed: 'false',
						order: 'volume24hr',
						ascending: 'false',
						offset: '0'
					});
					appendExcludedTags(params, EXCLUDED_SPORTS_TAG_IDS);
					const res = await fetch(`/api/events?${params}`);
					if (!res.ok) throw new Error('Failed to fetch');
					return res.json();
				}
			});
		} else if (href === '/new') {
			await queryClient.prefetchQuery({
				queryKey: ['events', 'all', 0],
				queryFn: async () => {
					const params = new SvelteURLSearchParams({
						limit: '20',
						active: 'true',
						archived: 'false',
						closed: 'false',
						order: 'startDate',
						ascending: 'false',
						offset: '0'
					});
					params.append('exclude_tag_id', '100639');
					params.append('exclude_tag_id', '102169');
					const res = await fetch(`/api/events?${params}`);
					if (!res.ok) throw new Error('Failed to fetch');
					return res.json();
				}
			});
		}
	}

	function handleCategoryHover(href: string) {
		prefetchCategoryData(href).catch(() => {});
	}

	function handleScroll() {
		if (!scrollContainer) return;

		const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
		hasOverflow = scrollWidth > clientWidth;
		canScrollLeft = scrollLeft > SCROLL_THRESHOLD;
		canScrollRight = scrollLeft < scrollWidth - clientWidth - SCROLL_THRESHOLD;

		if (scrollLeft > SCROLL_THRESHOLD) {
			showSwipeHint = false;
		}
	}

	function scrollLeft() {
		if (!scrollContainer) return;
		scrollContainer.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
	}

	function scrollRight() {
		if (!scrollContainer) return;
		scrollContainer.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
	}

	$effect(() => {
		if (!scrollContainer) return;

		handleScroll();

		const resizeObserver = new ResizeObserver(() => {
			handleScroll();
		});

		resizeObserver.observe(scrollContainer);

		return () => {
			resizeObserver.disconnect();
		};
	});

	$effect(() => {
		if (!hasOverflow) return;

		showSwipeHint = true;
		const timeout = setTimeout(() => {
			showSwipeHint = false;
		}, 3000);

		return () => clearTimeout(timeout);
	});
</script>

<div class="sub-header">
	<nav class="nav-container">
		{#if canScrollLeft}
			<button class="nav-arrow nav-arrow-left" onclick={scrollLeft} aria-label="Scroll left">
				<ChevronLeftIcon size={20} />
			</button>
		{/if}

		<div class="nav-scroll" bind:this={scrollContainer} onscroll={handleScroll}>
			<ul class="nav-list">
				{#each categories as category (category.name)}
					<li class="nav-item">
						<a
							href={category.href}
							class="nav-link"
							class:active={activeCategory === category.name.toLowerCase()}
							data-sveltekit-preload-data="hover"
							onmouseenter={() => handleCategoryHover(category.href)}
						>
							{#if category.icon}
								{@const Icon = category.icon}
								<Icon size={16} />
							{/if}
							{category.name}
						</a>
					</li>
					{#if category.showDivider}
						<li class="nav-divider" aria-hidden="true"></li>
					{/if}
				{/each}
			</ul>

			{#if showSwipeHint}
				<div class="swipe-hint">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
						<path
							d="M9 18L15 12L9 6"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
			{/if}
		</div>

		{#if canScrollRight}
			<button class="nav-arrow nav-arrow-right" onclick={scrollRight} aria-label="Scroll right">
				<ChevronRightIcon size={20} />
			</button>
		{/if}
	</nav>
</div>

<style>
	.sub-header {
		display: none; /* Hidden on mobile - use bottom nav Explore tab */
		background-color: var(--bg-0);
		border-bottom: 1px solid var(--bg-4);
		padding: 10px 0;
	}

	@media (min-width: 768px) {
		.sub-header {
			display: block; /* Show on desktop */
			padding: 12px 0;
		}
	}

	.nav-container {
		position: relative;
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.nav-arrow {
		display: none; /* Hidden on mobile - swipe instead */
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-md);
		padding: var(--spacing-2); /* 8px */
		cursor: pointer;
		color: var(--text-1);
		transition: var(--transition-colors);
		flex-shrink: 0;
		height: 36px;
		width: 36px;
		align-items: center;
		justify-content: center;
	}

	.nav-arrow:hover {
		background: var(--bg-2);
		border-color: var(--primary);
		color: var(--text-0);
	}

	.nav-arrow:active {
		background: var(--bg-3);
	}

	.nav-arrow:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.nav-link:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.nav-scroll {
		position: relative;
		overflow-x: auto;
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE/Edge */
		-webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
		flex: 1;
		padding: 0 max(12px, env(safe-area-inset-right, 12px)) 0
			max(12px, env(safe-area-inset-left, 12px));
	}

	@media (min-width: 768px) {
		.nav-scroll {
			padding: 0 28px;
		}
	}

	.nav-scroll::-webkit-scrollbar {
		display: none;
	}

	.nav-list {
		display: flex;
		align-items: center;
		gap: 6px;
		list-style: none;
		margin: 0;
		padding: 0;
		padding-right: max(12px, env(safe-area-inset-right, 12px));
		min-height: 40px;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		text-decoration: none;
		color: var(--text-2);
		font-size: var(--text-md);
		font-weight: var(--font-semibold);
		white-space: nowrap;
		padding: var(--spacing-2) var(--spacing-4);
		border-radius: var(--radius-md);
		transition: all var(--transition-base);
	}

	.nav-link:hover {
		color: var(--text-0);
		background-color: var(--bg-2);
	}

	.nav-link:hover :global(svg) {
		transform: scale(1.1);
		transition: transform var(--transition-base);
	}

	.nav-link.active {
		color: var(--text-0);
		font-weight: var(--font-bold);
	}

	.nav-link :global(svg) {
		flex-shrink: 0;
		transition: transform var(--transition-base);
	}

	.nav-divider {
		width: 1px;
		height: 20px;
		background-color: var(--bg-4);
		margin: 0 4px;
		flex-shrink: 0;
	}

	/* Swipe Hint - Mobile only */
	.swipe-hint {
		display: flex;
		align-items: center;
		justify-content: center;
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		width: 48px;
		background: linear-gradient(to left, var(--bg-0) 60%, transparent);
		color: var(--text-1);
		animation: swipeAnimation 1.5s ease-in-out infinite;
		pointer-events: none;
		z-index: var(--z-sticky);
	}

	@keyframes swipeAnimation {
		0%,
		100% {
			opacity: 0.8;
		}
		50% {
			opacity: 0.4;
		}
	}

	.swipe-hint svg {
		filter: drop-shadow(var(--shadow-xs));
	}

	/* Desktop styles */
	@media (min-width: 768px) {
		.nav-arrow {
			display: flex; /* Show arrows on desktop */
		}

		.nav-scroll {
			padding: 0 var(--spacing-6); /* 24px */
		}

		.nav-list {
			gap: var(--space-xs); /* 8px - consistent spacing on desktop */
			min-height: var(--target-comfortable); /* 44px - consistent with mobile */
		}

		.nav-link {
			min-height: var(--target-comfortable); /* 44px - consistent with mobile */
		}

		/* Hide swipe hint on desktop */
		.swipe-hint {
			display: none;
		}
	}

	@media (min-width: 1024px) {
		.nav-list {
			gap: var(--space-xs); /* 8px - consistent across all breakpoints */
		}
	}
</style>
