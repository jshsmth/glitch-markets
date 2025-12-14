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
	}

	// Binary market: Yes percentage determines color (green if ≥50%, red if <50%)
	const binaryData = $derived.by((): { yes: OutcomeData; no: OutcomeData; leansYes: boolean } | null => {
		if (isMultiMarket) return null;
		if (!parsedPrimaryMarket) return null;

		const { outcomes, prices } = parsedPrimaryMarket;
		if (!Array.isArray(outcomes) || !Array.isArray(prices)) return null;
		if (outcomes.length < 2 || prices.length < 2) return null;

		const yesPercentage = parseFloat(prices[0]) * 100;
		const noPercentage = parseFloat(prices[1]) * 100;

		return {
			yes: { label: outcomes[0] || 'Yes', percentage: yesPercentage },
			no: { label: outcomes[1] || 'No', percentage: noPercentage },
			leansYes: yesPercentage >= 50
		};
	});

	// Multi-market outcomes sorted by percentage
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
					const displayTitle = market.groupItemTitle || outcomes[0] || market.question;
					const percentage = parseFloat(prices[0]) * 100;
					allOutcomes.push({ label: displayTitle, percentage });
				}
			} catch {
				// Skip invalid markets
			}
		}

		return allOutcomes.length > 0
			? allOutcomes.sort((a, b) => b.percentage - a.percentage)
			: null;
	});

	const leadingOutcome = $derived(multiOutcomes?.[0] || null);
	const secondOutcome = $derived(multiOutcomes?.[1] || null);
	const outcomeCount = $derived(multiOutcomes?.length || 0);

	// Resolved detection
	const isEffectivelyResolved = $derived.by(() => {
		if (binaryData) return binaryData.yes.percentage >= 99 || binaryData.no.percentage >= 99;
		if (leadingOutcome) return leadingOutcome.percentage >= 99;
		return false;
	});

	// Closing soon detection (within 7 days)
	const closingSoon = $derived.by((): { days: number } | null => {
		if (!event.endDate || isEffectivelyResolved) return null;
		const endDate = new Date(event.endDate);
		const now = new Date();
		const diffMs = endDate.getTime() - now.getTime();
		const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
		if (diffDays > 0 && diffDays <= 7) {
			return { days: diffDays };
		}
		return null;
	});
</script>

<a
	href={`/event/${event.slug || event.id}`}
	class="event-card"
	class:compact={variant === 'compact'}
	class:resolved={isEffectivelyResolved}
	data-sveltekit-preload-data="hover"
>
	<!-- Resolved badge (top-right corner) -->
	{#if isEffectivelyResolved}
		<div class="corner-badge resolved-badge">
			<CheckCircleIcon size={12} />
			<span>Resolved</span>
		</div>
	{:else if closingSoon}
		<div class="corner-badge closing-badge">
			<span>Closes in {closingSoon.days}d</span>
		</div>
	{/if}

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
			</div>
		</div>

		<!-- Binary Market Display -->
		{#if binaryData && !isEffectivelyResolved}
			<div class="binary-display">
				<div class="binary-header">
					<span class="binary-label">{binaryData.yes.label}</span>
					<span class="binary-percentage" class:leans-yes={binaryData.leansYes} class:leans-no={!binaryData.leansYes}>
						{binaryData.yes.percentage.toFixed(0)}%
					</span>
				</div>
				<div class="probability-bar" class:bar-yes={binaryData.leansYes} class:bar-no={!binaryData.leansYes}>
					<div
						class="bar-fill"
						style="width: {binaryData.yes.percentage}%;"
					></div>
				</div>
			</div>
		{:else if binaryData && isEffectivelyResolved}
			<div class="resolved-winner">
				<CheckCircleIcon size={16} />
				<span class="winner-name">
					{binaryData.yes.percentage >= 99 ? binaryData.yes.label : binaryData.no.label}
				</span>
			</div>
		{/if}

		<!-- Multi-market Display -->
		{#if isMultiMarket && leadingOutcome && !isEffectivelyResolved}
			<div class="multi-display">
				<div class="multi-header">
					<span class="leader-name">{leadingOutcome.label}</span>
					<span class="leader-percentage">{leadingOutcome.percentage.toFixed(0)}%</span>
				</div>
				<div class="probability-bar bar-multi">
					<div
						class="bar-fill"
						style="width: {leadingOutcome.percentage}%;"
					></div>
				</div>
				<div class="multi-meta">
					<span>{outcomeCount} outcomes</span>
					{#if secondOutcome}
						<span class="second-place">2nd: {secondOutcome.label} ({secondOutcome.percentage.toFixed(0)}%)</span>
					{/if}
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
		position: relative;
		display: flex;
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
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
		opacity: 0.65;
		background: var(--bg-2);
	}

	.event-card.resolved:hover {
		opacity: 0.8;
	}

	/* Corner badges */
	.corner-badge {
		position: absolute;
		top: 8px;
		right: 8px;
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 3px 8px;
		border-radius: var(--radius-sm);
		font-size: 10px;
		font-weight: 600;
		white-space: nowrap;
		z-index: 1;
	}

	.resolved-badge {
		background: var(--bg-3);
		color: var(--success);
	}

	.closing-badge {
		background: rgba(245, 158, 11, 0.15);
		color: #f59e0b;
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
		align-items: flex-start;
		padding-right: 70px; /* Space for corner badge */
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		flex: 1;
		min-width: 0;
	}

	.event-icon {
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--bg-2);
		border: 1px solid var(--bg-3);
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

	/* Binary Market Display */
	.binary-display {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.binary-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-2);
	}

	.binary-label {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-1);
	}

	.binary-percentage {
		font-size: 20px;
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	.binary-percentage.leans-yes {
		color: var(--success);
	}

	.binary-percentage.leans-no {
		color: var(--danger);
	}

	/* Probability Bar */
	.probability-bar {
		width: 100%;
		height: 8px;
		background: var(--bg-3);
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		transition: width 0.3s ease;
	}

	.probability-bar.bar-yes .bar-fill {
		background-color: var(--success);
	}

	.probability-bar.bar-no .bar-fill {
		background-color: var(--danger);
	}

	.probability-bar.bar-multi .bar-fill {
		background-color: var(--primary);
	}

	/* Multi-market Display */
	.multi-display {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.multi-header {
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

	.leader-percentage {
		font-size: 20px;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: var(--primary);
		white-space: nowrap;
	}

	.multi-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 12px;
		color: var(--text-3);
	}

	.second-place {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 60%;
		text-align: right;
	}

	/* Resolved winner */
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

	/* Footer */
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

		.card-header {
			padding-right: 60px;
		}

		.corner-badge {
			font-size: 9px;
			padding: 2px 6px;
		}
	}
</style>
