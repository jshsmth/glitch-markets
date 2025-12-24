<script lang="ts">
	interface Props {
		volumeMin?: number;
		volumeMax?: number;
		liquidityMin?: number;
		liquidityMax?: number;
		startDateMin?: string;
		startDateMax?: string;
		endDateMin?: string;
		endDateMax?: string;
		onVolumeChange?: (min: number | undefined, max: number | undefined) => void;
		onLiquidityChange?: (min: number | undefined, max: number | undefined) => void;
		onDateRangeChange?: (
			startMin: string | undefined,
			startMax: string | undefined,
			endMin: string | undefined,
			endMax: string | undefined
		) => void;
	}

	let {
		volumeMin = $bindable(),
		volumeMax = $bindable(),
		liquidityMin = $bindable(),
		liquidityMax = $bindable(),
		startDateMin = $bindable(),
		startDateMax = $bindable(),
		endDateMin = $bindable(),
		endDateMax = $bindable(),
		onVolumeChange,
		onLiquidityChange,
		onDateRangeChange
	}: Props = $props();

	let localVolumeMin = $state<string>('');
	let localVolumeMax = $state<string>('');
	let localLiquidityMin = $state<string>('');
	let localLiquidityMax = $state<string>('');

	$effect(() => {
		localVolumeMin = volumeMin?.toString() ?? '';
		localVolumeMax = volumeMax?.toString() ?? '';
		localLiquidityMin = liquidityMin?.toString() ?? '';
		localLiquidityMax = liquidityMax?.toString() ?? '';
	});

	function handleVolumeMinChange(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		localVolumeMin = value;
		const numValue = value === '' ? undefined : parseFloat(value);
		onVolumeChange?.(numValue, volumeMax);
	}

	function handleVolumeMaxChange(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		localVolumeMax = value;
		const numValue = value === '' ? undefined : parseFloat(value);
		onVolumeChange?.(volumeMin, numValue);
	}

	function handleLiquidityMinChange(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		localLiquidityMin = value;
		const numValue = value === '' ? undefined : parseFloat(value);
		onLiquidityChange?.(numValue, liquidityMax);
	}

	function handleLiquidityMaxChange(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		localLiquidityMax = value;
		const numValue = value === '' ? undefined : parseFloat(value);
		onLiquidityChange?.(liquidityMin, numValue);
	}

	function handleStartDateMinChange(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		startDateMin = value || undefined;
		onDateRangeChange?.(startDateMin, startDateMax, endDateMin, endDateMax);
	}

	function handleStartDateMaxChange(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		startDateMax = value || undefined;
		onDateRangeChange?.(startDateMin, startDateMax, endDateMin, endDateMax);
	}

	function handleEndDateMinChange(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		endDateMin = value || undefined;
		onDateRangeChange?.(startDateMin, startDateMax, endDateMin, endDateMax);
	}

	function handleEndDateMaxChange(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		endDateMax = value || undefined;
		onDateRangeChange?.(startDateMin, startDateMax, endDateMin, endDateMax);
	}

	function clearFilters() {
		localVolumeMin = '';
		localVolumeMax = '';
		localLiquidityMin = '';
		localLiquidityMax = '';
		startDateMin = undefined;
		startDateMax = undefined;
		endDateMin = undefined;
		endDateMax = undefined;
		onVolumeChange?.(undefined, undefined);
		onLiquidityChange?.(undefined, undefined);
		onDateRangeChange?.(undefined, undefined, undefined, undefined);
	}
</script>

<div class="advanced-filters">
	<div class="filter-header">
		<h3>Advanced Filters</h3>
		<button class="clear-btn" onclick={clearFilters}>Clear All</button>
	</div>

	<div class="filter-section">
		<label class="section-label">Volume Range</label>
		<div class="range-inputs">
			<input
				type="number"
				class="range-input"
				placeholder="Min volume"
				value={localVolumeMin}
				oninput={handleVolumeMinChange}
				min="0"
			/>
			<span class="range-separator">to</span>
			<input
				type="number"
				class="range-input"
				placeholder="Max volume"
				value={localVolumeMax}
				oninput={handleVolumeMaxChange}
				min="0"
			/>
		</div>
	</div>

	<div class="filter-section">
		<label class="section-label">Liquidity Range</label>
		<div class="range-inputs">
			<input
				type="number"
				class="range-input"
				placeholder="Min liquidity"
				value={localLiquidityMin}
				oninput={handleLiquidityMinChange}
				min="0"
			/>
			<span class="range-separator">to</span>
			<input
				type="number"
				class="range-input"
				placeholder="Max liquidity"
				value={localLiquidityMax}
				oninput={handleLiquidityMaxChange}
				min="0"
			/>
		</div>
	</div>

	<div class="filter-section">
		<label class="section-label">Start Date Range</label>
		<div class="range-inputs">
			<input
				type="date"
				class="date-input"
				value={startDateMin ?? ''}
				oninput={handleStartDateMinChange}
			/>
			<span class="range-separator">to</span>
			<input
				type="date"
				class="date-input"
				value={startDateMax ?? ''}
				oninput={handleStartDateMaxChange}
			/>
		</div>
	</div>

	<div class="filter-section">
		<label class="section-label">End Date Range</label>
		<div class="range-inputs">
			<input
				type="date"
				class="date-input"
				value={endDateMin ?? ''}
				oninput={handleEndDateMinChange}
			/>
			<span class="range-separator">to</span>
			<input
				type="date"
				class="date-input"
				value={endDateMax ?? ''}
				oninput={handleEndDateMaxChange}
			/>
		</div>
	</div>
</div>

<style>
	.advanced-filters {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4);
		padding: var(--spacing-4);
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-md);
	}

	.filter-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: var(--spacing-3);
		border-bottom: 1px solid var(--bg-3);
	}

	.filter-header h3 {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-0);
		margin: 0;
	}

	.clear-btn {
		padding: 4px 12px;
		background: transparent;
		color: var(--text-2);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-button);
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.clear-btn:hover {
		background: var(--bg-2);
		color: var(--text-0);
	}

	.filter-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.section-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-3);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.range-inputs {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.range-separator {
		font-size: 12px;
		color: var(--text-3);
		flex-shrink: 0;
	}

	.range-input,
	.date-input {
		flex: 1;
		padding: 8px 12px;
		background: var(--bg-2);
		color: var(--text-0);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-button);
		font-size: 13px;
		font-weight: 500;
		transition: all 0.15s;
		min-width: 0;
	}

	.range-input:focus,
	.date-input:focus {
		outline: none;
		border-color: var(--primary);
		background: var(--bg-1);
	}

	.range-input::placeholder {
		color: var(--text-3);
	}

	/* Mobile */
	@media (max-width: 768px) {
		.advanced-filters {
			padding: var(--spacing-4);
		}

		.range-inputs {
			flex-direction: column;
			align-items: stretch;
		}

		.range-separator {
			text-align: center;
		}

		.range-input,
		.date-input {
			min-height: 44px;
		}
	}
</style>
