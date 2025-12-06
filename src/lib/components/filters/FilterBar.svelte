<script lang="ts">
	interface Props {
		currentStatus?: string;
		currentSort?: string;
		onStatusChange?: (status: 'active' | 'closed' | 'all') => void;
		onSortChange?: (sort: string) => void;
	}

	let { currentStatus = 'active', currentSort = 'volume24hr', onStatusChange, onSortChange }: Props = $props();

	let isOpen = $state(false);

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
</script>

<div class="filter-wrapper">
	<button class="filter-button" onclick={() => (isOpen = !isOpen)}>
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
			<path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
		</svg>
		Filters
	</button>

	{#if isOpen}
		<div class="filter-panel">
			<div class="filter-group">
				<span class="group-label">Status</span>
				<div class="options">
					{#each statusOptions as option}
						<button
							class="option-chip"
							class:active={currentStatus === option.value}
							onclick={() => onStatusChange?.(option.value as 'active' | 'closed')}
						>
							{option.label}
						</button>
					{/each}
				</div>
			</div>

			<div class="filter-group">
				<span class="group-label">Sort by</span>
				<div class="options">
					{#each sortOptions as option}
						<button
							class="option-chip"
							class:active={currentSort === option.value}
							onclick={() => onSortChange?.(option.value)}
						>
							{option.label}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.filter-wrapper {
		position: relative;
	}

	.filter-button {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		background: var(--bg-1);
		color: var(--text-0);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-button);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		min-height: 36px;
		transition: all 0.15s;
	}

	.filter-button:hover {
		background: var(--bg-2);
	}

	.filter-button svg {
		color: var(--text-2);
	}

	.filter-panel {
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: 8px;
		padding: 16px;
		min-width: 280px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		z-index: 1000;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.group-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-3);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.options {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.option-chip {
		padding: 6px 12px;
		background: var(--bg-2);
		color: var(--text-2);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-button);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
		min-height: 32px;
	}

	.option-chip:hover {
		background: var(--bg-3);
	}

	.option-chip.active {
		background: var(--primary);
		color: var(--bg-0);
		border-color: var(--primary);
		font-weight: 600;
	}

	@media (max-width: 768px) {
		.filter-button {
			min-height: 44px;
		}

		.filter-panel {
			left: 0;
			right: 0;
			min-width: auto;
		}
	}
</style>
