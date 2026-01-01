<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys } from '$lib/query/client';
	import type {
		BuilderLeaderboardEntry,
		TraderLeaderboardEntry
	} from '$lib/server/api/polymarket-client';
	import { browser } from '$app/environment';
	import { fade } from 'svelte/transition';

	let { data } = $props();

	type TimePeriod = 'DAY' | 'WEEK' | 'MONTH' | 'ALL';
	type LeaderboardType = 'traders' | 'builders';

	type EnrichedTraderEntry = TraderLeaderboardEntry & { rankNumber: number };
	type EnrichedBuilderEntry = BuilderLeaderboardEntry & { rankNumber: number };

	let selectedType = $state<LeaderboardType>('traders');
	let selectedPeriod = $state<TimePeriod>('ALL');
	let currentPage = $state(1);

	const ITEMS_PER_PAGE = 10;

	const queryClient = useQueryClient();

	$effect(() => {
		void selectedType;
		void selectedPeriod;
		currentPage = 1;
	});

	function createLeaderboardParams(
		type: LeaderboardType,
		period: TimePeriod,
		page: number
	): URLSearchParams {
		const offset = (page - 1) * ITEMS_PER_PAGE;
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const params = new URLSearchParams({
			timePeriod: period,
			limit: ITEMS_PER_PAGE.toString(),
			offset: offset.toString()
		});

		if (type === 'traders') {
			params.set('category', 'OVERALL');
			params.set('orderBy', 'PNL');
		}

		return params;
	}

	function enrichWithRankNumber<T extends { rank: string }>(
		entries: T[]
	): (T & { rankNumber: number })[] {
		return entries.map((entry) => ({
			...entry,
			rankNumber: parseInt(entry.rank, 10)
		}));
	}

	const tradersQuery = createQuery<EnrichedTraderEntry[]>(() => ({
		queryKey: queryKeys.traders.leaderboard(
			'OVERALL',
			selectedPeriod,
			'PNL',
			ITEMS_PER_PAGE,
			(currentPage - 1) * ITEMS_PER_PAGE
		),
		queryFn: async () => {
			const params = createLeaderboardParams('traders', selectedPeriod, currentPage);
			const response = await fetch(`/api/traders/leaderboard?${params.toString()}`);
			if (!response.ok) {
				throw new Error('Failed to fetch trader leaderboard');
			}
			const rawData: TraderLeaderboardEntry[] = await response.json();
			return enrichWithRankNumber(rawData);
		},
		enabled: browser && selectedType === 'traders',
		placeholderData: (previousData) => previousData,
		initialData:
			selectedPeriod === 'ALL' && currentPage === 1 && data?.initialTraders
				? enrichWithRankNumber(data.initialTraders)
				: undefined
	}));

	const buildersQuery = createQuery<EnrichedBuilderEntry[]>(() => ({
		queryKey: queryKeys.builders.leaderboard(
			selectedPeriod,
			ITEMS_PER_PAGE,
			(currentPage - 1) * ITEMS_PER_PAGE
		),
		queryFn: async () => {
			const params = createLeaderboardParams('builders', selectedPeriod, currentPage);
			const response = await fetch(`/api/builders/leaderboard?${params.toString()}`);
			if (!response.ok) {
				throw new Error('Failed to fetch builder leaderboard');
			}
			const rawData: BuilderLeaderboardEntry[] = await response.json();
			return enrichWithRankNumber(rawData);
		},
		enabled: browser && selectedType === 'builders',
		placeholderData: (previousData) => previousData,
		initialData:
			selectedPeriod === 'ALL' && currentPage === 1 && data?.initialBuilders
				? enrichWithRankNumber(data.initialBuilders)
				: undefined
	}));

	const activeQuery = $derived(selectedType === 'traders' ? tradersQuery : buildersQuery);
	const isPending = $derived(browser && activeQuery.isPending);
	const error = $derived(browser ? activeQuery.error : null);

	const tradersData = $derived.by((): EnrichedTraderEntry[] | null => {
		if (selectedType !== 'traders') return null;
		if (browser && tradersQuery.data) {
			return tradersQuery.data;
		}
		if (selectedPeriod === 'ALL' && currentPage === 1 && data?.initialTraders) {
			return enrichWithRankNumber(data.initialTraders);
		}
		return browser ? (tradersQuery.data ?? null) : null;
	});

	const buildersData = $derived.by((): EnrichedBuilderEntry[] | null => {
		if (selectedType !== 'builders') return null;
		if (browser && buildersQuery.data) {
			return buildersQuery.data;
		}
		if (selectedPeriod === 'ALL' && currentPage === 1 && data?.initialBuilders) {
			return enrichWithRankNumber(data.initialBuilders);
		}
		return browser ? (buildersQuery.data ?? null) : null;
	});

	const currentData = $derived(selectedType === 'traders' ? tradersData : buildersData);

	const canGoNext = $derived(currentData && currentData.length === ITEMS_PER_PAGE);
	const canGoPrev = $derived(currentPage > 1);

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

	function getRankEmoji(rankNumber: number): string {
		if (rankNumber === 1) return '🥇';
		if (rankNumber === 2) return '🥈';
		if (rankNumber === 3) return '🥉';
		return '';
	}

	function handleRefetch() {
		if (browser) {
			activeQuery.refetch();
		}
	}

	function nextPage() {
		if (canGoNext) {
			currentPage += 1;
		}
	}

	function prevPage() {
		if (canGoPrev) {
			currentPage -= 1;
		}
	}

	function handlePrefetch(type: LeaderboardType) {
		if (!browser || type === selectedType) return;

		const offset = (currentPage - 1) * ITEMS_PER_PAGE;

		if (type === 'traders') {
			queryClient.prefetchQuery({
				queryKey: queryKeys.traders.leaderboard(
					'OVERALL',
					selectedPeriod,
					'PNL',
					ITEMS_PER_PAGE,
					offset
				),
				queryFn: async () => {
					const params = createLeaderboardParams('traders', selectedPeriod, currentPage);
					const response = await fetch(`/api/traders/leaderboard?${params.toString()}`);
					if (!response.ok) throw new Error('Failed to fetch trader leaderboard');
					const rawData: TraderLeaderboardEntry[] = await response.json();
					return enrichWithRankNumber(rawData);
				}
			});
		} else {
			queryClient.prefetchQuery({
				queryKey: queryKeys.builders.leaderboard(selectedPeriod, ITEMS_PER_PAGE, offset),
				queryFn: async () => {
					const params = createLeaderboardParams('builders', selectedPeriod, currentPage);
					const response = await fetch(`/api/builders/leaderboard?${params.toString()}`);
					if (!response.ok) throw new Error('Failed to fetch builder leaderboard');
					const rawData: BuilderLeaderboardEntry[] = await response.json();
					return enrichWithRankNumber(rawData);
				}
			});
		}
	}
</script>

<svelte:head>
	<title>Leaderboard - Glitch Markets</title>
</svelte:head>

<div class="page-container">
	<div class="controls">
		<div class="type-selector" role="group" aria-label="Leaderboard type selector">
			<button
				class="type-button"
				class:active={selectedType === 'traders'}
				onclick={() => (selectedType = 'traders')}
				onmouseenter={() => handlePrefetch('traders')}
				onfocus={() => handlePrefetch('traders')}
				aria-pressed={selectedType === 'traders'}
			>
				Traders
			</button>
			<button
				class="type-button"
				class:active={selectedType === 'builders'}
				onclick={() => (selectedType = 'builders')}
				onmouseenter={() => handlePrefetch('builders')}
				onfocus={() => handlePrefetch('builders')}
				aria-pressed={selectedType === 'builders'}
			>
				Builders
			</button>
		</div>

		<div class="period-selector" role="group" aria-label="Time period selector">
			<button
				class="period-button"
				class:active={selectedPeriod === 'DAY'}
				onclick={() => (selectedPeriod = 'DAY')}
				aria-pressed={selectedPeriod === 'DAY'}
			>
				Day
			</button>
			<button
				class="period-button"
				class:active={selectedPeriod === 'WEEK'}
				onclick={() => (selectedPeriod = 'WEEK')}
				aria-pressed={selectedPeriod === 'WEEK'}
			>
				Week
			</button>
			<button
				class="period-button"
				class:active={selectedPeriod === 'MONTH'}
				onclick={() => (selectedPeriod = 'MONTH')}
				aria-pressed={selectedPeriod === 'MONTH'}
			>
				Month
			</button>
			<button
				class="period-button"
				class:active={selectedPeriod === 'ALL'}
				onclick={() => (selectedPeriod = 'ALL')}
				aria-pressed={selectedPeriod === 'ALL'}
			>
				All Time
			</button>
		</div>
	</div>

	{#if error && currentData}
		<div class="error-banner" transition:fade={{ duration: 200 }}>
			<span class="error-banner-icon">⚠️</span>
			<div class="error-banner-content">
				<p class="error-banner-message">Failed to refresh leaderboard</p>
				<p class="error-banner-detail">{error.message}</p>
			</div>
			<button class="error-banner-retry" onclick={handleRefetch}>Retry</button>
		</div>
	{/if}

	{#if isPending && !currentData}
		<div class="loading-state" transition:fade={{ duration: 150 }}>
			<div class="spinner"></div>
			<p>Loading leaderboard...</p>
		</div>
	{:else if error && !currentData}
		<div class="error-state" transition:fade={{ duration: 150 }}>
			<p class="error-message">Failed to load leaderboard</p>
			<p class="error-detail">{error.message}</p>
			<button class="retry-button" onclick={handleRefetch}>Try Again</button>
		</div>
	{:else if currentData && currentData.length > 0}
		{#key `${selectedType}-${selectedPeriod}`}
			<div
				class="leaderboard-table"
				role="table"
				aria-label="{selectedType} leaderboard"
				transition:fade={{ duration: 150 }}
			>
				<div class="table-header" role="row">
					{#if selectedType === 'traders'}
						<div class="col-rank" role="columnheader">Rank</div>
						<div class="col-trader" role="columnheader">Trader</div>
						<div class="col-pnl" role="columnheader">PnL</div>
						<div class="col-volume" role="columnheader">Volume</div>
					{:else}
						<div class="col-rank" role="columnheader">Rank</div>
						<div class="col-builder" role="columnheader">Builder</div>
						<div class="col-volume" role="columnheader">Volume</div>
						<div class="col-users" role="columnheader">Users</div>
					{/if}
				</div>

				{#if selectedType === 'traders' && tradersData}
					{#each tradersData as entry (entry.proxyWallet)}
						<div class="table-row" class:top-three={entry.rankNumber <= 3} role="row">
							<div class="col-rank" role="cell">
								<span class="rank-number">{entry.rank}</span>
								{#if getRankEmoji(entry.rankNumber)}
									<span class="rank-emoji">{getRankEmoji(entry.rankNumber)}</span>
								{/if}
							</div>

							<div class="col-trader" role="cell">
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

							<div class="col-pnl" role="cell">
								<span
									class="pnl-amount"
									class:positive={entry.pnl >= 0}
									class:negative={entry.pnl < 0}
								>
									{formatPnL(entry.pnl)}
								</span>
							</div>

							<div class="col-volume" role="cell">
								<span class="volume-amount">{formatVolume(entry.vol)}</span>
							</div>
						</div>
					{/each}
				{:else if selectedType === 'builders' && buildersData}
					{#each buildersData as entry (entry.builder)}
						<div class="table-row" class:top-three={entry.rankNumber <= 3} role="row">
							<div class="col-rank" role="cell">
								<span class="rank-number">{entry.rank}</span>
								{#if getRankEmoji(entry.rankNumber)}
									<span class="rank-emoji">{getRankEmoji(entry.rankNumber)}</span>
								{/if}
							</div>

							<div class="col-builder" role="cell">
								<div class="builder-info">
									{#if entry.builderLogo}
										<img
											src={entry.builderLogo}
											alt={entry.builder}
											class="builder-logo"
											loading="lazy"
										/>
									{:else}
										<div class="builder-logo-placeholder">
											{entry.builder.charAt(0).toUpperCase()}
										</div>
									{/if}
									<div class="builder-details">
										<span class="builder-name">{entry.builder}</span>
										{#if entry.verified}
											<span class="verified-badge" title="Verified">✓</span>
										{/if}
									</div>
								</div>
							</div>

							<div class="col-volume" role="cell">
								<span class="volume-amount">{formatVolume(entry.volume)}</span>
							</div>

							<div class="col-users" role="cell">
								<span class="users-count">{formatActiveUsers(entry.activeUsers)}</span>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/key}
	{:else}
		<div class="empty-state" transition:fade={{ duration: 150 }}>
			<p>
				{#if error}
					Unable to load leaderboard data
				{:else if isPending}
					Loading...
				{:else}
					No leaderboard data available for this period
				{/if}
			</p>
		</div>
	{/if}

	{#if currentData && currentData.length > 0}
		<div class="pagination" transition:fade={{ duration: 150 }}>
			<button
				class="pagination-button"
				onclick={prevPage}
				disabled={!canGoPrev}
				aria-label="Previous page"
			>
				← Previous
			</button>

			<span class="pagination-info">
				Page {currentPage}{canGoNext ? '+' : ''}
			</span>

			<button
				class="pagination-button"
				onclick={nextPage}
				disabled={!canGoNext}
				aria-label="Next page"
			>
				Next →
			</button>
		</div>
	{/if}
</div>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-lg) 12px;
		padding-bottom: 60px;
	}

	@media (min-width: 768px) {
		.page-container {
			padding: var(--space-lg) 24px;
			padding-bottom: var(--space-lg);
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
		min-height: 44px;
	}

	.type-button:hover {
		background: var(--bg-2);
		color: var(--text-1);
	}

	.type-button:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
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
		min-height: 44px;
	}

	.period-button:hover {
		background: var(--bg-2);
		color: var(--text-1);
	}

	.period-button:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	.period-button.active {
		background: var(--primary);
		color: var(--bg-0);
	}

	.error-banner {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md);
		margin-bottom: var(--space-md);
		background: color-mix(in srgb, var(--danger) 10%, var(--bg-1));
		border-radius: 12px;
		border: 1px solid color-mix(in srgb, var(--danger) 30%, var(--bg-3));
	}

	.error-banner-icon {
		font-size: 24px;
		flex-shrink: 0;
	}

	.error-banner-content {
		flex: 1;
		min-width: 0;
	}

	.error-banner-message {
		color: var(--text-0);
		font-size: 14px;
		font-weight: 600;
		margin: 0 0 4px 0;
	}

	.error-banner-detail {
		color: var(--text-2);
		font-size: 13px;
		margin: 0;
	}

	.error-banner-retry {
		padding: 8px 16px;
		background: var(--danger);
		color: var(--bg-0);
		border: none;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s ease;
		flex-shrink: 0;
		min-height: 36px;
	}

	.error-banner-retry:hover {
		background: color-mix(in srgb, var(--danger) 90%, black);
	}

	.error-banner-retry:focus-visible {
		outline: 2px solid var(--danger);
		outline-offset: 2px;
	}

	.leaderboard-table {
		background: var(--bg-1);
		border-radius: 16px;
		overflow: hidden;
		border: 1px solid var(--bg-3);
		--col-rank: 80px;
		--col-content: 1fr;
		--col-metric-1: 120px;
		--col-metric-2: 100px;
	}

	@media (max-width: 640px) {
		.leaderboard-table {
			background: transparent;
			border: none;
			display: flex;
			flex-direction: column;
			gap: 6px;
			overflow: visible;
			padding-bottom: 2px;
		}
	}

	.table-header {
		display: grid;
		grid-template-columns: var(--col-rank) var(--col-content) var(--col-metric-1) var(
				--col-metric-2
			);
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
			display: none;
		}
	}

	.table-row {
		display: grid;
		grid-template-columns: var(--col-rank) var(--col-content) var(--col-metric-1) var(
				--col-metric-2
			);
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

	@media (max-width: 640px) {
		.table-row:last-child {
			margin-bottom: 0;
		}
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
			display: flex;
			flex-direction: column;
			gap: var(--space-xs);
			padding: var(--space-xs) var(--space-sm);
			background: var(--bg-1);
			border-radius: 8px;
			border: 1px solid var(--bg-3);
			position: relative;
			transform: translateZ(0);
			-webkit-backface-visibility: hidden;
			backface-visibility: hidden;
		}

		.table-row:hover {
			background: var(--bg-1);
		}

		.table-row.top-three {
			border-color: color-mix(in srgb, var(--primary) 30%, var(--bg-3));
			background: linear-gradient(
				135deg,
				var(--bg-1) 0%,
				color-mix(in srgb, var(--primary) 5%, var(--bg-1)) 100%
			);
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
		.col-rank {
			position: absolute;
			top: var(--space-xs);
			right: var(--space-sm);
		}

		.rank-number {
			font-size: 13px;
		}
		.rank-emoji {
			font-size: 16px;
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

	.trader-avatar {
		width: 40px;
		height: 40px;
		min-width: 40px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
		background: var(--bg-3);
	}

	.builder-logo {
		width: 40px;
		height: 40px;
		min-width: 40px;
		border-radius: 8px;
		object-fit: contain;
		flex-shrink: 0;
		background: var(--bg-3);
		padding: 4px;
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
		.col-trader,
		.col-builder {
			width: calc(100% - 60px);
			padding-right: var(--space-sm);
		}

		.trader-avatar {
			width: 32px;
			height: 32px;
			min-width: 32px;
		}

		.builder-logo {
			width: 32px;
			height: 32px;
			min-width: 32px;
			padding: 2px;
		}

		.trader-avatar-placeholder,
		.builder-logo-placeholder {
			width: 32px;
			height: 32px;
			min-width: 32px;
			font-size: 16px;
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
			font-weight: 600;
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

	@media (max-width: 640px) {
		.verified-badge {
			width: 16px;
			height: 16px;
			font-size: 10px;
		}
	}

	.col-pnl,
	.col-volume,
	.col-users {
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	@media (max-width: 640px) {
		.col-pnl,
		.col-volume,
		.col-users {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			justify-content: flex-start;
			padding: 0;
			border-top: none;
			font-size: 12px;
			width: auto;
			margin-right: var(--space-md);
		}

		.col-pnl::before {
			content: 'PnL:';
			font-size: 10px;
			font-weight: 500;
			color: var(--text-3);
		}

		.col-volume::before {
			content: 'Vol:';
			font-size: 10px;
			font-weight: 500;
			color: var(--text-3);
		}

		.col-users::before {
			content: 'Users:';
			font-size: 10px;
			font-weight: 500;
			color: var(--text-3);
		}
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
			font-size: 13px;
			font-weight: 600;
		}
	}

	.users-count {
		font-weight: 500;
		color: var(--text-2);
		font-size: 14px;
	}

	@media (max-width: 640px) {
		.users-count {
			font-size: 13px;
			font-weight: 600;
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

	.retry-button:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
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

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-lg);
		padding: var(--space-md) 0;
		margin-top: var(--space-md);
	}

	@media (max-width: 640px) {
		.pagination {
			padding: var(--space-md) 0;
			margin-top: var(--space-md);
			gap: var(--space-sm);
		}
	}

	.pagination-button {
		padding: 10px 20px;
		background: var(--bg-1);
		color: var(--text-0);
		border: 1px solid var(--bg-3);
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 44px;
	}

	.pagination-button:hover:not(:disabled) {
		background: var(--primary);
		color: var(--bg-0);
		border-color: var(--primary);
	}

	.pagination-button:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	.pagination-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.pagination-info {
		font-size: 14px;
		color: var(--text-2);
		font-weight: 500;
		min-width: 120px;
		text-align: center;
	}

	@media (max-width: 640px) {
		.pagination-button {
			padding: 10px 16px;
			font-size: 14px;
			min-height: 44px;
			flex: 1;
			max-width: 120px;
		}

		.pagination-info {
			font-size: 13px;
			min-width: 80px;
		}
	}
</style>
