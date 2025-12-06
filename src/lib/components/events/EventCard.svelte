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
	<div class="card-header">
		{#if event.image}
			<img src={event.image} alt={event.title || 'Event'} class="event-image" />
		{:else}
			<div class="event-image-placeholder"></div>
		{/if}
		<div class="status-badge" class:active={event.active} class:closed={event.closed}>
			{event.active ? 'Active' : 'Closed'}
		</div>
	</div>

	<div class="card-content">
		<h3 class="event-title">{event.title || 'Untitled Event'}</h3>

		{#if event.description}
			<p class="event-description">{truncateText(event.description, 120)}</p>
		{/if}

		<div class="event-stats">
			<div class="stat">
				<span class="stat-label">24h Volume</span>
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

		{#if event.category}
			<div class="category-tag">{event.category}</div>
		{/if}
	</div>
</a>

<style>
	.event-card {
		display: block;
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-card);
		overflow: hidden;
		transition: all var(--transition-base);
		cursor: pointer;
		text-decoration: none;
		color: inherit;
	}

	.event-card:hover {
		background: var(--bg-2);
		border-color: var(--primary);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.card-header {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: var(--bg-2);
	}

	.event-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.event-image-placeholder {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, var(--bg-2) 0%, var(--bg-3) 100%);
	}

	.status-badge {
		position: absolute;
		top: var(--space-sm);
		right: var(--space-sm);
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-button);
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.status-badge.active {
		background: var(--success);
		color: var(--bg-0);
	}

	.status-badge.closed {
		background: var(--bg-4);
		color: var(--text-3);
	}

	.card-content {
		padding: var(--space-md);
	}

	.event-title {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-0);
		margin: 0 0 var(--space-sm) 0;
		line-height: 1.4;
	}

	.event-description {
		font-size: 14px;
		color: var(--text-2);
		margin: 0 0 var(--space-md) 0;
		line-height: 1.5;
	}

	.event-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-md);
		margin-bottom: var(--space-md);
		padding-top: var(--space-sm);
		border-top: 1px solid var(--bg-3);
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.stat-label {
		font-size: 12px;
		color: var(--text-3);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.stat-value {
		font-size: 16px;
		font-weight: 600;
		color: var(--text-0);
	}

	.category-tag {
		display: inline-block;
		padding: var(--space-xs) var(--space-sm);
		background: var(--bg-3);
		color: var(--text-1);
		font-size: 12px;
		font-weight: 500;
		border-radius: var(--radius-button);
		text-transform: capitalize;
	}

	@media (max-width: 768px) {
		.event-title {
			font-size: 16px;
		}

		.event-description {
			font-size: 13px;
		}

		.stat-value {
			font-size: 14px;
		}
	}
</style>
