<script lang="ts">
	import { LayerCake, Svg, Html } from 'layercake';
	import Line from './Line.svelte';
	import AxisX from './AxisX.svelte';
	import AxisY from './AxisY.svelte';
	import Tooltip from './Tooltip.svelte';

	interface PricePoint {
		t: number;
		p: number;
	}

	interface Series {
		name: string;
		color: string;
		data: PricePoint[];
	}

	interface Props {
		series: Series[];
		loading?: boolean;
		error?: string | null;
	}

	let { series = [], loading = false, error = null }: Props = $props();

	const chartData = $derived(
		series.length > 0 && series[0].data.length > 0
			? series[0].data.map((point) => ({
					x: new Date(point.t * 1000),
					y: point.p * 100
				}))
			: []
	);

	const yDomainMax = $derived.by(() => {
		let maxValue = 0;
		for (const s of series) {
			for (const point of s.data) {
				const value = point.p * 100;
				if (value > maxValue) maxValue = value;
			}
		}

		if (maxValue === 0) return 100;

		const padding = maxValue * 0.15;
		const maxWithPadding = maxValue + padding;

		const roundTo = maxWithPadding > 50 ? 10 : 5;
		return Math.ceil(maxWithPadding / roundTo) * roundTo;
	});

	const xKey = 'x';
	const yKey = 'y';

	const formatDate = (val: Date | number) => {
		const date = val instanceof Date ? val : new Date(val);
		const now = new Date();
		const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

		if (diffDays < 1) {
			return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
		} else if (diffDays < 7) {
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		} else {
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		}
	};

	const formatPercent = (val: number) => `${val.toFixed(0)}%`;
</script>

{#if loading}
	<div class="skeleton chart-skeleton"></div>
{:else if error}
	<div class="chart-state error">
		<span>{error}</span>
	</div>
{:else if chartData.length === 0}
	<div class="chart-state">
		<span>No data available</span>
	</div>
{:else}
	<div class="chart-container">
		<LayerCake
			ssr={true}
			padding={{ top: 8, right: 50, bottom: 24, left: 8 }}
			x={xKey}
			y={yKey}
			yDomain={[0, yDomainMax]}
			data={chartData}
		>
			<Svg>
				<AxisX {formatDate} />
				<AxisY {formatPercent} />
				{#each series as s (s.name)}
					<Line
						color={s.color}
						data={s.data.map((point) => ({ x: new Date(point.t * 1000), y: point.p * 100 }))}
					/>
				{/each}
			</Svg>
			<Html>
				<Tooltip {formatDate} {formatPercent} {series} />
			</Html>
		</LayerCake>
	</div>
{/if}

<style>
	@import '$lib/styles/skeleton.css';

	.chart-container {
		width: 100%;
		height: 100%;
		position: relative;
	}

	.chart-state {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		color: var(--text-3);
		font-size: 14px;
	}

	.chart-state.error {
		color: var(--danger);
	}

	.chart-skeleton {
		width: 100%;
		height: 100%;
		border-radius: var(--radius-lg);
	}
</style>
