<script lang="ts">
	import type { Event } from '$lib/server/api/polymarket-client';
	import MoneyIcon from '$lib/components/icons/MoneyIcon.svelte';
	import WaterLiquidIcon from '$lib/components/icons/WaterLiquidIcon.svelte';
	import BookmarkIcon from '$lib/components/icons/BookmarkIcon.svelte';
	import CheckCircleIcon from '$lib/components/icons/CheckCircleIcon.svelte';
	import ClockIcon from '$lib/components/icons/ClockIcon.svelte';
	import CupIcon from '$lib/components/icons/CupIcon.svelte';
	import { formatNumber } from '$lib/utils/format';

	interface Props {
		event: Event;
		variant?: 'default' | 'compact';
	}

	let { event, variant = 'default' }: Props = $props();

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
	const binaryData = $derived.by(
		(): { yes: OutcomeData; no: OutcomeData; leansYes: boolean } | null => {
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
		}
	);

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

		return allOutcomes.length > 0 ? allOutcomes.sort((a, b) => b.percentage - a.percentage) : null;
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

<div
	class="event-card"
	class:compact={variant === 'compact'}
	class:resolved={isEffectivelyResolved}
>
	<!-- Resolved badge (top-right corner) -->
	{#if isEffectivelyResolved}
		<div class="corner-badge resolved-badge">
			<CheckCircleIcon size={12} />
			<span>Resolved</span>
		</div>
	{:else if closingSoon}
		<div class="corner-badge closing-badge">
			<ClockIcon size={10} />
			<span>{closingSoon.days}d left</span>
		</div>
	{/if}

	<div class="card-content">
		<!-- Header: Icon + Title -->
		<div class="card-header">
			<div class="title-row">
				{#if event.image}
					<div class="event-icon">
						<img src={event.image} alt={event.title || 'Event icon'} loading="lazy" />
					</div>
				{/if}
				<a
					href={`/event/${event.slug || event.id}`}
					class="event-title-link"
					data-sveltekit-preload-data="hover"
				>
					<h3 class="event-title">{event.title || 'Untitled Event'}</h3>
				</a>
			</div>
		</div>

		<!-- Binary Market Display -->
		{#if binaryData && !isEffectivelyResolved}
			<div class="binary-display">
				<!-- Yes/Leading option -->
				<div class="binary-row" class:leading={binaryData.leansYes}>
					<div class="binary-option">
						<span class="binary-label" class:label-yes={binaryData.leansYes}
							>{binaryData.yes.label}</span
						>
						<span
							class="binary-percentage"
							class:pct-yes={binaryData.leansYes}
							class:pct-muted={!binaryData.leansYes}
						>
							{binaryData.yes.percentage.toFixed(0)}%
						</span>
					</div>
					<div
						class="probability-bar"
						class:bar-yes={binaryData.leansYes}
						class:bar-muted={!binaryData.leansYes}
					>
						<div class="bar-fill" style="width: {binaryData.yes.percentage}%;"></div>
					</div>
				</div>
				<!-- No option -->
				<div class="binary-row" class:leading={!binaryData.leansYes}>
					<div class="binary-option">
						<span class="binary-label" class:label-no={!binaryData.leansYes}
							>{binaryData.no.label}</span
						>
						<span
							class="binary-percentage"
							class:pct-no={!binaryData.leansYes}
							class:pct-muted={binaryData.leansYes}
						>
							{binaryData.no.percentage.toFixed(0)}%
						</span>
					</div>
					<div
						class="probability-bar"
						class:bar-no={!binaryData.leansYes}
						class:bar-muted={binaryData.leansYes}
					>
						<div class="bar-fill" style="width: {binaryData.no.percentage}%;"></div>
					</div>
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
				<!-- 1st Place -->
				<div class="outcome-row first-place">
					<div class="rank-badge rank-1">
						<CupIcon size={10} />
					</div>
					<div class="outcome-info">
						<div class="outcome-header">
							<span class="outcome-name">{leadingOutcome.label}</span>
							<span class="outcome-percentage first">{leadingOutcome.percentage.toFixed(0)}%</span>
						</div>
						<div class="probability-bar bar-first">
							<div class="bar-fill" style="width: {leadingOutcome.percentage}%;"></div>
						</div>
					</div>
				</div>

				<!-- 2nd Place -->
				{#if secondOutcome}
					<div class="outcome-row second-place">
						<div class="rank-badge rank-2">2</div>
						<div class="outcome-info">
							<div class="outcome-header">
								<span class="outcome-name">{secondOutcome.label}</span>
								<span class="outcome-percentage second">{secondOutcome.percentage.toFixed(0)}%</span
								>
							</div>
							<div class="probability-bar bar-second">
								<div class="bar-fill" style="width: {secondOutcome.percentage}%;"></div>
							</div>
						</div>
					</div>
				{/if}

				<!-- More outcomes indicator -->
				{#if outcomeCount > 2}
					<div class="more-outcomes">
						+{outcomeCount - 2} more outcome{outcomeCount - 2 === 1 ? '' : 's'}
					</div>
				{/if}
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
				<button class="bookmark-btn" aria-label="Bookmark this event">
					<BookmarkIcon size={18} />
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.event-card {
		position: relative;
		display: flex;
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-card);
		padding: var(--spacing-4);
		box-shadow: var(--shadow-sm);
		height: 100%;
		transition: all var(--transition-fast);
	}

	.event-card:hover {
		border-color: var(--bg-4);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	/* Resolved state */
	.event-card.resolved {
		opacity: 0.65;
		background: var(--bg-2);
	}

	.event-card.resolved:hover {
		opacity: 0.8;
	}

	/* Corner badges - pill shaped for differentiation */
	.corner-badge {
		position: absolute;
		top: 8px;
		right: 8px;
		display: flex;
		align-items: center;
		gap: 3px;
		padding: 4px 10px;
		border-radius: var(--radius-full);
		font-size: 10px;
		font-weight: 600;
		white-space: nowrap;
		z-index: 1;
	}

	.resolved-badge {
		background: var(--success-bg);
		color: var(--success-dark);
		border: 1px solid var(--success-light);
	}

	.closing-badge {
		background: var(--warning-bg);
		color: var(--warning-dark);
		border: 1px solid var(--warning-light);
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
		width: 40px;
		height: 40px;
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

	.event-title-link {
		text-decoration: none;
		color: inherit;
		flex: 1;
		min-width: 0;
	}

	.event-title-link:hover .event-title {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.event-title-link:focus-visible {
		outline: none;
	}

	.event-title-link:focus-visible .event-title {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.event-title {
		font-size: 15px;
		font-weight: 700;
		color: var(--text-0);
		line-height: 1.35;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		transition: color var(--transition-fast);
	}

	/* Binary Market Display */
	.binary-display {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
	}

	.binary-row {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.binary-row:not(.leading) {
		opacity: 0.7;
	}

	.binary-row:not(.leading) .probability-bar {
		height: 6px;
	}

	.binary-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-2);
	}

	.binary-label {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-2);
	}

	.binary-label.label-yes {
		font-weight: 600;
		color: var(--success);
	}

	.binary-label.label-no {
		font-weight: 600;
		color: var(--danger);
	}

	.binary-percentage {
		font-size: 15px;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.binary-percentage.pct-yes {
		color: var(--success);
	}

	.binary-percentage.pct-no {
		color: var(--danger);
	}

	.binary-percentage.pct-muted {
		color: var(--text-3);
		font-size: 13px;
		font-weight: 600;
	}

	.probability-bar.bar-muted .bar-fill {
		background: var(--bg-4);
	}

	/* Probability Bar */
	.probability-bar {
		width: 100%;
		height: 10px;
		background: var(--bg-3);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		border-radius: var(--radius-full);
		transition: width 0.3s ease;
	}

	.probability-bar.bar-yes .bar-fill {
		background-color: var(--success);
	}

	.probability-bar.bar-no .bar-fill {
		background-color: var(--danger);
	}

	/* Multi-market Display */
	.multi-display {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
	}

	/* Outcome Row - shared between 1st and 2nd */
	.outcome-row {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-2);
	}

	.outcome-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.outcome-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-2);
	}

	.outcome-name {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-0);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
		min-width: 0;
	}

	.outcome-percentage {
		font-size: 15px;
		font-weight: 700;
		letter-spacing: -0.01em;
		white-space: nowrap;
	}

	.outcome-percentage.first {
		color: #a68b2e;
	}

	.outcome-percentage.second {
		color: var(--text-2);
	}

	/* Rank Badges */
	.rank-badge {
		flex-shrink: 0;
		width: 18px;
		height: 18px;
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		font-weight: 700;
		margin-top: 1px;
	}

	.rank-1 {
		background: linear-gradient(135deg, #e6c76a 0%, #d4af37 100%);
		color: #5c4a15;
		box-shadow: 0 1px 2px rgba(212, 175, 55, 0.3);
	}

	.rank-2 {
		background: linear-gradient(135deg, var(--bg-3) 0%, var(--bg-4) 100%);
		color: var(--text-2);
	}

	/* Progress bars for 1st and 2nd */
	.probability-bar.bar-first .bar-fill {
		background: linear-gradient(90deg, #e6c76a 0%, #d4af37 100%);
	}

	.probability-bar.bar-second {
		height: 6px;
	}

	.probability-bar.bar-second .bar-fill {
		background: var(--bg-4);
	}

	/* Second place styling */
	.second-place .outcome-name {
		font-weight: 500;
		color: var(--text-2);
		font-size: 12px;
	}

	.second-place .probability-bar {
		height: 6px;
	}

	/* More outcomes indicator */
	.more-outcomes {
		font-size: 11px;
		color: var(--text-3);
		padding-left: 26px;
		font-weight: 500;
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
		gap: var(--spacing-4);
		align-items: center;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.stat:not(:last-child)::after {
		content: '';
		display: block;
		width: 1px;
		height: 12px;
		background: var(--bg-4);
		margin-left: var(--spacing-4);
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
			padding: 3px 8px;
		}

		.stat:not(:last-child)::after {
			margin-left: var(--spacing-3);
		}
	}
</style>
