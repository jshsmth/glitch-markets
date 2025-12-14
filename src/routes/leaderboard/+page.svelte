<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys } from '$lib/query/client';
	import type {
		BuilderLeaderboardEntry,
		TraderLeaderboardEntry
	} from '$lib/server/api/polymarket-client';
	import { browser } from '$app/environment';

	type TimePeriod = 'DAY' | 'WEEK' | 'MONTH' | 'ALL';
	type LeaderboardType = 'traders' | 'builders';

	let selectedType = $state<LeaderboardType>('traders');
	let selectedPeriod = $state<TimePeriod>('DAY');

	const tradersQuery = createQuery<TraderLeaderboardEntry[]>(() => ({
		queryKey: queryKeys.traders.leaderboard('OVERALL', selectedPeriod, 'PNL', 50, 0),
		queryFn: async () => {
			const params = new URLSearchParams({
				category: 'OVERALL',
				timePeriod: selectedPeriod,
				orderBy: 'PNL',
				limit: '50',
				offset: '0'
			});

			const response = await fetch(`/api/traders/leaderboard?${params.toString()}`);
			if (!response.ok) {
				throw new Error('Failed to fetch trader leaderboard');
			}
			return response.json();
		},
		enabled: browser && selectedType === 'traders'
	}));

	const buildersQuery = createQuery<BuilderLeaderboardEntry[]>(() => ({
		queryKey: queryKeys.builders.leaderboard(selectedPeriod, 50, 0),
		queryFn: async () => {
			const params = new URLSearchParams({
				timePeriod: selectedPeriod,
				limit: '50',
				offset: '0'
			});

			const response = await fetch(`/api/builders/leaderboard?${params.toString()}`);
			if (!response.ok) {
				throw new Error('Failed to fetch builder leaderboard');
			}
			return response.json();
		},
		enabled: browser && selectedType === 'builders'
	}));

	const isPending = $derived(
		browser
			? selectedType === 'traders'
				? tradersQuery.isPending
				: buildersQuery.isPending
			: false
	);
	const error = $derived(
		browser ? (selectedType === 'traders' ? tradersQuery.error : buildersQuery.error) : null
	);
	const tradersData = $derived(browser ? tradersQuery.data : null);
	const buildersData = $derived(browser ? buildersQuery.data : null);

	function formatVolume(volume: number): string {
		if (volume >= 1_000_000) {
			return `$${(volume / 1_000_000).toFixed(2)}M`;
		} else if (volume >= 1_000) {
			return `$${(volume / 1_000).toFixed(1)}K`;
		}
		return `$${volume.toFixed(0)}`;
	}

	function formatPnL(pnl: number): string {
		const formatted = formatVolume(Math.abs(pnl));
		return pnl >= 0 ? `+${formatted}` : `-${formatted}`;
	}

	function formatActiveUsers(count: number): string {
		return count.toLocaleString();
	}

	function getRankEmoji(rank: string): string {
		if (rank === '1') return '🥇';
		if (rank === '2') return '🥈';
		if (rank === '3') return '🥉';
		return '';
	}

	function handleRefetch() {
		if (browser) {
			if (selectedType === 'traders') {
				tradersQuery.refetch();
			} else {
				buildersQuery.refetch();
			}
		}
	}
</script>

<svelte:head>
	<title>Leaderboard - Glitch Markets</title>
</svelte:head>

<div class="page-container">
	<div class="controls">
		<div class="type-selector">
			<button
				class="type-button"
				class:active={selectedType === 'traders'}
				onclick={() => (selectedType = 'traders')}
			>
				Traders
			</button>
			<button
				class="type-button"
				class:active={selectedType === 'builders'}
				onclick={() => (selectedType = 'builders')}
			>
				Builders
			</button>
		</div>

		<div class="period-selector">
			<button
				class="period-button"
				class:active={selectedPeriod === 'DAY'}
				onclick={() => (selectedPeriod = 'DAY')}
			>
				Day
			</button>
			<button
				class="period-button"
				class:active={selectedPeriod === 'WEEK'}
				onclick={() => (selectedPeriod = 'WEEK')}
			>
				Week
			</button>
			<button
				class="period-button"
				class:active={selectedPeriod === 'MONTH'}
				onclick={() => (selectedPeriod = 'MONTH')}
			>
				Month
			</button>
			<button
				class="period-button"
				class:active={selectedPeriod === 'ALL'}
				onclick={() => (selectedPeriod = 'ALL')}
			>
				All Time
			</button>
		</div>
	</div>

	{#if isPending}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading leaderboard...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p class="error-message">Failed to load leaderboard</p>
			<p class="error-detail">{error.message}</p>
			<button class="retry-button" onclick={handleRefetch}>Try Again</button>
		</div>
	{:else if selectedType === 'traders' && tradersData && tradersData.length > 0}
		<div class="leaderboard-table">
			<div class="table-header">
				<div class="col-rank">Rank</div>
				<div class="col-trader">Trader</div>
				<div class="col-pnl">PnL</div>
				<div class="col-volume">Volume</div>
			</div>

			{#each tradersData as entry (entry.proxyWallet)}
				<div class="table-row" class:top-three={parseInt(entry.rank) <= 3}>
					<div class="col-rank">
						<span class="rank-number">{entry.rank}</span>
						{#if getRankEmoji(entry.rank)}
							<span class="rank-emoji">{getRankEmoji(entry.rank)}</span>
						{/if}
					</div>

					<div class="col-trader">
						<div class="trader-info">
							{#if entry.profileImage}
								<img
									src={entry.profileImage}
									alt={entry.userName}
									class="trader-avatar"
									loading="lazy"
								/>
							{:else}
								<div class="trader-avatar-placeholder">
									{entry.userName.charAt(0).toUpperCase()}
								</div>
							{/if}
							<div class="trader-details">
								<span class="trader-name">{entry.userName}</span>
								{#if entry.verifiedBadge}
									<span class="verified-badge" title="Verified">✓</span>
								{/if}
							</div>
						</div>
					</div>

					<div class="col-pnl">
						<span class="pnl-amount" class:positive={entry.pnl >= 0} class:negative={entry.pnl < 0}>
							{formatPnL(entry.pnl)}
						</span>
					</div>

					<div class="col-volume">
						<span class="volume-amount">{formatVolume(entry.vol)}</span>
					</div>
				</div>
			{/each}
		</div>
	{:else if selectedType === 'builders' && buildersData && buildersData.length > 0}
		<div class="leaderboard-table">
			<div class="table-header">
				<div class="col-rank">Rank</div>
				<div class="col-builder">Builder</div>
				<div class="col-volume">Volume</div>
				<div class="col-users">Users</div>
			</div>

			{#each buildersData as entry (entry.builder)}
				<div class="table-row" class:top-three={parseInt(entry.rank) <= 3}>
					<div class="col-rank">
						<span class="rank-number">{entry.rank}</span>
						{#if getRankEmoji(entry.rank)}
							<span class="rank-emoji">{getRankEmoji(entry.rank)}</span>
						{/if}
					</div>

					<div class="col-builder">
						<div class="builder-info">
							{#if entry.builderLogo}
								<img
									src={entry.builderLogo}
									alt={entry.builder}
									class="builder-logo"
									loading="lazy"
								/>
							{:else}
								<div class="builder-logo-placeholder">{entry.builder.charAt(0).toUpperCase()}</div>
							{/if}
							<div class="builder-details">
								<span class="builder-name">{entry.builder}</span>
								{#if entry.verified}
									<span class="verified-badge" title="Verified">✓</span>
								{/if}
							</div>
						</div>
					</div>

					<div class="col-volume">
						<span class="volume-amount">{formatVolume(entry.volume)}</span>
					</div>

					<div class="col-users">
						<span class="users-count">{formatActiveUsers(entry.activeUsers)}</span>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<p>No leaderboard data available</p>
		</div>
	{/if}
</div>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-lg) 12px;
	}

	@media (min-width: 768px) {
		.page-container {
			padding: var(--space-lg) 24px;
		}
	}

	.controls {
		margin-bottom: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		align-items: center;
	}

	@media (min-width: 768px) {
		.controls {
			flex-direction: row;
			justify-content: space-between;
		}
	}

	.type-selector {
		display: flex;
		gap: var(--space-xs);
		background: var(--bg-1);
		padding: 4px;
		border-radius: 12px;
		border: 1px solid var(--bg-3);
	}

	.type-button {
		padding: 10px 24px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: var(--text-2);
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.type-button:hover {
		background: var(--bg-2);
		color: var(--text-1);
	}

	.type-button.active {
		background: var(--primary);
		color: var(--bg-0);
	}

	.period-selector {
		display: flex;
		gap: var(--space-xs);
		background: var(--bg-1);
		padding: 4px;
		border-radius: 12px;
		border: 1px solid var(--bg-3);
	}

	.period-button {
		padding: 8px 16px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: var(--text-2);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.period-button:hover {
		background: var(--bg-2);
		color: var(--text-1);
	}

	.period-button.active {
		background: var(--primary);
		color: var(--bg-0);
	}

	.leaderboard-table {
		background: var(--bg-1);
		border-radius: 16px;
		overflow: hidden;
		border: 1px solid var(--bg-3);
	}

	.table-header {
		display: grid;
		grid-template-columns: 80px 1fr 120px 100px;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		background: var(--bg-2);
		font-size: 12px;
		font-weight: 600;
		color: var(--text-3);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	@media (max-width: 640px) {
		.table-header {
			grid-template-columns: 60px 1fr 100px 80px;
			padding: var(--space-sm) var(--space-md);
			font-size: 11px;
		}
	}

	.table-row {
		display: grid;
		grid-template-columns: 80px 1fr 120px 100px;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		border-bottom: 1px solid var(--bg-2);
		transition: background 0.2s ease;
	}

	.table-row:hover {
		background: var(--bg-2);
	}

	.table-row:last-child {
		border-bottom: none;
	}

	.table-row.top-three {
		background: linear-gradient(
			90deg,
			var(--bg-1) 0%,
			color-mix(in srgb, var(--primary) 3%, var(--bg-1)) 100%
		);
	}

	@media (max-width: 640px) {
		.table-row {
			grid-template-columns: 60px 1fr 100px 80px;
			padding: var(--space-sm) var(--space-md);
		}
	}

	.col-rank {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-weight: 600;
		color: var(--text-1);
	}

	.rank-number {
		font-size: 16px;
	}

	.rank-emoji {
		font-size: 20px;
	}

	@media (max-width: 640px) {
		.rank-number {
			font-size: 14px;
		}
		.rank-emoji {
			font-size: 18px;
		}
	}

	.col-trader,
	.col-builder {
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.trader-info,
	.builder-info {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		min-width: 0;
	}

	.trader-avatar,
	.builder-logo {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
		background: var(--bg-3);
	}

	.builder-logo {
		border-radius: 8px;
	}

	.trader-avatar-placeholder,
	.builder-logo-placeholder {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--primary);
		color: var(--bg-0);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 18px;
		flex-shrink: 0;
	}

	.builder-logo-placeholder {
		border-radius: 8px;
	}

	@media (max-width: 640px) {
		.trader-avatar,
		.trader-avatar-placeholder,
		.builder-logo,
		.builder-logo-placeholder {
			width: 32px;
			height: 32px;
		}
	}

	.trader-details,
	.builder-details {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		min-width: 0;
	}

	.trader-name,
	.builder-name {
		font-weight: 500;
		color: var(--text-0);
		font-size: 15px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 640px) {
		.trader-name,
		.builder-name {
			font-size: 14px;
		}
	}

	.verified-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--primary);
		color: var(--bg-0);
		font-size: 12px;
		font-weight: 700;
		flex-shrink: 0;
	}

	.col-pnl,
	.col-volume {
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	.pnl-amount {
		font-weight: 600;
		font-size: 15px;
	}

	.pnl-amount.positive {
		color: var(--success);
	}

	.pnl-amount.negative {
		color: var(--danger);
	}

	.volume-amount {
		font-weight: 600;
		color: var(--text-0);
		font-size: 15px;
	}

	@media (max-width: 640px) {
		.pnl-amount,
		.volume-amount {
			font-size: 14px;
		}
	}

	.col-users {
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	.users-count {
		font-weight: 500;
		color: var(--text-2);
		font-size: 14px;
	}

	@media (max-width: 640px) {
		.users-count {
			font-size: 13px;
		}
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-3xl);
		gap: var(--space-lg);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--bg-3);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-state p {
		color: var(--text-2);
		font-size: 15px;
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-3xl);
		gap: var(--space-md);
	}

	.error-message {
		color: var(--text-0);
		font-size: 18px;
		font-weight: 600;
		margin: 0;
	}

	.error-detail {
		color: var(--text-2);
		font-size: 14px;
		margin: 0;
	}

	.retry-button {
		margin-top: var(--space-md);
		padding: 10px 24px;
		background: var(--primary);
		color: var(--bg-0);
		border: none;
		border-radius: 8px;
		font-size: 15px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.retry-button:hover {
		background: var(--primary-hover);
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-3xl);
	}

	.empty-state p {
		color: var(--text-2);
		font-size: 15px;
	}
</style>
