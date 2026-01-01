<script lang="ts">
	import type { Event } from '$lib/server/api/polymarket-client';

	interface Props {
		event: Event;
		variant?: 'default' | 'compact';
	}

	let { event, variant = 'default' }: Props = $props();
</script>

<div class="title-row" class:compact={variant === 'compact'}>
	{#if event.image}
		<div class="event-icon" class:compact={variant === 'compact'}>
			<img
				src={event.image}
				alt={event.title || 'Event icon'}
				width={variant === 'compact' ? 32 : 40}
				height={variant === 'compact' ? 32 : 40}
				loading="lazy"
				decoding="async"
			/>
		</div>
	{/if}
	<a
		href={`/event/${event.slug || event.id}`}
		class="event-title-link"
		data-sveltekit-preload-data="hover"
	>
		<h3 class="event-title" class:compact={variant === 'compact'}>
			{event.title || 'Untitled Event'}
		</h3>
	</a>
</div>

<style>
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
		border: 1.5px solid var(--bg-3);
		box-shadow: var(--shadow-xs);
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
		font-size: 16px;
		font-weight: 700;
		color: var(--text-0);
		line-height: 1.35;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.event-icon.compact {
		width: 32px;
		height: 32px;
	}

	.event-title.compact {
		font-size: 14px;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	@media (min-width: 768px) {
		.event-icon {
			width: 44px;
			height: 44px;
		}

		.event-icon.compact {
			width: 36px;
			height: 36px;
		}

		.event-title {
			font-size: 17px;
		}

		.event-title.compact {
			font-size: 15px;
		}
	}
</style>
