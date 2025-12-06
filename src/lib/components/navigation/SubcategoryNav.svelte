<script lang="ts">
	import type { Tag } from '$lib/server/api/polymarket-client';
	import FilterBar from '$lib/components/filters/FilterBar.svelte';
	import { BottomSheet } from '$lib/components/ui';

	interface Props {
		subcategories: Tag[];
		activeSlug?: string | null;
		onTagChange?: (slug: string | null) => void;
		currentStatus?: string;
		currentSort?: string;
		onStatusChange?: (status: 'active' | 'closed' | 'all') => void;
		onSortChange?: (sort: string) => void;
	}

	let {
		subcategories,
		activeSlug,
		onTagChange,
		currentStatus,
		currentSort,
		onStatusChange,
		onSortChange
	}: Props = $props();

	let isMobileFilterOpen = $state(false);
	let scrollContainer: HTMLDivElement | undefined = $state();
	let showLeftArrow = $state(false);
	let showRightArrow = $state(false);

	function updateArrowVisibility() {
		if (!scrollContainer) return;

		const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
		showLeftArrow = scrollLeft > 0;
		showRightArrow = scrollLeft < scrollWidth - clientWidth - 1;
	}

	function scrollLeft() {
		if (!scrollContainer) return;
		scrollContainer.scrollBy({ left: -200, behavior: 'smooth' });
	}

	function scrollRight() {
		if (!scrollContainer) return;
		scrollContainer.scrollBy({ left: 200, behavior: 'smooth' });
	}

	$effect(() => {
		if (scrollContainer) {
			updateArrowVisibility();
			scrollContainer.addEventListener('scroll', updateArrowVisibility);
			window.addEventListener('resize', updateArrowVisibility);

			return () => {
				scrollContainer?.removeEventListener('scroll', updateArrowVisibility);
				window.removeEventListener('resize', updateArrowVisibility);
			};
		}
	});

	const statusOptions = [
		{ value: 'active', label: 'Active' },
		{ value: 'closed', label: 'Resolved' }
	];

	const sortOptions = [
		{ value: 'volume24hr', label: '24h Vol' },
		{ value: 'volume', label: '7d Vol' },
		{ value: 'liquidity', label: 'Liquidity' },
		{ value: 'createdAt', label: 'Newest' }
	];

	function handleSubcategoryClick(slug: string | null) {
		onTagChange?.(slug);
	}

	function isActive(slug: string | null): boolean {
		if (!slug && !activeSlug) return true;
		return slug === activeSlug;
	}

	function getActiveSubcategoryLabel(): string {
		if (!activeSlug) return 'All';
		const active = subcategories.find((sub) => sub.slug === activeSlug);
		return active?.label || 'All';
	}

	function getActiveStatusLabel(): string {
		const active = statusOptions.find((opt) => opt.value === currentStatus);
		return active?.label || 'Active';
	}

	function getActiveSortLabel(): string {
		const active = sortOptions.find((opt) => opt.value === currentSort);
		return active?.label || '24h Vol';
	}
</script>

<nav class="subcategory-nav">
	<!-- Desktop: Horizontal scrolling chips + FilterBar -->
	<div class="desktop-nav">
		{#if showLeftArrow}
			<button class="scroll-arrow left" onclick={scrollLeft} aria-label="Scroll left">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
					<path
						d="M15 18l-6-6 6-6"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		{/if}

		<div class="chip-scroll" bind:this={scrollContainer}>
			<div class="chip-container">
				<button
					class="chip"
					class:active={isActive(null)}
					onclick={() => handleSubcategoryClick(null)}
				>
					All
				</button>

				{#each subcategories as subcategory (subcategory.id)}
					{#if subcategory.label && subcategory.slug}
						<button
							class="chip"
							class:active={isActive(subcategory.slug)}
							onclick={() => handleSubcategoryClick(subcategory.slug)}
						>
							{subcategory.label}
						</button>
					{/if}
				{/each}
			</div>
		</div>

		{#if showRightArrow}
			<button class="scroll-arrow right" onclick={scrollRight} aria-label="Scroll right">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
					<path
						d="M9 18l6-6-6-6"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		{/if}

		<div class="filter-wrapper">
			<FilterBar {currentStatus} {currentSort} {onStatusChange} {onSortChange} />
		</div>
	</div>

	<!-- Mobile: Single filter button -->
	<div class="mobile-nav">
		<button class="mobile-filter-button" onclick={() => (isMobileFilterOpen = true)}>
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
				<path
					d="M2 4h12M4 8h8M6 12h4"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
				/>
			</svg>
			<span class="filter-summary">
				{getActiveSubcategoryLabel()} • {getActiveStatusLabel()} • {getActiveSortLabel()}
			</span>
		</button>
	</div>
</nav>

<!-- Mobile Filter Bottom Sheet -->
<BottomSheet open={isMobileFilterOpen} title="Filters" onClose={() => (isMobileFilterOpen = false)}>
	<!-- Subcategories -->
	<div class="filter-section">
		<span class="section-label">Category</span>
		<div class="option-grid">
			<button
				class="option-button"
				class:active={isActive(null)}
				onclick={() => handleSubcategoryClick(null)}
			>
				All
			</button>
			{#each subcategories as subcategory (subcategory.id)}
				{#if subcategory.label && subcategory.slug}
					<button
						class="option-button"
						class:active={isActive(subcategory.slug)}
						onclick={() => handleSubcategoryClick(subcategory.slug)}
					>
						{subcategory.label}
					</button>
				{/if}
			{/each}
		</div>
	</div>

	<!-- Status Filter -->
	<div class="filter-section">
		<span class="section-label">Status</span>
		<div class="option-grid">
			{#each statusOptions as option (option.value)}
				<button
					class="option-button"
					class:active={currentStatus === option.value}
					onclick={() => onStatusChange?.(option.value as 'active' | 'closed')}
				>
					{option.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Sort Filter -->
	<div class="filter-section">
		<span class="section-label">Sort by</span>
		<div class="option-grid">
			{#each sortOptions as option (option.value)}
				<button
					class="option-button"
					class:active={currentSort === option.value}
					onclick={() => onSortChange?.(option.value)}
				>
					{option.label}
				</button>
			{/each}
		</div>
	</div>

	{#snippet footer()}
		<button class="apply-button" onclick={() => (isMobileFilterOpen = false)}>
			Apply Filters
		</button>
	{/snippet}
</BottomSheet>

<style>
	.subcategory-nav {
		margin-bottom: var(--space-md);
	}

	/* Desktop Navigation */
	.desktop-nav {
		display: none;
	}

	/* Mobile Navigation */
	.mobile-nav {
		display: block;
	}

	.mobile-filter-button {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 18px;
		background: var(--bg-2);
		color: var(--text-0);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-button);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
		min-height: 40px;
		width: fit-content;
	}

	.mobile-filter-button:hover {
		background: var(--bg-3);
		border-color: var(--text-3);
	}

	.mobile-filter-button:active {
		transform: scale(0.98);
	}

	.mobile-filter-button svg {
		flex-shrink: 0;
		color: var(--text-1);
	}

	.filter-summary {
		color: var(--text-1);
		font-size: 13px;
	}

	/* Filter Section Styles */
	.filter-section {
		margin-bottom: 24px;
	}

	.filter-section:last-child {
		margin-bottom: 0;
	}

	.section-label {
		display: block;
		font-size: 11px;
		font-weight: 700;
		color: var(--text-3);
		text-transform: uppercase;
		letter-spacing: 0.8px;
		margin-bottom: 12px;
	}

	.option-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
		gap: 10px;
	}

	.option-button {
		padding: 10px 14px;
		background: var(--bg-2);
		color: var(--text-2);
		border: 1.5px solid var(--bg-3);
		border-radius: 10px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		position: relative;
	}

	.option-button:hover {
		background: var(--bg-3);
		border-color: var(--text-3);
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.option-button:active {
		transform: translateY(0);
	}

	.option-button.active {
		background: var(--primary);
		color: var(--bg-0);
		border-color: var(--primary);
		font-weight: 700;
		box-shadow: 0 2px 12px rgba(var(--primary-rgb), 0.3);
	}

	.option-button.active::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 11px;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
		pointer-events: none;
	}

	.apply-button {
		width: 100%;
		padding: 12px;
		background: var(--primary);
		color: var(--bg-0);
		border: none;
		border-radius: 10px;
		font-size: 15px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 2px 12px rgba(var(--primary-rgb), 0.3);
		position: relative;
		overflow: hidden;
	}

	.apply-button::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 100%);
		pointer-events: none;
	}

	.apply-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 16px rgba(var(--primary-rgb), 0.4);
	}

	.apply-button:active {
		transform: translateY(0);
		box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.3);
	}

	/* Desktop Styles */
	@media (min-width: 769px) {
		.desktop-nav {
			display: flex;
			gap: 6px;
			align-items: center;
			background: var(--bg-1);
			border: 1px solid var(--bg-3);
			border-radius: var(--radius-lg);
			padding: 8px;
			position: relative;
		}

		.mobile-nav {
			display: none;
		}

		.scroll-arrow {
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 32px;
			height: 32px;
			background: var(--bg-2);
			border: 1px solid var(--bg-3);
			border-radius: var(--radius-button);
			color: var(--text-2);
			cursor: pointer;
			transition: all var(--transition-fast);
			z-index: 1;
		}

		.scroll-arrow:hover {
			background: var(--bg-3);
			border-color: var(--bg-4);
			color: var(--text-0);
		}

		.scroll-arrow:active {
			transform: scale(0.95);
		}

		.chip-scroll {
			flex: 1;
			min-width: 0;
			overflow-x: auto;
			overflow-y: visible;
			-webkit-overflow-scrolling: touch;
			scrollbar-width: none;
			-ms-overflow-style: none;
			scroll-behavior: smooth;
		}

		.chip-scroll::-webkit-scrollbar {
			display: none;
		}

		.chip-container {
			display: flex;
			gap: 6px;
			width: fit-content;
			min-width: 100%;
		}

		.filter-wrapper {
			flex-shrink: 0;
			margin-left: 4px;
		}

		.chip {
			display: inline-flex;
			align-items: center;
			gap: var(--space-xs);
			padding: 6px 12px;
			background: transparent;
			color: var(--text-2);
			border: 1px solid transparent;
			border-radius: var(--radius-button);
			font-size: 13px;
			font-weight: 500;
			cursor: pointer;
			transition: all var(--transition-fast);
			white-space: nowrap;
			min-height: 32px;
			user-select: none;
		}

		.chip:hover:not(.active) {
			background: var(--bg-2);
			border-color: var(--bg-4);
			color: var(--text-1);
		}

		.chip:active {
			transform: scale(0.98);
		}

		.chip.active {
			background: var(--primary);
			color: var(--bg-0);
			border-color: var(--primary);
			font-weight: 600;
			box-shadow: 0 1px 3px rgba(var(--primary-rgb), 0.2);
		}
	}
</style>
