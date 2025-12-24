<script lang="ts">
	import { browser } from '$app/environment';
	import { createQuery } from '@tanstack/svelte-query';
	import { LayerCake, Svg } from 'layercake';
	import Area from '$lib/components/charts/Area.svelte';
	import { walletState } from '$lib/stores/wallet.svelte';
	import { formatCurrency } from '$lib/utils/formatters';

	type TimePeriod = '1D' | '1W' | '1M' | 'ALL';

	interface PnLDataPoint {
		timestamp: number;
		value: number;
		realizedPnl: number;
		unrealizedPnl: number;
	}

	interface PnLResponse {
		period: TimePeriod;
		totalPnl: number;
		realizedPnl: number;
		unrealizedPnl: number;
		data: PnLDataPoint[];
	}

	const DEFAULT_DATA = [
		{ x: 0, y: 0 },
		{ x: 1, y: 0 },
		{ x: 2, y: 0 },
		{ x: 3, y: 0 },
		{ x: 4, y: 0 },
		{ x: 5, y: 0 }
	] as const;

	const PERIOD_LABELS: Record<TimePeriod, string> = {
		'1D': 'Past Day',
		'1W': 'Past Week',
		'1M': 'Past Month',
		ALL: 'All Time'
	} as const;

	let selectedPeriod = $state<TimePeriod>('1M');

	const pnlQuery = createQuery<PnLResponse>(() => ({
		queryKey: ['users', 'pnl', walletState.proxyWalletAddress, selectedPeriod],
		queryFn: async () => {
			const res = await fetch(
				`/api/users/pnl?user=${walletState.proxyWalletAddress}&period=${selectedPeriod}`
			);
			if (!res.ok) throw new Error('Failed to fetch P&L data');
			return res.json();
		},
		enabled: browser && !!walletState.proxyWalletAddress
	}));

	const chartData = $derived.by(() => {
		if (!pnlQuery.data?.data || pnlQuery.data.data.length === 0) {
			return DEFAULT_DATA;
		}

		// Transform API data to chart format
		return pnlQuery.data.data.map((point) => ({
			x: point.timestamp,
			y: point.value
		}));
	});

	const totalPnl = $derived(pnlQuery.data?.totalPnl ?? 0);
	const isPositive = $derived(totalPnl > 0);
	const isNegative = $derived(totalPnl < 0);

	const formattedPnl = $derived(formatCurrency(totalPnl));

	function handlePeriodChange(period: TimePeriod) {
		selectedPeriod = period;
	}
</script>

<div class="profit-loss-card">
	<div class="card-header">
		<div class="header-left">
			<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
				{#if isPositive}
					<path d="M6 2L10 10H2L6 2Z" fill="var(--success)" />
				{:else if isNegative}
					<path d="M6 10L10 2H2L6 10Z" fill="var(--danger)" />
				{:else}
					<circle cx="6" cy="6" r="4" fill="var(--text-2)" />
				{/if}
			</svg>
			<span class="card-label">Profit/Loss</span>
		</div>
		<div class="time-periods">
			<button
				class="period-btn"
				class:active={selectedPeriod === '1D'}
				onclick={() => handlePeriodChange('1D')}
			>
				1D
			</button>
			<button
				class="period-btn"
				class:active={selectedPeriod === '1W'}
				onclick={() => handlePeriodChange('1W')}
			>
				1W
			</button>
			<button
				class="period-btn"
				class:active={selectedPeriod === '1M'}
				onclick={() => handlePeriodChange('1M')}
			>
				1M
			</button>
			<button
				class="period-btn"
				class:active={selectedPeriod === 'ALL'}
				onclick={() => handlePeriodChange('ALL')}
			>
				ALL
			</button>
		</div>
	</div>

	<div class="value-section">
		<span class="value" class:positive={isPositive} class:negative={isNegative}>
			{formattedPnl}
		</span>
		<span class="subtitle">{PERIOD_LABELS[selectedPeriod]}</span>
	</div>

	<div class="chart-container">
		<LayerCake padding={{ top: 0, right: 0, bottom: 0, left: 0 }} x="x" y="y" data={chartData}>
			<Svg>
				<Area color={isPositive ? 'success' : isNegative ? 'danger' : 'primary'} />
			</Svg>
		</LayerCake>
	</div>
</div>

<style>
	.profit-loss-card {
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-xl);
		padding: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		min-height: 200px;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.card-label {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-1);
	}

	.time-periods {
		display: flex;
		gap: var(--space-xs);
	}

	.period-btn {
		padding: 4px 10px;
		font-size: 12px;
		font-weight: 500;
		color: var(--text-2);
		background: none;
		border: none;
		border-radius: var(--radius-button);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.period-btn:hover {
		color: var(--text-0);
		background: var(--bg-2);
	}

	.period-btn.active {
		color: var(--primary);
		background: var(--primary-bg);
		font-weight: 600;
		border: 1px solid var(--primary);
	}

	.value-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.value {
		font-size: 28px;
		font-weight: 600;
		color: var(--text-0);
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.value.positive {
		color: var(--success);
	}

	.value.negative {
		color: var(--danger);
	}

	.subtitle {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-2);
	}

	.chart-container {
		position: relative;
		flex: 1;
		min-height: 80px;
		margin: 0 calc(-1 * var(--space-md));
		margin-bottom: calc(-1 * var(--space-md));
	}
</style>
