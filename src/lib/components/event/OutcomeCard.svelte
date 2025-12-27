<script lang="ts">
	import { formatNumber } from '$lib/utils/format';

	interface OutcomeData {
		label: string;
		price: number;
		priceFormatted: string;
		isResolved: boolean | null;
		won: boolean | null;
	}

	interface Props {
		name: string;
		volume: number;
		outcomeData: OutcomeData[];
		showBetButtons?: boolean;
	}

	let { name, volume, outcomeData, showBetButtons = true }: Props = $props();

	const primaryOutcome = $derived(outcomeData[0]);
	const secondaryOutcome = $derived(outcomeData[1]);
</script>

<div class="outcome-card">
	<div class="outcome-card-header">
		<span class="outcome-card-name">{name}</span>
		<span class="outcome-card-volume">{formatNumber(volume)} Vol.</span>
	</div>
	<div class="outcome-card-body">
		<span class="outcome-card-percentage">
			{#if primaryOutcome?.isResolved}
				<span class="resolved-tag" class:won={primaryOutcome.won}>
					{primaryOutcome.priceFormatted}
				</span>
			{:else}
				{primaryOutcome?.priceFormatted || '—'}%
			{/if}
		</span>
		{#if showBetButtons && primaryOutcome && !primaryOutcome.isResolved}
			<div class="outcome-card-actions">
				<button class="bet-btn yes">
					Yes · {primaryOutcome.priceFormatted}¢
				</button>
				{#if secondaryOutcome}
					<button class="bet-btn no">
						No · {secondaryOutcome.priceFormatted}¢
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.outcome-card {
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: 12px;
		padding: 16px;
		transition: all var(--transition-fast);
	}

	.outcome-card:hover {
		background: var(--bg-2);
	}

	.outcome-card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 10px;
		gap: 8px;
	}

	.outcome-card-name {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-0);
		flex: 1;
		min-width: 0;
		line-height: 1.4;
	}

	.outcome-card-volume {
		font-size: 10px;
		font-weight: 500;
		color: var(--text-3);
		flex-shrink: 0;
	}

	.outcome-card-body {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}

	.outcome-card-percentage {
		font-size: 20px;
		font-weight: 600;
		color: var(--text-1);
		flex-shrink: 0;
	}

	.resolved-tag {
		font-size: 12px;
		font-weight: 600;
		padding: 4px 8px;
		border-radius: 6px;
		background: var(--bg-3);
		color: var(--text-2);
	}

	.resolved-tag.won {
		background: rgba(0, 196, 71, 0.15);
		color: var(--success);
	}

	.outcome-card-actions {
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex: 1;
	}

	.bet-btn {
		padding: 10px 16px;
		font-size: 14px;
		font-weight: 600;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all var(--transition-fast);
		white-space: nowrap;
	}

	.bet-btn.yes {
		background: rgba(0, 196, 71, 0.08);
		color: var(--success);
		border: 1px solid transparent;
	}

	.bet-btn.yes:hover:not(:disabled) {
		background: rgba(0, 196, 71, 0.12);
	}

	.bet-btn.no {
		background: rgba(255, 51, 102, 0.08);
		color: var(--danger);
		border: 1px solid transparent;
	}

	.bet-btn.no:hover:not(:disabled) {
		background: rgba(255, 51, 102, 0.12);
	}

	.bet-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
