<script lang="ts">
	import type { Event } from '$lib/server/api/polymarket-client';
	import CheckCircleIcon from '$lib/components/icons/CheckCircleIcon.svelte';
	import FireIcon from '$lib/components/icons/FireIcon.svelte';
	import CupIcon from '$lib/components/icons/CupIcon.svelte';
	import EventCardHeader from '$lib/components/events/EventCardHeader.svelte';
	import EventCardFooter from '$lib/components/events/EventCardFooter.svelte';
	import { parseBinaryMarket, parseMultiMarketOutcomes } from '$lib/utils/market-parser';

	interface Props {
		event: Event;
		variant?: 'default' | 'compact';
	}

	let { event, variant = 'default' }: Props = $props();

	const isMultiMarket = $derived((event.markets?.length || 0) > 1);

	const primaryMarket = $derived(
		event.markets?.find((m) => m.outcomes && m.outcomePrices) || event.markets?.[0]
	);

	const binaryData = $derived(isMultiMarket ? null : parseBinaryMarket(primaryMarket));

	const multiOutcomes = $derived(isMultiMarket ? parseMultiMarketOutcomes(event.markets) : null);

	const leadingOutcome = $derived(multiOutcomes?.[0] || null);
	const secondOutcome = $derived(multiOutcomes?.[1] || null);
	const outcomeCount = $derived(multiOutcomes?.length || 0);

	const isEffectivelyResolved = $derived.by(() => {
		if (binaryData) return binaryData.yes.percentage >= 99 || binaryData.no.percentage >= 99;
		if (leadingOutcome) return leadingOutcome.percentage >= 99;
		return false;
	});

	const closingSoon = $derived.by(() => {
		if (!event.endDate || isEffectivelyResolved) return false;
		const endDate = new Date(event.endDate);
		const now = new Date();
		const diffMs = endDate.getTime() - now.getTime();
		const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
		return diffDays > 0 && diffDays <= 7;
	});

	import { useBookmark } from '$lib/composables/useBookmark.svelte';

	const bookmark = useBookmark(() => event.id, () => event);
</script>

<div
	class="event-card"
	class:compact={variant === 'compact'}
	class:resolved={isEffectivelyResolved}
>
	{#if isEffectivelyResolved}
		<div class="corner-badge resolved-badge" class:compact={variant === 'compact'}>
			<CheckCircleIcon size={12} />
			<span>Resolved</span>
		</div>
	{:else if closingSoon}
		<div class="closing-indicator" class:compact={variant === 'compact'}>
			<FireIcon size={variant === 'compact' ? 14 : 12} />
			{#if variant !== 'compact'}
				<span>Ending soon</span>
			{/if}
		</div>
	{/if}

	<div class="card-content">
		<div class="card-header">
			<EventCardHeader {event} {variant} />
		</div>

		{#if binaryData && !isEffectivelyResolved}
			<div class="binary-display">
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

		{#if isMultiMarket && leadingOutcome && !isEffectivelyResolved}
			<div class="multi-display">
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

		<EventCardFooter
			volume={event.volume}
			volume24hr={event.volume24hr}
			liquidity={event.liquidity}
			showLiquidity={true}
			showBookmark={true}
			isBookmarked={bookmark.isBookmarked}
			onBookmarkToggle={bookmark.toggleBookmark}
			compact={variant === 'compact'}
		/>
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

	.corner-badge.compact {
		top: 6px;
		right: 6px;
		padding: 3px 8px;
		font-size: 9px;
		gap: 2px;
	}

	.closing-indicator {
		position: absolute;
		top: 8px;
		right: 8px;
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 10px;
		font-weight: 600;
		color: var(--danger);
		white-space: nowrap;
		z-index: 1;
	}

	.closing-indicator.compact {
		top: 8px;
		right: 8px;
		gap: 0;
	}

	/* Compact variant */
	.event-card.compact {
		padding: var(--spacing-3);
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

	.first-place .outcome-name {
		font-size: 14px;
		font-weight: 700;
	}

	.outcome-percentage {
		font-size: 15px;
		font-weight: 700;
		letter-spacing: -0.01em;
		white-space: nowrap;
	}

	.outcome-percentage.first {
		color: var(--gold-dark);
		font-size: 16px;
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
		background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-base) 100%);
		color: var(--gold-text);
		box-shadow: 0 1px 2px rgba(var(--gold-rgb), 0.3);
	}

	.rank-2 {
		background: linear-gradient(135deg, var(--bg-3) 0%, var(--bg-4) 100%);
		color: var(--text-2);
	}

	/* Progress bars for 1st and 2nd */
	.probability-bar.bar-first .bar-fill {
		background: linear-gradient(90deg, var(--gold-light) 0%, var(--gold-base) 100%);
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

	/* Mobile */
	@media (max-width: 768px) {
		.event-card {
			padding: var(--spacing-3);
		}

		.card-header {
			padding-right: 60px;
		}

		.corner-badge {
			font-size: 9px;
			padding: 3px 8px;
		}
	}
</style>
