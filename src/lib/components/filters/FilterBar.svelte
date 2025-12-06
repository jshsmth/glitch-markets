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

	function handleSortSelect(event: Event) {
		const select = event.target as HTMLSelectElement;
		onSortChange?.(select.value);
	}
</script>

<div class="filter-bar">
	<div class="filter-section">
		<span class="filter-label">Status</span>
		<div class="status-buttons">
			{#each statusOptions as option (option.value)}
				<button
					class="status-button"
					class:active={currentStatus === option.value}
					onclick={() => handleStatusClick(option.value as 'active' | 'closed' | 'all')}
				>
					{option.label}
				</button>
			{/each}
		</div>
	</div>

	<div class="filter-section">
		<label for="sort-select" class="filter-label">Sort by</label>
		<div class="select-wrapper">
			<select id="sort-select" class="sort-select" value={currentSort} onchange={handleSortSelect}>
				{#each sortOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>
	</div>
</div>

<style>
	.filter-bar {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-lg);
		align-items: flex-end;
		padding: var(--space-md) 0;
		margin-bottom: var(--space-lg);
		border-bottom: 1px solid var(--bg-3);
	}

	.filter-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.filter-label {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-2);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.status-buttons {
		display: flex;
		gap: var(--space-xs);
		background: var(--bg-2);
		padding: 4px;
		border-radius: var(--radius-button);
		border: 1px solid var(--bg-3);
	}

	.status-button {
		padding: var(--space-xs) var(--space-md);
		background: transparent;
		color: var(--text-2);
		border: none;
		border-radius: calc(var(--radius-button) - 2px);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
		white-space: nowrap;
		min-height: var(--target-min);
	}

	.status-button:hover {
		color: var(--text-0);
		background: var(--bg-3);
	}

	.status-button.active {
		background: var(--bg-0);
		color: var(--text-0);
		font-weight: 600;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.select-wrapper {
		position: relative;
	}

	.sort-select {
		appearance: none;
		padding: var(--space-xs) var(--space-xl) var(--space-xs) var(--space-md);
		background: var(--bg-2);
		color: var(--text-0);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-button);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
		min-height: var(--target-min);
		background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23808080' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right var(--space-sm) center;
		background-size: 12px;
	}

	.sort-select:hover {
		border-color: var(--bg-4);
		background-color: var(--bg-3);
	}

	.sort-select:focus {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.filter-bar {
			flex-direction: column;
			align-items: stretch;
			gap: var(--space-md);
		}

		.filter-section {
			width: 100%;
		}

		.status-buttons {
			flex: 1;
		}

		.status-button {
			flex: 1;
			justify-content: center;
		}

		.sort-select {
			width: 100%;
		}
	}

	@media (min-width: 769px) {
		.filter-bar {
			align-items: center;
		}

		.sort-select {
			min-width: 180px;
		}
	}
</style>
