<script lang="ts">
	import type { Event } from '$lib/server/api/polymarket-client';
	import MoneyIcon from '$lib/components/icons/MoneyIcon.svelte';
	import WaterLiquidIcon from '$lib/components/icons/WaterLiquidIcon.svelte';

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

	const isMultiMarket = $derived((event.markets?.length || 0) > 1);

	const primaryMarket = $derived(
		event.markets?.find((m) => m.outcomes && m.outcomePrices) || event.markets?.[0]
	);

	const primaryOdds = $derived.by(() => {
		if (isMultiMarket) return null;
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
			if (outcomes.length < 2 || prices.length < 2) return null;

			const percentages = prices.map((p: string) => parseFloat(p) * 100);

			return [
				{
					label: outcomes[0] || 'Yes',
					price: percentages[0]?.toFixed(0) || '—',
					percentage: percentages[0] || 0
				},
				{
					label: outcomes[1] || 'No',
					price: percentages[1]?.toFixed(0) || '—',
					percentage: percentages[1] || 0
				}
			];
		} catch {
			return null;
		}
	});

	const topMarkets = $derived.by(() => {
		if (!isMultiMarket || !event.markets) return null;
		return event.markets.slice(0, 2).map((market) => {
			try {
				const outcomes =
					typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes;
				const prices =
					typeof market.outcomePrices === 'string'
						? JSON.parse(market.outcomePrices)
						: market.outcomePrices;

				const displayTitle =
					market.groupItemTitle || (Array.isArray(outcomes) && outcomes[0]) || market.question;

				return {
					question: displayTitle,
					outcomes:
						Array.isArray(outcomes) && Array.isArray(prices) && outcomes.length >= 2
							? [
									{
										label: outcomes[0],
										price: (parseFloat(prices[0]) * 100).toFixed(0),
										percentage: parseFloat(prices[0]) * 100
									},
									{
										label: outcomes[1],
										price: (parseFloat(prices[1]) * 100).toFixed(0),
										percentage: parseFloat(prices[1]) * 100
									}
								]
							: null
				};
			} catch {
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
		<!-- Header with Icon + Title -->
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

		<!-- Binary Market: Odds Board Layout -->
		{#if primaryOdds}
			<div class="odds-board">
				{#each primaryOdds as outcome, i (i)}
					<a
						href={`/event/${event.slug || event.id}`}
						class="odds-row"
						class:is-yes={i === 0}
						class:is-no={i === 1}
						style="--fill-percentage: {outcome.percentage}%"
					>
						<span class="outcome-label">{outcome.label}</span>
						<span class="outcome-odds">{outcome.price}%</span>
					</a>
				{/each}
			</div>
		{/if}

		<!-- Multi-Market Preview -->
		{#if topMarkets}
			<div class="markets-preview">
				{#each topMarkets as market, i (i)}
					<div class="market-item">
						<div class="market-header">
							<div class="market-question">{market.question}</div>
						</div>
						{#if market.outcomes}
							<div class="market-odds-inline">
								{#each market.outcomes as outcome, j (j)}
									<a
										href={`/event/${event.slug || event.id}`}
										class="odds-chip"
										class:chip-first={j === 0}
										class:chip-second={j === 1}
										style="--fill-percentage: {outcome.percentage}%"
									>
										<span class="odds-chip-label">{outcome.label}</span>
										<span class="odds-chip-price">{outcome.price}%</span>
									</a>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<!-- Footer Stats -->
		<div class="card-footer">
			<div class="stats">
				<div class="stat">
					<MoneyIcon size={16} class="stat-icon" />
					<span class="stat-value">{formatNumber(event.volume24hr)}</span>
					<span class="stat-label">24h</span>
				</div>
				<div class="stat">
					<WaterLiquidIcon size={16} class="stat-icon" />
					<span class="stat-value">{formatNumber(event.liquidity)}</span>
					<span class="stat-label">Liq</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.event-card {
		display: flex;
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-card);
		padding: 18px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		transition:
			all var(--transition-fast),
			box-shadow var(--transition-fast);
		color: inherit;
		height: 100%;
	}

	.event-card:focus-within {
		outline: none;
		border-color: var(--primary);
		box-shadow: var(--shadow-primary-md);
	}

	:global([data-theme='dark']) .event-card {
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.card-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
	}

	/* ============================================
	   HEADER
	   ============================================ */

	.card-header {
		margin-bottom: 0;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.event-icon {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
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
		color: var(--primary);
		text-decoration: underline;
	}

	.event-title-link:focus-visible {
		outline: none;
		border-radius: 4px;
		box-shadow: var(--focus-ring);
	}

	.event-title {
		font-size: 17px;
		font-weight: 700;
		color: var(--text-0);
		line-height: 1.4;
		margin: 0;
		letter-spacing: -0.01em;
	}

	/* ============================================
	   ODDS BOARD (Binary Markets)
	   ============================================ */

	.odds-board {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.odds-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 12px;
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-sm);
		text-decoration: none;
		transition: all var(--transition-fast);
		position: relative;
		overflow: hidden;
	}

	.odds-row::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: var(--fill-percentage, 0%);
		background: linear-gradient(90deg, var(--row-gradient-start), var(--row-gradient-end));
		transition: width 0.3s ease, opacity 0.3s ease;
		z-index: 0;
	}

	/* Yes row: Green-to-cyan gradient */
	.odds-row.is-yes {
		--row-gradient-start: rgba(0, 196, 71, 0.12);
		--row-gradient-end: rgba(0, 217, 255, 0.08);
	}

	/* No row: Red-to-cyan gradient */
	.odds-row.is-no {
		--row-gradient-start: rgba(255, 51, 102, 0.12);
		--row-gradient-end: rgba(0, 217, 255, 0.08);
	}

	.odds-row:hover {
		border-color: var(--primary);
		transform: translateY(-1px);
	}

	.odds-row:hover::before {
		opacity: 1.3;
	}

	.odds-row:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.outcome-label {
		font-size: 14px;
		color: var(--text-0);
		font-weight: 500;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		flex: 1;
		min-width: 0;
		position: relative;
		z-index: 1;
	}

	.outcome-odds {
		font-size: 20px;
		font-weight: 800;
		color: var(--text-0);
		white-space: nowrap;
		letter-spacing: -0.02em;
		position: relative;
		z-index: 1;
	}

	/* ============================================
	   MULTI-MARKET PREVIEW
	   ============================================ */

	.markets-preview {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.market-item {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 12px;
		padding: 10px 0;
		border-bottom: 1px solid var(--bg-3);
	}

	.market-item:first-child {
		padding-top: 0;
	}

	.market-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.market-header {
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.market-question {
		font-size: 14px;
		color: var(--text-0);
		font-weight: 500;
		line-height: 1.4;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.market-odds-inline {
		display: flex;
		gap: 6px;
		flex-shrink: 0;
	}

	.odds-chip {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 5px 8px;
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
		white-space: nowrap;
		text-decoration: none;
		min-width: 65px;
		justify-content: space-between;
		position: relative;
		overflow: hidden;
	}

	.odds-chip::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: var(--fill-percentage, 0%);
		background: linear-gradient(90deg, var(--chip-gradient-start), var(--chip-gradient-end));
		transition: width 0.3s ease, opacity 0.3s ease;
		z-index: 0;
	}

	/* First chip: Green-to-cyan gradient */
	.odds-chip.chip-first {
		--chip-gradient-start: rgba(0, 196, 71, 0.1);
		--chip-gradient-end: rgba(0, 217, 255, 0.06);
	}

	/* Second chip: Cyan-to-purple gradient */
	.odds-chip.chip-second {
		--chip-gradient-start: rgba(0, 217, 255, 0.1);
		--chip-gradient-end: rgba(139, 92, 246, 0.08);
	}

	.odds-chip:hover {
		background: var(--primary-hover-bg);
		border-color: var(--primary);
		transform: translateY(-1px);
	}

	.odds-chip:hover::before {
		opacity: 1.3;
	}

	.odds-chip:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.odds-chip-label {
		font-size: 11px;
		color: var(--text-2);
		font-weight: 500;
		max-width: 50px;
		overflow: hidden;
		text-overflow: ellipsis;
		position: relative;
		z-index: 1;
	}

	.odds-chip-price {
		font-size: 12px;
		color: var(--text-0);
		font-weight: 700;
		white-space: nowrap;
		position: relative;
		z-index: 1;
	}

	/* ============================================
	   FOOTER STATS
	   ============================================ */

	.card-footer {
		margin-top: auto;
		padding-top: 4px;
		border-top: 1px solid var(--bg-3);
	}

	.stats {
		display: flex;
		gap: 20px;
		align-items: center;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.stat :global(.stat-icon) {
		color: var(--text-3);
		flex-shrink: 0;
	}

	.stat-value {
		font-size: 13px;
		font-weight: 700;
		color: var(--text-0);
	}

	.stat-label {
		font-size: 11px;
		color: var(--text-3);
		font-weight: 500;
	}

	/* ============================================
	   MOBILE OPTIMIZATIONS
	   ============================================ */

	@media (max-width: 768px) {
		.event-card {
			padding: 16px;
		}

		.event-title {
			font-size: 16px;
		}

		.event-icon {
			width: 36px;
			height: 36px;
		}

		.outcome-odds {
			font-size: 20px;
		}

		.stats {
			gap: 16px;
		}

		.stat-value {
			font-size: 12px;
		}

		.market-item {
			grid-template-columns: 1fr;
			gap: 8px;
		}

		.market-odds-inline {
			justify-content: flex-start;
		}

		.odds-chip-label {
			max-width: 80px;
		}
	}
</style>
