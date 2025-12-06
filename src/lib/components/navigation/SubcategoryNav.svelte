<script lang="ts">
	import type { Tag } from '$lib/server/api/polymarket-client';
	import FilterBar from '$lib/components/filters/FilterBar.svelte';

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
		<div class="chip-scroll">
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
{#if isMobileFilterOpen}
	<div class="mobile-backdrop" onclick={() => (isMobileFilterOpen = false)}></div>

	<div class="mobile-filter-sheet">
		<div class="sheet-header">
			<h3>Filters</h3>
			<button class="close-button" onclick={() => (isMobileFilterOpen = false)}>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
					<path
						d="M18 6L6 18M6 6l12 12"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
			</button>
		</div>

		<div class="sheet-content">
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
		</div>

		<div class="sheet-footer">
			<button class="apply-button" onclick={() => (isMobileFilterOpen = false)}>
				Apply Filters
			</button>
		</div>
	</div>
{/if}

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
		gap: 8px;
		width: 100%;
		padding: 12px 16px;
		background: var(--bg-1);
		color: var(--text-0);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-button);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
		min-height: 44px;
	}

	.mobile-filter-button:hover {
		background: var(--bg-2);
	}

	.mobile-filter-button svg {
		flex-shrink: 0;
		color: var(--text-2);
	}

	.filter-summary {
		flex: 1;
		text-align: left;
		color: var(--text-1);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Mobile Bottom Sheet */
	.mobile-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 999;
		animation: fadeIn 0.2s ease-out;
	}

	.mobile-filter-sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		max-height: 85vh;
		background: var(--bg-1);
		border-radius: 16px 16px 0 0;
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
		z-index: 1001;
		display: flex;
		flex-direction: column;
		animation: slideUp 0.25s ease-out;
	}

	.sheet-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 16px 16px;
		border-bottom: 1px solid var(--bg-3);
		flex-shrink: 0;
	}

	.sheet-header h3 {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-0);
		margin: 0;
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: transparent;
		border: none;
		border-radius: 8px;
		color: var(--text-2);
		cursor: pointer;
		transition: all 0.15s;
	}

	.close-button:hover {
		background: var(--bg-2);
		color: var(--text-0);
	}

	.sheet-content {
		flex: 1;
		overflow-y: auto;
		padding: 16px;
		-webkit-overflow-scrolling: touch;
	}

	.filter-section {
		margin-bottom: 24px;
	}

	.filter-section:last-child {
		margin-bottom: 0;
	}

	.section-label {
		display: block;
		font-size: 12px;
		font-weight: 600;
		color: var(--text-3);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 12px;
	}

	.option-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 8px;
	}

	.option-button {
		padding: 12px 16px;
		background: var(--bg-2);
		color: var(--text-2);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-button);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.option-button:hover {
		background: var(--bg-3);
	}

	.option-button.active {
		background: var(--primary);
		color: var(--bg-0);
		border-color: var(--primary);
		font-weight: 600;
	}

	.sheet-footer {
		padding: 16px;
		border-top: 1px solid var(--bg-3);
		flex-shrink: 0;
	}

	.apply-button {
		width: 100%;
		padding: 14px;
		background: var(--primary);
		color: var(--bg-0);
		border: none;
		border-radius: var(--radius-button);
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.apply-button:hover {
		opacity: 0.9;
	}

	/* Desktop Styles */
	@media (min-width: 769px) {
		.desktop-nav {
			display: flex;
			gap: var(--space-sm);
			align-items: center;
		}

		.mobile-nav {
			display: none;
		}

		.chip-scroll {
			flex: 1;
			min-width: 0;
			overflow-x: auto;
			overflow-y: visible;
			-webkit-overflow-scrolling: touch;
			scrollbar-width: none;
			-ms-overflow-style: none;
		}

		.chip-scroll::-webkit-scrollbar {
			display: none;
		}

		.chip-container {
			display: flex;
			gap: 6px;
			padding: 4px;
			background: var(--bg-2);
			border-radius: var(--radius-button);
			border: 1px solid var(--bg-3);
			width: fit-content;
		}

		.filter-wrapper {
			flex-shrink: 0;
		}

		.chip {
			display: inline-flex;
			align-items: center;
			gap: var(--space-xs);
			padding: 6px 14px;
			background: transparent;
			color: var(--text-2);
			border: none;
			border-radius: calc(var(--radius-button) - 2px);
			font-size: 13px;
			font-weight: 500;
			cursor: pointer;
			transition: all var(--transition-fast);
			white-space: nowrap;
			min-height: 34px;
			user-select: none;
		}

		.chip:hover:not(.active) {
			background: var(--bg-3);
			color: var(--text-1);
		}

		.chip:active {
			transform: scale(0.97);
		}

		.chip.active {
			background: var(--bg-0);
			color: var(--text-0);
			font-weight: 600;
			box-shadow:
				0 1px 3px rgba(0, 0, 0, 0.1),
				0 1px 2px rgba(0, 0, 0, 0.06);
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
