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
</script>

<a href={`/event/${event.slug || event.id}`} class="event-card">
	<div class="card-content">
		<div class="card-header">
			<div class="title-row">
				{#if event.image}
					<div class="event-icon">
						<img src={event.image} alt="" />
					</div>
				{/if}
				<h3 class="event-title">{event.title || 'Untitled Event'}</h3>
			</div>
		</div>

		{#if event.description}
			<p class="event-description">{truncateText(event.description, 180)}</p>
		{/if}

		<div class="card-footer">
			<div class="stats">
				<div class="stat">
					<span class="stat-label">24h Vol</span>
					<span class="stat-value">{formatNumber(event.volume24hr)}</span>
				</div>
				<div class="stat">
					<span class="stat-label">Liquidity</span>
					<span class="stat-value">{formatNumber(event.liquidity)}</span>
				</div>
				<div class="stat">
					<span class="stat-label">Markets</span>
					<span class="stat-value">{event.markets?.length || 0}</span>
				</div>
			</div>
		</div>
	</div>
</a>

<style>
	.event-card {
		display: block;
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-card);
		padding: var(--space-lg);
		transition: all var(--transition-fast);
		cursor: pointer;
		text-decoration: none;
		color: inherit;
	}

	.event-card:hover {
		border-color: var(--bg-4);
		background: var(--bg-2);
	}

	.card-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		height: 100%;
	}

	.card-header {
		margin-bottom: var(--space-xs);
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

	.event-title {
		flex: 1;
		font-size: 16px;
		font-weight: 600;
		color: var(--text-0);
		line-height: 1.4;
		margin: 0;
		min-width: 0;
	}

	.event-description {
		font-size: 14px;
		color: var(--text-2);
		line-height: 1.5;
		margin: 0;
	}

	.card-footer {
		margin-top: auto;
		padding-top: var(--space-sm);
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-lg);
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.stat-label {
		font-size: 12px;
		color: var(--text-3);
		font-weight: 500;
	}

	.stat-value {
		font-size: 16px;
		font-weight: 600;
		color: var(--text-0);
	}

	@media (max-width: 768px) {
		.event-card {
			padding: var(--space-md);
		}

		.event-title {
			font-size: 15px;
		}

		.event-description {
			font-size: 13px;
		}

		.stats {
			gap: var(--space-md);
		}

		.stat-value {
			font-size: 15px;
		}
	}
</style>
