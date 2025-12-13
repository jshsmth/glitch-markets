<script lang="ts">
	import type { Event } from '$lib/server/api/polymarket-client';
	import CheckCircleIcon from '$lib/components/icons/CheckCircleIcon.svelte';
	import CloseCircleIcon from '$lib/components/icons/CloseCircleIcon.svelte';
	import MoneyIcon from '$lib/components/icons/MoneyIcon.svelte';

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

	const primaryMarket = $derived(event.markets?.[0]);

	const resolution = $derived.by(() => {
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

			// For resolved markets, one price will be 1 and the other 0
			const winnerIndex = prices.findIndex((p: string) => parseFloat(p) === 1);
			if (winnerIndex === -1) return null;

			return {
				winner: outcomes[winnerIndex],
				loser: outcomes[winnerIndex === 0 ? 1 : 0],
				winnerIsYes: winnerIndex === 0
			};
		} catch {
			return null;
		}
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
				<a
					href={`/event/${event.slug || event.id}`}
					class="event-title-link"
					data-sveltekit-preload-data="hover"
				>
					<h3 class="event-title">{event.title || 'Untitled Event'}</h3>
				</a>
			</div>
		</div>

		<!-- Resolved Outcome Display -->
		{#if resolution}
			<div class="resolution-display">
				<a
					href={`/event/${event.slug || event.id}`}
					class="outcome-row winner"
					class:is-yes={resolution.winnerIsYes}
					data-sveltekit-preload-data="hover"
				>
					<div class="outcome-content">
						<CheckCircleIcon size={20} class="outcome-icon" />
						<span class="outcome-label">{resolution.winner}</span>
					</div>
					<span class="outcome-badge">Won</span>
				</a>

				<a
					href={`/event/${event.slug || event.id}`}
					class="outcome-row loser"
					data-sveltekit-preload-data="hover"
				>
					<div class="outcome-content">
						<CloseCircleIcon size={20} class="outcome-icon" />
						<span class="outcome-label">{resolution.loser}</span>
					</div>
					<span class="outcome-badge">Lost</span>
				</a>
			</div>
		{/if}

		<!-- Footer Stats -->
		<div class="card-footer">
			<div class="stats">
				<div class="stat">
					<MoneyIcon size={16} class="stat-icon" />
					<span class="stat-value">{formatNumber(event.volume)}</span>
					<span class="stat-label">Vol</span>
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
		box-shadow: var(--shadow-sm);
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


	.card-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
	}

	/* ============================================
	   HEADER
	   ============================================ */

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
	   RESOLUTION DISPLAY
	   ============================================ */

	.resolution-display {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.outcome-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px;
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-sm);
		text-decoration: none;
		transition: all var(--transition-fast);
	}

	.outcome-row.winner {
		background: linear-gradient(135deg, rgba(0, 196, 71, 0.08), rgba(0, 217, 255, 0.06));
		border-color: rgba(0, 196, 71, 0.3);
	}

	.outcome-row.winner.is-yes {
		background: linear-gradient(135deg, rgba(0, 196, 71, 0.1), rgba(0, 217, 255, 0.08));
	}

	.outcome-row.loser {
		background: var(--bg-2);
		opacity: 0.6;
	}

	.outcome-row:hover {
		border-color: var(--primary);
		transform: translateY(-1px);
	}

	.outcome-row:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.outcome-content {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;
		min-width: 0;
	}

	.outcome-row.winner :global(.outcome-icon) {
		color: var(--success);
		flex-shrink: 0;
	}

	.outcome-row.loser :global(.outcome-icon) {
		color: var(--text-3);
		flex-shrink: 0;
	}

	.outcome-label {
		font-size: 15px;
		color: var(--text-0);
		font-weight: 600;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		flex: 1;
		min-width: 0;
	}

	.outcome-row.loser .outcome-label {
		color: var(--text-2);
		font-weight: 500;
	}

	.outcome-badge {
		font-size: 12px;
		font-weight: 700;
		padding: 4px 10px;
		border-radius: var(--radius-sm);
		white-space: nowrap;
	}

	.outcome-row.winner .outcome-badge {
		background: rgba(0, 196, 71, 0.15);
		color: var(--success);
	}

	.outcome-row.loser .outcome-badge {
		background: var(--bg-3);
		color: var(--text-3);
	}

	/* ============================================
	   FOOTER STATS
	   ============================================ */

	.card-footer {
		margin-top: auto;
		padding-top: 12px;
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

		.stats {
			gap: 16px;
		}

		.stat-value {
			font-size: 12px;
		}
	}
</style>
