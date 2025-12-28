<script lang="ts">
	import type { Event } from '$lib/server/api/polymarket-client';
	import CheckCircleIcon from '$lib/components/icons/CheckCircleIcon.svelte';
	import EventCardHeader from '$lib/components/events/EventCardHeader.svelte';
	import EventCardFooter from '$lib/components/events/EventCardFooter.svelte';
	import { isWinningMarket } from '$lib/utils/market-parser';

	interface Props {
		event: Event;
	}

	let { event }: Props = $props();

	const sortedMarkets = $derived.by(() => {
		if (!event.markets) return [];

		return [...event.markets]
			.map((market) => ({
				market,
				isWinner: isWinningMarket(market),
				threshold: parseInt(market.groupItemThreshold || '999', 10)
			}))
			.sort((a, b) => {
				if (a.isWinner && !b.isWinner) return -1;
				if (!a.isWinner && b.isWinner) return 1;
				return a.threshold - b.threshold;
			})
			.slice(0, 3)
			.map((item) => ({
				...item.market,
				isWinner: item.isWinner
			}));
	});
</script>

<div class="event-card">
	<div class="card-content">
		<div class="card-header">
			<EventCardHeader {event} />
		</div>

		<!-- Resolved Multi-Outcome Display -->
		{#if sortedMarkets.length > 0}
			<div class="markets-preview">
				{#each sortedMarkets as market (market.id)}
					<a
						href={`/event/${event.slug || event.id}`}
						class="market-item"
						class:is-winner={market.isWinner}
						data-sveltekit-preload-data="hover"
					>
						<div class="market-header">
							{#if market.isWinner}
								<CheckCircleIcon size={18} class="winner-icon" />
							{/if}
							<div class="market-question">
								{market.groupItemTitle || market.question}
							</div>
						</div>
						{#if market.isWinner}
							<div class="winner-badge">Won</div>
						{/if}
					</a>
				{/each}
			</div>
		{/if}

		<EventCardFooter volume={event.volume} />
	</div>
</div>

<style>
	.event-card {
		display: flex;
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-card);
		padding: var(--spacing-4);
		box-shadow: var(--shadow-sm);
		height: 100%;
		transition:
			all var(--transition-fast),
			box-shadow var(--transition-fast);
		color: inherit;
	}

	.event-card:focus-within {
		outline: none;
		border-color: var(--primary);
		box-shadow: var(--shadow-primary-md);
	}

	.card-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4);
		width: 100%;
	}

	/* ============================================
	   MULTI-MARKET PREVIEW
	   ============================================ */

	.markets-preview {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
	}

	.market-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-3);
		padding: var(--spacing-3);
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-sm);
		text-decoration: none;
		transition:
			border-color var(--transition-fast),
			transform var(--transition-fast);
	}

	.market-item.is-winner {
		background: linear-gradient(135deg, rgba(0, 196, 71, 0.08), rgba(0, 217, 255, 0.06));
		border-color: rgba(0, 196, 71, 0.3);
	}

	.market-item:not(.is-winner) {
		opacity: 0.6;
	}

	@media (hover: hover) {
		.market-item:hover {
			border-color: var(--primary);
			transform: translateY(-1px);
		}
	}

	.market-item:active {
		transform: translateY(0);
	}

	.market-item:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.market-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		min-width: 0;
		flex: 1;
	}

	.market-item :global(.winner-icon) {
		color: var(--success);
		flex-shrink: 0;
	}

	.market-question {
		font-size: 14px;
		color: var(--text-0);
		font-weight: 600;
		line-height: 1.4;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
		min-width: 0;
	}

	.market-item:not(.is-winner) .market-question {
		color: var(--text-2);
		font-weight: 500;
	}

	.winner-badge {
		font-size: 12px;
		font-weight: 700;
		padding: 4px 10px;
		border-radius: var(--radius-sm);
		background: rgba(0, 196, 71, 0.15);
		color: var(--success);
		white-space: nowrap;
	}

	/* ============================================
	   MOBILE OPTIMIZATIONS
	   ============================================ */

	@media (max-width: 768px) {
		.event-card {
			padding: var(--spacing-4);
		}
	}
</style>
