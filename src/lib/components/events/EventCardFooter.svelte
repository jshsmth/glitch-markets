<script lang="ts">
	import MoneyIcon from '$lib/components/icons/MoneyIcon.svelte';
	import WaterLiquidIcon from '$lib/components/icons/WaterLiquidIcon.svelte';
	import BookmarkIcon from '$lib/components/icons/BookmarkIcon.svelte';
	import { formatNumber } from '$lib/utils/format';

	interface Props {
		volume: number | null | undefined;
		volume24hr?: number | null;
		liquidity?: number | null;
		showLiquidity?: boolean;
		showBookmark?: boolean;
		isBookmarked?: boolean;
		onBookmarkToggle?: () => void;
		compact?: boolean;
	}

	let {
		volume,
		volume24hr,
		liquidity,
		showLiquidity = false,
		showBookmark = false,
		isBookmarked = false,
		onBookmarkToggle,
		compact = false
	}: Props = $props();

	const safeVolume = $derived(volume ?? 0);
	const safeVolume24hr = $derived(volume24hr ?? undefined);
	const safeLiquidity = $derived(liquidity ?? undefined);
</script>

<div class="card-footer" class:compact-footer={compact}>
	<div class="stats">
		{#if safeVolume24hr !== undefined}
			<div class="stat">
				<MoneyIcon size={compact ? 14 : 16} class="stat-icon" />
				<span class="stat-value">{formatNumber(safeVolume24hr)}</span>
				<span class="stat-label">24h</span>
			</div>
		{:else}
			<div class="stat">
				<MoneyIcon size={compact ? 14 : 16} class="stat-icon" />
				<span class="stat-value">{formatNumber(safeVolume)}</span>
				<span class="stat-label">Vol</span>
			</div>
		{/if}
		{#if showLiquidity && safeLiquidity !== undefined}
			<div class="stat">
				<WaterLiquidIcon size={compact ? 14 : 16} class="stat-icon" />
				<span class="stat-value">{formatNumber(safeLiquidity)}</span>
				<span class="stat-label">Liq</span>
			</div>
		{/if}
	</div>
	{#if showBookmark && onBookmarkToggle}
		<button
			class="bookmark-btn"
			class:bookmarked={isBookmarked}
			onclick={onBookmarkToggle}
			aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this event'}
			aria-pressed={isBookmarked}
		>
			<BookmarkIcon size={18} filled={isBookmarked} />
		</button>
	{/if}
</div>

<style>
	.card-footer {
		margin-top: auto;
		padding-top: var(--spacing-3);
		border-top: 1px solid var(--bg-3);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.card-footer.compact-footer {
		padding-top: var(--spacing-2);
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
		background: var(--bg-3);
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

	.compact-footer .stat-value {
		font-size: 13px;
		font-weight: 700;
		color: var(--text-0);
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
		color: var(--gold-base);
	}

	.bookmark-btn.bookmarked {
		color: var(--gold-base);
	}

	.bookmark-btn.bookmarked:hover {
		background: rgba(var(--gold-rgb), 0.1);
		color: var(--gold-light);
	}

	.bookmark-btn:active {
		transform: scale(0.9);
	}

	.bookmark-btn:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.bookmark-btn :global(svg) {
		transition: fill var(--transition-fast);
	}

	@media (min-width: 769px) {
		.stats {
			gap: var(--spacing-5);
		}

		.stat:not(:last-child)::after {
			margin-left: var(--spacing-5);
		}

		.stat-value {
			font-size: 13px;
		}

		.stat-label {
			font-size: 12px;
		}
	}

	@media (max-width: 768px) {
		.stats {
			gap: var(--spacing-4);
		}

		.stat:not(:last-child)::after {
			margin-left: var(--spacing-3);
		}
	}
</style>
