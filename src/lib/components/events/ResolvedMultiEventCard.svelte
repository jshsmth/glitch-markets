<script lang="ts">
	import type { Event } from '$lib/server/api/polymarket-client';
	import CheckCircleIcon from '$lib/components/icons/CheckCircleIcon.svelte';
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

	// Sort markets to show winner first, then by groupItemThreshold
	const sortedMarkets = $derived.by(() => {
		if (!event.markets) return [];

		return [...event.markets]
			.map((market) => {
				try {
					const prices =
						typeof market.outcomePrices === 'string'
							? JSON.parse(market.outcomePrices)
							: market.outcomePrices;
					const isWinner =
						Array.isArray(prices) && prices.length >= 2 && parseFloat(prices[0]) === 1;

					return {
						market,
						isWinner,
						threshold: parseInt(market.groupItemThreshold || '999', 10)
					};
				} catch {
					return {
						market,
						isWinner: false,
						threshold: parseInt(market.groupItemThreshold || '999', 10)
					};
				}
			})
			.sort((a, b) => {
				// Winners first
				if (a.isWinner && !b.isWinner) return -1;
				if (!a.isWinner && b.isWinner) return 1;
				// Then by threshold
				return a.threshold - b.threshold;
			})
			.slice(0, 3) // Show top 3 outcomes
			.map((item) => ({
				...item.market,
				isWinner: item.isWinner
			}));
	});
</script>

<div class="event-card">
	<div class="card-content">
		<!-- Header with Icon + Title -->
		<div class="card-header">
			<div class="title-row">
				{#if event.image}
					<div class="event-icon">
						<img src={event.image} alt={event.title || 'Event icon'} />
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
	   MULTI-MARKET PREVIEW
	   ============================================ */

	.markets-preview {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.market-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px;
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-sm);
		text-decoration: none;
		transition: all var(--transition-fast);
	}

	.market-item.is-winner {
		background: linear-gradient(135deg, rgba(0, 196, 71, 0.08), rgba(0, 217, 255, 0.06));
		border-color: rgba(0, 196, 71, 0.3);
	}

	.market-item:not(.is-winner) {
		opacity: 0.6;
	}

	.market-item:hover {
		border-color: var(--primary);
		transform: translateY(-1px);
	}

	.market-item:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.market-header {
		display: flex;
		align-items: center;
		gap: 10px;
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
