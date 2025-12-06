<script lang="ts">
	import { page } from '$app/state';
	import { ChevronLeftIcon, ChevronRightIcon } from '$lib/components/icons';
	import { categories, SCROLL_AMOUNT, SCROLL_THRESHOLD } from '$lib/config/categories';

	// Determine active category based on pathname
	let activeCategory = $derived(() => {
		const pathname = page.url.pathname;
		if (pathname === '/') return 'trending';
		// Remove leading slash to get category name
		return pathname.slice(1);
	});
	let scrollContainer = $state<HTMLDivElement>();
	let showSwipeHint = $state(false);
	let hasOverflow = $state(false);
	let canScrollLeft = $state(false);
	let canScrollRight = $state(false);

	function handleScroll() {
		if (!scrollContainer) return;

		const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
		hasOverflow = scrollWidth > clientWidth;
		canScrollLeft = scrollLeft > SCROLL_THRESHOLD;
		canScrollRight = scrollLeft < scrollWidth - clientWidth - SCROLL_THRESHOLD;

		// Hide swipe hint after user scrolls
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
		if (scrollContainer) {
			handleScroll();

			// Create ResizeObserver to update overflow state on window resize
			const resizeObserver = new ResizeObserver(() => {
				handleScroll();
			});

			resizeObserver.observe(scrollContainer);

			// Show swipe hint only if there's overflow
			let timeout: ReturnType<typeof setTimeout> | undefined;
			if (hasOverflow) {
				showSwipeHint = true;
				// Auto-hide swipe hint after 3 seconds
				timeout = setTimeout(() => {
					showSwipeHint = false;
				}, 3000);
			}

			return () => {
				resizeObserver.disconnect();
				if (timeout) clearTimeout(timeout);
			};
		}
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
							class:active={activeCategory() === category.name.toLowerCase()}
						>
							{#if category.icon}
								{@const Icon = category.icon}
								<Icon size={16} />
							{/if}
							{category.name}
						</a>
					</li>
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
		background-color: var(--bg-0);
		border-bottom: 1px solid var(--bg-3);
	}

	.nav-container {
		position: relative;
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: var(--spacing-2); /* 8px spacing between arrows and scroll area */
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

	.nav-scroll {
		position: relative;
		overflow-x: auto;
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE/Edge */
		-webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
		flex: 1;
		padding: 0 var(--spacing-3); /* 12px - using design tokens */
	}

	.nav-scroll::-webkit-scrollbar {
		display: none;
	}

	.nav-list {
		display: flex;
		align-items: center;
		gap: var(--space-sm); /* 16px - related items within section */
		list-style: none;
		margin: 0;
		padding: 0;
		min-height: var(--target-comfortable); /* 44px - WCAG 2.1 AA */
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: var(--spacing-2); /* 8px - better icon/text balance (Principle #14) */
		text-decoration: none;
		color: var(--text-3); /* Lighter gray for inactive state */
		font-size: 14px;
		font-weight: var(--font-regular); /* Regular weight for inactive */
		white-space: nowrap;
		min-height: var(--target-comfortable); /* 44px - WCAG 2.1 AA */
		transition: var(--transition-colors);
		padding: var(--spacing-2) 0; /* Add padding for larger tap area */
	}

	.nav-link:hover {
		color: var(--text-0); /* Darker on hover for better feedback */
	}

	.nav-link:hover :global(svg) {
		transform: scale(1.1);
		transition: transform var(--transition-base);
	}

	.nav-link.active {
		color: var(--text-0); /* Bold black instead of blue */
		font-weight: var(--font-bold); /* Use design token */
	}

	.nav-link :global(svg) {
		flex-shrink: 0;
		transition: transform var(--transition-base);
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
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
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
			gap: var(--spacing-6); /* 24px - more spacing on desktop */
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
			gap: var(--spacing-5); /* 20px - slightly tighter on large screens */
		}
	}
</style>
