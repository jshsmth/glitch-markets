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

	function handleSubcategoryClick(slug: string | null) {
		onTagChange?.(slug);
	}

	function isActive(slug: string | null): boolean {
		if (!slug && !activeSlug) return true;
		return slug === activeSlug;
	}
</script>

<nav class="subcategory-nav">
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
</nav>

<style>
	.subcategory-nav {
		display: flex;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
		align-items: center;
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

	@media (max-width: 768px) {
		.chip-scroll {
			margin-left: -12px;
			padding-left: 12px;
		}

		.chip {
			font-size: 13px;
			padding: var(--space-xs) var(--space-sm);
		}
	}
</style>
