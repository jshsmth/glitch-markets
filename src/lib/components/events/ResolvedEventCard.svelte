<script lang="ts">
	import type { Event } from '$lib/server/api/polymarket-client';
	import CheckCircleIcon from '$lib/components/icons/CheckCircleIcon.svelte';
	import CloseCircleIcon from '$lib/components/icons/CloseCircleIcon.svelte';
	import EventCardHeader from '$lib/components/events/EventCardHeader.svelte';
	import EventCardFooter from '$lib/components/events/EventCardFooter.svelte';
	import { getMarketResolution } from '$lib/utils/market-parser';

	interface Props {
		event: Event;
	}

	let { event }: Props = $props();

	const primaryMarket = $derived(event.markets?.[0]);

	const resolution = $derived(getMarketResolution(primaryMarket));
</script>

<div class="event-card">
	<div class="card-content">
		<div class="card-header">
			<EventCardHeader {event} />
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

		<EventCardFooter volume={event.volume} />
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
	   MOBILE OPTIMIZATIONS
	   ============================================ */

	@media (max-width: 768px) {
		.event-card {
			padding: 16px;
		}
	}
</style>
