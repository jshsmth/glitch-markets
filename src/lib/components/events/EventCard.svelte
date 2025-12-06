<script lang="ts">
	import type { Event } from '$lib/server/api/polymarket-client';

	interface Props {
		event: Event;
	}

	let { event }: Props = $props();

	function formatNumber(num: number | null | undefined): string {
		if (num === null || num === undefined) return '$0';
		if (num >= 1000000) {
			return `$${(num / 1000000).toFixed(1)}M`;
		}
		if (num >= 1000) {
			return `$${(num / 1000).toFixed(1)}K`;
		}
		return `$${num.toFixed(0)}`;
	}

	function truncateText(text: string | null, maxLength: number): string {
		if (!text) return '';
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength) + '...';
	}

	function getCleanDescription(description: string | null): string | null {
		if (!description) return null;

		const resolutionPatterns = [
			'This market will resolve',
			'This question will resolve',
			'This will resolve',
			'Resolves to',
			'Resolution criteria',
			'The primary resolution source',
			'Resolution source',
			'Otherwise, this market',
			'If the',
			'For the purposes of this market'
		];

		let cleanDesc = description;
		let earliestIndex = cleanDesc.length;

		for (const pattern of resolutionPatterns) {
			const index = cleanDesc.toLowerCase().indexOf(pattern.toLowerCase());
			if (index > 0 && index < earliestIndex) {
				earliestIndex = index;
			}
		}

		if (earliestIndex < cleanDesc.length) {
			cleanDesc = cleanDesc.substring(0, earliestIndex).trim();
		}

		return cleanDesc.length > 10 ? cleanDesc : null;
	}

	const isMultiMarket = $derived((event.markets?.length || 0) > 1);

	const primaryMarket = $derived(
		event.markets?.find((m) => m.outcomes && m.outcomePrices) || event.markets?.[0]
	);

	const primaryOdds = $derived.by(() => {
		if (isMultiMarket) return null;
		if (!primaryMarket?.outcomePrices || !primaryMarket?.outcomes) return null;

		try {
			const outcomes = typeof primaryMarket.outcomes === 'string'
				? JSON.parse(primaryMarket.outcomes)
				: primaryMarket.outcomes;
			const prices = typeof primaryMarket.outcomePrices === 'string'
				? JSON.parse(primaryMarket.outcomePrices)
				: primaryMarket.outcomePrices;

			if (!Array.isArray(outcomes) || !Array.isArray(prices)) return null;
			if (outcomes.length < 2 || prices.length < 2) return null;

			const percentages = prices.map((p: string) => parseFloat(p) * 100);

			return [
				{
					label: outcomes[0] || 'Yes',
					price: percentages[0]?.toFixed(0) || '—'
				},
				{
					label: outcomes[1] || 'No',
					price: percentages[1]?.toFixed(0) || '—'
				}
			];
		} catch (e) {
			console.error('Error parsing market odds:', e);
			return null;
		}
	});

	const topMarkets = $derived.by(() => {
		if (!isMultiMarket || !event.markets) return null;
		return event.markets.slice(0, 2).map((market) => {
			try {
				const outcomes = typeof market.outcomes === 'string'
					? JSON.parse(market.outcomes)
					: market.outcomes;
				const prices = typeof market.outcomePrices === 'string'
					? JSON.parse(market.outcomePrices)
					: market.outcomePrices;

				const displayTitle = market.groupItemTitle || (Array.isArray(outcomes) && outcomes[0]) || market.question;

				return {
					question: displayTitle,
					outcomes: Array.isArray(outcomes) && Array.isArray(prices) && outcomes.length >= 2
						? [
							{
								label: outcomes[0],
								price: (parseFloat(prices[0]) * 100).toFixed(0)
							},
							{
								label: outcomes[1],
								price: (parseFloat(prices[1]) * 100).toFixed(0)
							}
						]
						: null
				};
			} catch (e) {
				return {
					question: market.question,
					outcomes: null
				};
			}
		});
	});
</script>

<div class="event-card">
	<div class="card-content">
		<div class="card-header">
			<div class="title-row">
				{#if event.image}
					<div class="event-icon">
						<img src={event.image} alt="" />
					</div>
				{/if}
				<a href={`/event/${event.slug || event.id}`} class="event-title-link">
					<h3 class="event-title">{event.title || 'Untitled Event'}</h3>
				</a>
			</div>
		</div>

		{#if primaryOdds}
			<div class="odds-section binary">
				{#each primaryOdds as outcome}
					<a href={`/event/${event.slug || event.id}`} class="outcome-chip">
						<span class="outcome-label">{outcome.label}</span>
						<span class="outcome-price">{outcome.price}%</span>
					</a>
				{/each}
			</div>
		{/if}

		{#if topMarkets}
			<div class="markets-preview">
				{#each topMarkets as market}
					<div class="market-item">
						<div class="market-question">{market.question}</div>
						{#if market.outcomes}
							<div class="market-outcomes-inline">
								{#each market.outcomes as outcome}
									<a href={`/event/${event.slug || event.id}`} class="outcome-button-inline">
										<span class="outcome-button-label">{outcome.label}</span>
										<span class="outcome-button-price">{outcome.price}%</span>
									</a>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<div class="card-footer">
			<div class="stats">
				<div class="stat">
					<span class="stat-label">Vol</span>
					<span class="stat-value">{formatNumber(event.volume24hr)}</span>
				</div>
				<div class="stat">
					<span class="stat-label">Liq</span>
					<span class="stat-value">{formatNumber(event.liquidity)}</span>
				</div>
				<div class="stat">
					<span class="stat-label">Markets</span>
					<span class="stat-value">{event.markets?.length || 0}</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.event-card {
		display: flex;
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-card);
		padding: 12px;
		transition: all var(--transition-fast);
		color: inherit;
		height: 100%;
		min-height: 220px;
	}

	.card-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		width: 100%;
	}

	.card-header {
		margin-bottom: 0;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.event-icon {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		border-radius: var(--radius-sm);
		overflow: hidden;
		background: var(--bg-2);
	}

	.event-icon img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.event-title-link {
		flex: 1;
		text-decoration: none;
		color: inherit;
		min-width: 0;
	}

	.event-title-link:hover .event-title {
		text-decoration: underline;
	}

	.event-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--text-0);
		line-height: 1.4;
		margin: 0;
	}


	.odds-section {
		display: flex;
		gap: var(--space-sm);
	}

	.outcome-chip {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-xs);
		padding: 8px 12px;
		background: var(--bg-2);
		border-radius: var(--radius-sm);
		border: 1px solid var(--bg-3);
		text-decoration: none;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.outcome-chip:hover {
		background: var(--bg-3);
		border-color: var(--bg-4);
	}

	.outcome-label {
		font-size: 13px;
		color: var(--text-1);
		font-weight: 500;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}

	.outcome-price {
		font-size: 15px;
		font-weight: 700;
		color: var(--text-0);
		white-space: nowrap;
	}

	.markets-preview {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.market-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
	}

	.market-question {
		font-size: 13px;
		color: var(--text-0);
		font-weight: 500;
		line-height: 1.4;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.market-outcomes-inline {
		display: flex;
		gap: 6px;
		flex-shrink: 0;
		margin-left: auto;
	}

	.outcome-button-inline {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		background: var(--bg-0);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
		white-space: nowrap;
		text-decoration: none;
	}

	.outcome-button-inline:hover {
		background: var(--bg-2);
		border-color: var(--bg-4);
	}

	.outcome-button-label {
		font-size: 12px;
		color: var(--text-1);
		font-weight: 500;
	}

	.outcome-button-price {
		font-size: 12px;
		color: var(--text-0);
		font-weight: 600;
	}

	.card-footer {
		margin-top: auto;
		padding-top: 0;
	}

	.stats {
		display: flex;
		gap: var(--space-md);
		font-size: 12px;
		color: var(--text-3);
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.stat-label {
		font-size: 11px;
		color: var(--text-3);
		font-weight: 500;
	}

	.stat-value {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-1);
	}

	@media (max-width: 768px) {
		.event-card {
			padding: var(--space-md);
		}

		.event-title {
			font-size: 15px;
		}

		.stats {
			gap: var(--space-md);
		}

		.stat-value {
			font-size: 15px;
		}
	}
</style>
