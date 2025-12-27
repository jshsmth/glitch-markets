<script lang="ts">
	import type { Market } from '$lib/server/api/polymarket-client';
	import { parseMarketData, getMarketDisplayTitle, getSeriesColor } from '$lib/utils/event-helpers';

	interface Props {
		markets: Market[];
		isMultiMarket: boolean;
		selectedMarketData?: ReturnType<typeof parseMarketData>;
	}

	let { markets, isMultiMarket, selectedMarketData }: Props = $props();
</script>

<section class="probability-summary">
	{#if isMultiMarket}
		{#each markets.slice(0, 3) as market, index (market.id)}
			{@const marketData = parseMarketData(market)}
			{@const percentage = marketData?.[0]?.priceFormatted || '—'}
			<div class="summary-item">
				<span class="summary-dot" style="background-color: {getSeriesColor(index)}"></span>
				<span class="summary-name">{getMarketDisplayTitle(market)}</span>
				<span class="summary-percentage">{percentage}%</span>
			</div>
		{/each}
	{:else if selectedMarketData}
		{#each selectedMarketData as outcome, index (index)}
			<div class="summary-item">
				<span
					class="summary-dot"
					style="background-color: {index === 0 ? 'var(--success)' : 'var(--danger)'}"
				></span>
				<span class="summary-name">{outcome.label}</span>
				<span class="summary-percentage">{outcome.priceFormatted}%</span>
			</div>
		{/each}
	{/if}
</section>

<style>
	.probability-summary {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 8px;
	}

	.summary-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
	}

	.summary-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.summary-name {
		color: var(--text-0);
		font-weight: 500;
	}

	.summary-percentage {
		font-weight: 700;
		color: var(--text-0);
	}
</style>
