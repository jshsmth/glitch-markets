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
	<div class="chart-skeleton">
		<div class="skeleton-y-axis">
			<div class="skeleton-tick"></div>
			<div class="skeleton-tick"></div>
			<div class="skeleton-tick"></div>
			<div class="skeleton-tick"></div>
			<div class="skeleton-tick"></div>
		</div>
		<div class="skeleton-chart-area">
			<div class="skeleton-grid-lines">
				<div class="skeleton-grid-line"></div>
				<div class="skeleton-grid-line"></div>
				<div class="skeleton-grid-line"></div>
				<div class="skeleton-grid-line"></div>
			</div>
			<svg class="skeleton-line" viewBox="0 0 100 50" preserveAspectRatio="none">
				<path
					d="M 0,35 Q 15,30 25,32 T 50,28 Q 65,26 75,30 T 100,25"
					fill="none"
					stroke="var(--bg-3)"
					stroke-width="2"
					opacity="0.5"
				/>
			</svg>
		</div>
		<div class="skeleton-x-axis">
			<div class="skeleton-tick"></div>
			<div class="skeleton-tick"></div>
			<div class="skeleton-tick"></div>
			<div class="skeleton-tick"></div>
			<div class="skeleton-tick"></div>
		</div>
	</div>
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
		position: relative;
		display: flex;
		flex-direction: column;
		padding: 8px 50px 24px 8px;
	}

	.skeleton-y-axis {
		position: absolute;
		right: 0;
		top: 8px;
		bottom: 24px;
		width: 50px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 0 8px;
	}

	.skeleton-y-axis .skeleton-tick {
		width: 30px;
		height: 10px;
		background: linear-gradient(90deg, var(--bg-2) 0%, var(--bg-3) 50%, var(--bg-2) 100%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: var(--radius-sm);
	}

	.skeleton-x-axis {
		display: flex;
		justify-content: space-between;
		padding: 8px 0 0 0;
		gap: 8px;
	}

	.skeleton-x-axis .skeleton-tick {
		flex: 1;
		height: 10px;
		background: linear-gradient(90deg, var(--bg-2) 0%, var(--bg-3) 50%, var(--bg-2) 100%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: var(--radius-sm);
	}

	.skeleton-chart-area {
		flex: 1;
		position: relative;
		min-height: 0;
	}

	.skeleton-grid-lines {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 4px 0;
	}

	.skeleton-grid-line {
		width: 100%;
		height: 1px;
		background: var(--bg-2);
	}

	.skeleton-line {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		animation: fadeInOut 2s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@keyframes fadeInOut {
		0%,
		100% {
			opacity: 0.3;
		}
		50% {
			opacity: 0.6;
		}
	}
</style>
