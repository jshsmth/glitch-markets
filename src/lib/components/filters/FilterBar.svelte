<script lang="ts">
	interface Props {
		currentStatus?: string;
		currentSort?: string;
		onStatusChange?: (status: 'active' | 'closed' | 'all') => void;
		onSortChange?: (sort: string) => void;
	}

	let { currentStatus = 'active', currentSort = 'volume24hr', onStatusChange, onSortChange }: Props =
		$props();

	const statusOptions = [
		{ value: 'active', label: 'Active' },
		{ value: 'closed', label: 'Closed' },
		{ value: 'all', label: 'All' }
	];

	const sortOptions = [
		{ value: 'volume24hr', label: '24h Volume' },
		{ value: 'volume', label: '7d Volume' },
		{ value: 'liquidity', label: 'Liquidity' },
		{ value: 'createdAt', label: 'Newest' }
	];

	function handleStatusClick(status: 'active' | 'closed' | 'all') {
		onStatusChange?.(status);
	}

	function handleSortClick(sort: string) {
		onSortChange?.(sort);
	}
</script>

<div class="filter-bar">
	<!-- Status Filter -->
	<div class="filter-section">
		<span class="filter-label">Status:</span>
		<div class="filter-group">
			{#each statusOptions as option (option.value)}
				<button
					class="filter-pill"
					class:active={currentStatus === option.value}
					onclick={() => handleStatusClick(option.value as 'active' | 'closed' | 'all')}
				>
					{option.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Sort Filter -->
	<div class="filter-section">
		<span class="filter-label">Sort by:</span>
		<div class="filter-group">
			{#each sortOptions as option (option.value)}
				<button
					class="filter-pill sort-pill"
					class:active={currentSort === option.value}
					onclick={() => handleSortClick(option.value)}
				>
					{option.label}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.filter-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md) 0;
		margin-bottom: var(--space-md);
		position: sticky;
		top: 60px;
		background: var(--bg-0);
		z-index: 10;
	}

	.filter-section {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.filter-label {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-2);
		white-space: nowrap;
	}

	.filter-group {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		background: var(--bg-2);
		padding: 4px;
		border-radius: var(--radius-button);
		border: 1px solid var(--bg-3);
	}

	.filter-pill {
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
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.filter-pill:active {
		transform: scale(0.97);
	}

	.filter-pill.active {
		background: var(--bg-0);
		color: var(--text-0);
		font-weight: 600;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.1),
			0 1px 2px rgba(0, 0, 0, 0.06);
	}

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.filter-bar {
			flex-direction: column;
			align-items: stretch;
			gap: var(--space-md);
			top: 56px;
		}

		.filter-section {
			width: 100%;
		}

		.filter-group {
			width: 100%;
		}

		.filter-pill {
			flex: 1;
			min-width: 0;
		}
	}
</style>
