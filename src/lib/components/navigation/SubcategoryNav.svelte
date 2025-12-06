<script lang="ts">
	import type { Tag } from '$lib/server/api/polymarket-client';
	import FilterBar from '$lib/components/filters/FilterBar.svelte';

	interface Props {
		subcategories: Tag[];
		activeSlug?: string | null;
		onTagChange?: (slug: string | null) => void;
		// Filter props
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

	function handleSubcategoryClick(slug: string | null) {
		onTagChange?.(slug);
	}

	// Check if a chip is active
	function isActive(slug: string | null): boolean {
		if (!slug && !activeSlug) return true; // "All" is active when no tag selected
		return slug === activeSlug;
	}
</script>

<nav class="subcategory-nav">
	<div class="nav-content">
		<div class="chip-container">
			<!-- "All" chip -->
			<button
				class="chip"
				class:active={isActive(null)}
				onclick={() => handleSubcategoryClick(null)}
			>
				All
			</button>

			<!-- Subcategory chips -->
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

		<!-- Filters Button -->
		<FilterBar
			{currentStatus}
			{currentSort}
			{onStatusChange}
			{onSortChange}
		/>
	</div>
</nav>

<style>
	.subcategory-nav {
		width: 100%;
		margin-bottom: var(--space-md);
		overflow-x: auto;
		overflow-y: visible;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE/Edge */
	}

	.subcategory-nav::-webkit-scrollbar {
		display: none; /* Chrome/Safari */
	}

	.nav-content {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		min-width: min-content;
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

	/* Mobile optimization */
	@media (max-width: 768px) {
		.subcategory-nav {
			margin-left: -12px;
			margin-right: -12px;
			padding-left: 12px;
			padding-right: 12px;
		}

		.chip {
			font-size: 13px;
			padding: var(--space-xs) var(--space-sm);
		}
	}
</style>
