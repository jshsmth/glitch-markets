<script lang="ts">
	import type { Event } from '$lib/server/api/polymarket-client';
	import MoneyIcon from '$lib/components/icons/MoneyIcon.svelte';
	import WaterLiquidIcon from '$lib/components/icons/WaterLiquidIcon.svelte';
	import BookmarkIcon from '$lib/components/icons/BookmarkIcon.svelte';
	import CheckCircleIcon from '$lib/components/icons/CheckCircleIcon.svelte';

	interface Props {
		event: Event;
		variant?: 'default' | 'compact';
	}

	let { event, variant = 'default' }: Props = $props();

	const OUTCOME_COLORS = [
		'#8b5cf6', // Purple
		'#ec4899', // Pink
		'#f59e0b', // Amber
		'#00d9ff', // Cyan (brand)
		'#10b981', // Green
		'#f97316', // Orange
		'#6366f1', // Indigo
		'#14b8a6'  // Teal
	];

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

	const parsedPrimaryMarket = $derived.by(() => {
		if (!primaryMarket?.outcomes || !primaryMarket?.outcomePrices) return null;
		try {
			const outcomes =
				typeof primaryMarket.outcomes === 'string'
					? JSON.parse(primaryMarket.outcomes)
					: primaryMarket.outcomes;
			const prices =
				typeof primaryMarket.outcomePrices === 'string'
					? JSON.parse(primaryMarket.outcomePrices)
					: primaryMarket.outcomePrices;
			return { outcomes, prices };
		} catch {
			return null;
		}
	});

	interface OutcomeData {
		label: string;
		percentage: number;
		color: string;
	}

	const binaryOutcomes = $derived.by((): OutcomeData[] | null => {
		if (isMultiMarket) return null;
		if (!parsedPrimaryMarket) return null;

		const { outcomes, prices } = parsedPrimaryMarket;
		if (!Array.isArray(outcomes) || !Array.isArray(prices)) return null;
		if (outcomes.length < 2 || prices.length < 2) return null;

		const yesPercentage = parseFloat(prices[0]) * 100;
		const noPercentage = parseFloat(prices[1]) * 100;

		return [
			{ label: outcomes[0] || 'Yes', percentage: yesPercentage, color: '#10b981' },
			{ label: outcomes[1] || 'No', percentage: noPercentage, color: '#ef4444' }
		];
	});

	const multiOutcomes = $derived.by((): OutcomeData[] | null => {
		if (!isMultiMarket || !event.markets) return null;

		const allOutcomes: OutcomeData[] = [];

		for (const market of event.markets) {
			try {
				const outcomes =
					typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes;
				const prices =
					typeof market.outcomePrices === 'string'
						? JSON.parse(market.outcomePrices)
						: market.outcomePrices;

				if (Array.isArray(outcomes) && Array.isArray(prices) && outcomes.length >= 1) {
					const displayTitle =
						market.groupItemTitle || outcomes[0] || market.question;
					const percentage = parseFloat(prices[0]) * 100;
					allOutcomes.push({
						label: displayTitle,
						percentage,
						color: OUTCOME_COLORS[allOutcomes.length % OUTCOME_COLORS.length]
					});
				}
			} catch {
				// Skip invalid markets
			}
		}

		return allOutcomes.length > 0
			? allOutcomes.sort((a, b) => b.percentage - a.percentage)
			: null;
	});

	const displayOutcomes = $derived(multiOutcomes || binaryOutcomes);
	const leadingOutcome = $derived(displayOutcomes?.[0] || null);
	const outcomeCount = $derived(displayOutcomes?.length || 0);
	const isEffectivelyResolved = $derived(leadingOutcome && leadingOutcome.percentage >= 99);
</script>

<a
	href={`/event/${event.slug || event.id}`}
	class="event-card"
	class:compact={variant === 'compact'}
	class:resolved={isEffectivelyResolved}
	data-sveltekit-preload-data="hover"
>
	<div class="card-content">
		<!-- Header: Icon + Title -->
		<div class="card-header">
			<div class="title-row">
				{#if event.image}
					<div class="event-icon">
						<img src={event.image} alt={event.title || 'Event icon'} />
					</div>
				{/if}
				<h3 class="event-title">{event.title || 'Untitled Event'}</h3>
				{#if isEffectivelyResolved}
					<div class="resolved-badge">
						<CheckCircleIcon size={14} />
						<span>Resolved</span>
					</div>
				{/if}
			</div>

			<!-- Binary: Inline bar next to title -->
			{#if !isMultiMarket && displayOutcomes && leadingOutcome && !isEffectivelyResolved}
				<div class="probability-inline">
					<div class="probability-bar">
						{#each displayOutcomes as outcome, i (i)}
							<div
								class="bar-segment"
								style="width: {outcome.percentage}%; background-color: {outcome.color};"
								title="{outcome.label}: {outcome.percentage.toFixed(0)}%"
							></div>
						{/each}
					</div>
					<span class="outcome-percentage" style="color: {leadingOutcome.color}">
						{leadingOutcome.percentage.toFixed(0)}%
					</span>
				</div>
			{/if}
		</div>

		<!-- Multi-market: Leading outcome highlight (hide if resolved) -->
		{#if isMultiMarket && displayOutcomes && leadingOutcome && !isEffectivelyResolved}
			<div class="multi-highlight">
				<div class="leading-text">
					<span class="leader-name">{leadingOutcome.label}</span>
					<span class="leader-odds">
						{leadingOutcome.percentage.toFixed(0)}%
					</span>
				</div>
				<div class="probability-bar full">
					<div
						class="bar-segment leader"
						style="width: {leadingOutcome.percentage}%;"
						title="{leadingOutcome.label}: {leadingOutcome.percentage.toFixed(0)}%"
					></div>
				</div>
				<div class="multi-meta">
					<span>{outcomeCount} outcomes</span>
				</div>
			</div>
		{:else if isMultiMarket && isEffectivelyResolved && leadingOutcome}
			<div class="resolved-winner">
				<CheckCircleIcon size={16} />
				<span class="winner-name">{leadingOutcome.label}</span>
			</div>
		{/if}

		<!-- Footer Stats -->
		{#if variant !== 'compact'}
			<div class="card-footer">
				<div class="stats">
					<div class="stat">
						<MoneyIcon size={14} class="stat-icon" />
						<span class="stat-value">{formatNumber(event.volume24hr)}</span>
						<span class="stat-label">24h</span>
					</div>
					<div class="stat">
						<WaterLiquidIcon size={14} class="stat-icon" />
						<span class="stat-value">{formatNumber(event.liquidity)}</span>
						<span class="stat-label">Liq</span>
					</div>
				</div>
				<button
					class="bookmark-btn"
					onclick={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
					aria-label="Bookmark this event"
				>
					<BookmarkIcon size={18} />
				</button>
			</div>
		{/if}
	</div>
</a>

<style>
	.event-card {
		display: flex;
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-card);
		padding: var(--spacing-4);
		box-shadow: var(--shadow-sm);
		transition: all var(--transition-fast);
		color: inherit;
		text-decoration: none;
		height: 100%;
	}

	.event-card:hover {
		border-color: var(--primary);
		box-shadow: var(--shadow-primary-md);
		transform: translateY(-1px);
	}

	.event-card:focus-visible {
		outline: none;
		border-color: var(--primary);
		box-shadow: var(--focus-ring);
	}

	/* Resolved state */
	.event-card.resolved {
		opacity: 0.7;
		background: var(--bg-2);
	}

	.event-card.resolved:hover {
		opacity: 0.85;
	}

	.resolved-badge {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 3px 8px;
		background: rgba(0, 196, 71, 0.12);
		border-radius: var(--radius-sm);
		color: var(--success);
		font-size: 11px;
		font-weight: 600;
		white-space: nowrap;
		flex-shrink: 0;
	}

	/* Compact variant */
	.event-card.compact {
		padding: var(--spacing-3);
	}

	.event-card.compact .event-icon {
		width: 28px;
		height: 28px;
	}

	.event-card.compact .event-title {
		font-size: 14px;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	.card-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3);
		width: 100%;
	}

	/* Header */
	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-3);
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		flex: 1;
		min-width: 0;
	}

	.probability-inline {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.event-icon {
		flex-shrink: 0;
		width: 36px;
		height: 36px;
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

	.event-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--text-0);
		line-height: 1.35;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.bookmark-btn {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--text-3);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.bookmark-btn:hover {
		background: var(--bg-2);
		color: var(--primary);
	}

	.bookmark-btn:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	/* Probability Bar */
	.probability-bar {
		display: flex;
		width: 60px;
		height: 16px;
		overflow: hidden;
		background: var(--bg-3);
	}

	.probability-bar.full {
		width: 100%;
		height: 12px;
	}

	.bar-segment {
		height: 100%;
		min-width: 2px;
		transition: width 0.3s ease;
	}

	.bar-segment.leader {
		background-color: var(--primary);
	}

	.outcome-percentage {
		font-size: 14px;
		font-weight: 700;
		white-space: nowrap;
	}

	/* Multi-market highlight */
	.multi-highlight {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.leading-text {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-2);
	}

	.leader-name {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-1);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
		min-width: 0;
	}

	.leader-odds {
		font-size: 14px;
		font-weight: 700;
		white-space: nowrap;
		color: var(--primary);
	}

	.multi-meta {
		font-size: 12px;
		color: var(--text-3);
	}

	/* Resolved winner display */
	.resolved-winner {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--success);
	}

	.winner-name {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-1);
	}

	/* Footer Stats */
	.card-footer {
		margin-top: auto;
		padding-top: var(--spacing-3);
		border-top: 1px solid var(--bg-3);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.stats {
		display: flex;
		gap: var(--spacing-5);
		align-items: center;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.stat :global(.stat-icon) {
		color: var(--text-3);
		flex-shrink: 0;
	}

	.stat-value {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-1);
	}

	.stat-label {
		font-size: 11px;
		color: var(--text-3);
		font-weight: 500;
	}

	/* Mobile */
	@media (max-width: 768px) {
		.event-card {
			padding: var(--spacing-3);
		}

		.event-icon {
			width: 32px;
			height: 32px;
		}

		.event-title {
			font-size: 14px;
		}

		.stats {
			gap: var(--spacing-4);
		}
	}
</style>
