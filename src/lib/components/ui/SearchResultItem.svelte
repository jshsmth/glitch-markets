<script lang="ts">
	import type { Event } from '$lib/server/api/polymarket-client';

	interface Props {
		event: Event;
		onclick?: () => void;
	}

	let { event, onclick }: Props = $props();

	const primaryMarket = $derived(
		event.markets?.find((m) => m.outcomes && m.outcomePrices) || event.markets?.[0]
	);

	const primaryOdds = $derived.by(() => {
		if (!primaryMarket?.outcomePrices || !primaryMarket?.outcomes) return null;

		try {
			const outcomes =
				typeof primaryMarket.outcomes === 'string'
					? JSON.parse(primaryMarket.outcomes)
					: primaryMarket.outcomes;
			const prices =
				typeof primaryMarket.outcomePrices === 'string'
					? JSON.parse(primaryMarket.outcomePrices)
					: primaryMarket.outcomePrices;

			if (!Array.isArray(outcomes) || !Array.isArray(prices)) return null;
			if (prices.length < 1) return null;

			const percentage = parseFloat(prices[0]) * 100;
			const winningOutcome = outcomes[0] || 'Yes';

			return {
				percentage: percentage.toFixed(0),
				outcome: winningOutcome,
				rawPercentage: percentage
			};
		} catch {
			return null;
		}
	});

	function formatVolume(num: number | null | undefined): string {
		if (num === null || num === undefined) return '0';
		if (num >= 1000000) {
			return `${(num / 1000000).toFixed(1)}M`;
		}
		if (num >= 1000) {
			return `${Math.floor(num / 1000)}K`;
		}
		return num.toFixed(0);
	}

	const volume = $derived(formatVolume(event.volume24hr || event.volume));
</script>

<a
	href={`/event/${event.slug || event.id}`}
	class="search-result-item"
	{onclick}
	data-sveltekit-preload-data="hover"
>
	<div class="item-left">
		{#if event.image || event.icon}
			<div class="item-icon">
				<img src={event.image || event.icon} alt={event.title || 'Event icon'} loading="lazy" />
			</div>
		{/if}
		<div class="item-title">{event.title || 'Untitled Event'}</div>
	</div>

	<div class="item-right">
		{#if primaryOdds}
			<div class="odds-display">
				<div class="odds-percentage">{primaryOdds.percentage}%</div>
				{#if primaryOdds.outcome !== 'Yes'}
					<div class="odds-outcome">{primaryOdds.outcome}</div>
				{/if}
			</div>
		{/if}
		{#if volume && volume !== '0'}
			<div class="item-volume">↑ {volume}</div>
		{/if}
	</div>
</a>

<style>
	.search-result-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 12px;
		border-radius: var(--radius-md);
		text-decoration: none;
		cursor: pointer;
		transition: background-color 0.15s ease;
		min-height: 48px;
	}

	.search-result-item:hover {
		background-color: var(--primary-hover-bg);
	}

	.search-result-item:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.item-left {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1;
		min-width: 0;
	}

	.item-icon {
		width: 32px;
		height: 32px;
		border-radius: var(--radius-sm);
		overflow: hidden;
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
		flex-shrink: 0;
	}

	.item-icon img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.item-title {
		font-size: 14px;
		font-weight: 500;
		color: var(--text-0);
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		line-height: 1.4;
	}

	.item-right {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.odds-display {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
	}

	.odds-percentage {
		font-size: 18px;
		font-weight: 700;
		color: var(--text-0);
		letter-spacing: -0.01em;
		line-height: 1;
	}

	.odds-outcome {
		font-size: 11px;
		font-weight: 500;
		color: var(--text-2);
		text-transform: capitalize;
	}

	.item-volume {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-3);
		white-space: nowrap;
	}
</style>
