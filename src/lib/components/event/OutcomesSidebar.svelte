<script lang="ts">
	import type { Market } from '$lib/server/api/polymarket-client';
	import OutcomeCard from '$lib/components/event/OutcomeCard.svelte';
	import { parseMarketData, getMarketDisplayTitle } from '$lib/utils/event-helpers';

	interface Props {
		markets: Market[];
		isMultiMarket: boolean;
		selectedMarket: Market | null;
		selectedMarketData: ReturnType<typeof parseMarketData>;
	}

	let { markets, isMultiMarket, selectedMarket, selectedMarketData }: Props = $props();
</script>

<aside class="sidebar desktop-only">
	<div class="outcomes-panel">
		<h2 class="outcomes-panel-title">Outcomes</h2>
		<div class="outcomes-scroll">
			{#if isMultiMarket}
				{#each markets as market (market.id)}
					{@const marketData = parseMarketData(market)}
					{#if marketData}
						<OutcomeCard
							name={getMarketDisplayTitle(market)}
							volume={Number(market.volume) || 0}
							outcomeData={marketData}
						/>
					{/if}
				{/each}
			{:else if selectedMarketData}
				<OutcomeCard
					name={selectedMarket?.question || 'Unknown'}
					volume={Number(selectedMarket?.volume) || 0}
					outcomeData={selectedMarketData}
					showBetButtons={selectedMarketData.length === 1}
				/>
			{/if}
		</div>
	</div>
</aside>

<style>
	.desktop-only {
		display: none;
	}

	.sidebar {
		position: sticky;
		top: 80px;
		height: fit-content;
		max-height: calc(100vh - 100px);
		overflow-y: auto;
	}

	.outcomes-panel {
		background: transparent;
		border: none;
		border-radius: var(--radius-card);
		overflow: hidden;
	}

	.outcomes-panel-title {
		font-size: 11px;
		font-weight: 700;
		color: var(--text-3);
		text-transform: uppercase;
		letter-spacing: 1px;
		margin: 0;
		padding: var(--spacing-2) 0 var(--spacing-4) 0;
		border-bottom: none;
	}

	.outcomes-scroll {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3);
		max-height: calc(100vh - 200px);
		overflow-y: auto;
	}

	@media (min-width: 768px) {
		.desktop-only {
			display: block;
		}
	}
</style>
