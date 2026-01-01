<script lang="ts">
	import type { Tag } from '$lib/server/api/polymarket-client';
	import FilterBar from '$lib/components/filters/FilterBar.svelte';
	import { BottomSheet } from '$lib/components/ui';
	import ChevronDownIcon from '$lib/components/icons/ChevronDownIcon.svelte';

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
	let isDropdownOpen = $state(false);
	let dropdownRef: HTMLDivElement | undefined = $state();

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
		isDropdownOpen = false;
	}

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isDropdownOpen = false;
		}
	}

	$effect(() => {
		if (isDropdownOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});

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
	<!-- Desktop: Dropdown for subcategories + FilterBar -->
	<div class="desktop-nav">
		<div class="dropdown-wrapper" bind:this={dropdownRef}>
			<button
				class="dropdown-trigger"
				class:active={isDropdownOpen}
				onclick={() => (isDropdownOpen = !isDropdownOpen)}
			>
				<span class="dropdown-label">{getActiveSubcategoryLabel()}</span>
				<ChevronDownIcon size={16} />
			</button>

			{#if isDropdownOpen}
				<div class="dropdown-panel">
					<div class="dropdown-grid">
						<button
							class="dropdown-option"
							class:active={isActive(null)}
							onclick={() => handleSubcategoryClick(null)}
						>
							All
						</button>
						{#each subcategories as subcategory (subcategory.id)}
							{#if subcategory.label && subcategory.slug}
								<button
									class="dropdown-option"
									class:active={isActive(subcategory.slug)}
									onclick={() => handleSubcategoryClick(subcategory.slug)}
								>
									{subcategory.label}
								</button>
							{/if}
						{/each}
					</div>
				</div>
			{/if}
		</div>

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
		<button class="apply-button" onclick={() => (isMobileFilterOpen = false)}> Close </button>
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
		box-shadow: var(--shadow-button-hover);
	}

	.option-button:active {
		transform: translateY(0);
	}

	.option-button.active {
		background: var(--primary);
		color: var(--bg-0);
		border-color: var(--primary);
		font-weight: 700;
		box-shadow: var(--shadow-button-primary-glow);
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
		padding: var(--spacing-3);
		background: var(--primary);
		color: var(--bg-0);
		border: none;
		border-radius: var(--radius-md);
		font-size: 15px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: var(--shadow-button-primary-glow);
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
		box-shadow: var(--shadow-button-primary-glow-hover);
	}

	.apply-button:active {
		transform: translateY(0);
		box-shadow: var(--shadow-button-primary-hover);
	}

	/* Desktop Styles */
	@media (min-width: 769px) {
		.desktop-nav {
			display: flex;
			gap: 8px;
			align-items: center;
		}

		.mobile-nav {
			display: none;
		}

		.dropdown-wrapper {
			position: relative;
		}

		.dropdown-trigger {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 8px 14px;
			background: var(--bg-1);
			border: 1px solid var(--bg-3);
			border-radius: var(--radius-button);
			color: var(--text-0);
			font-size: 14px;
			font-weight: 600;
			cursor: pointer;
			transition: all var(--transition-fast);
			min-height: 40px;
		}

		.dropdown-trigger:hover {
			background: var(--bg-2);
			border-color: var(--bg-4);
		}

		.dropdown-trigger.active {
			background: var(--bg-2);
			border-color: var(--primary);
		}

		.dropdown-trigger :global(svg) {
			color: var(--text-2);
			transition: transform var(--transition-fast);
		}

		.dropdown-trigger.active :global(svg) {
			transform: rotate(180deg);
		}

		.dropdown-panel {
			position: absolute;
			top: calc(100% + 8px);
			left: 0;
			min-width: 280px;
			max-width: 400px;
			background: var(--bg-1);
			border: 1px solid var(--bg-3);
			border-radius: var(--radius-lg);
			padding: 12px;
			box-shadow: var(--shadow-dropdown);
			z-index: var(--z-dropdown);
			animation: dropdownFadeIn 0.15s ease-out;
		}

		@keyframes dropdownFadeIn {
			from {
				opacity: 0;
				transform: translateY(-4px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}

		.dropdown-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
			gap: 6px;
		}

		.dropdown-option {
			padding: 8px 12px;
			background: var(--bg-2);
			border: 1px solid transparent;
			border-radius: var(--radius-sm);
			color: var(--text-1);
			font-size: 13px;
			font-weight: 500;
			cursor: pointer;
			transition: all var(--transition-fast);
			text-align: center;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.dropdown-option:hover {
			background: var(--bg-3);
			color: var(--text-0);
		}

		.dropdown-option.active {
			background: var(--primary);
			color: var(--bg-0);
			font-weight: 600;
		}

		.filter-wrapper {
			flex-shrink: 0;
		}
	}
</style>
