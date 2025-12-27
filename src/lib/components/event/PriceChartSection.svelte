<script lang="ts">
	import type { TimeRange } from '$lib/utils/event-helpers';
	import PriceChart from '$lib/components/charts/PriceChart.svelte';

	interface ChartSeries {
		name: string;
		color: string;
		data: Array<{ t: number; p: number }>;
	}

	interface Props {
		series: ChartSeries[];
		loading: boolean;
		error: string | null;
		selectedTimeRange: TimeRange;
		onTimeRangeChange: (range: TimeRange) => void;
	}

	let { series, loading, error, selectedTimeRange, onTimeRangeChange }: Props = $props();

	const timeRanges: TimeRange[] = ['1H', '6H', '1D', '1W', '1M', 'MAX'];
</script>

<section class="card chart-card">
	<div class="chart-wrapper">
		<PriceChart {series} {loading} {error} />
	</div>
	<div class="time-controls">
		{#each timeRanges as range (range)}
			<button
				class="time-btn"
				class:active={selectedTimeRange === range}
				onclick={() => onTimeRangeChange(range)}
			>
				{range}
			</button>
		{/each}
	</div>
</section>

<style>
	.card {
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: 12px;
		padding: 16px;
	}

	.chart-card {
		padding: 0;
		overflow: hidden;
		background: transparent;
		border: none;
	}

	.chart-wrapper {
		height: 220px;
		width: 100%;
	}

	.time-controls {
		display: flex;
		gap: 8px;
		padding: 12px 0;
		justify-content: flex-end;
	}

	.time-btn {
		padding: 6px 12px;
		font-size: 13px;
		font-weight: 500;
		background: transparent;
		border: none;
		border-radius: 6px;
		color: var(--text-3);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.time-btn:hover {
		background: var(--bg-2);
		color: var(--text-0);
	}

	.time-btn.active {
		background: var(--bg-2);
		color: var(--text-0);
		font-weight: 600;
	}

	@media (min-width: 768px) {
		.chart-wrapper {
			height: 380px;
		}

		.card {
			padding: 20px;
		}

		.chart-card {
			padding: 0;
		}

		.time-controls {
			padding: 16px;
		}
	}
</style>
