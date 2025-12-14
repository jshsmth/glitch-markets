<script lang="ts">
	import type { PageData } from './$types';
	import type { Market, Comment, MarketHolders } from '$lib/server/api/polymarket-client';
	import { createQuery } from '@tanstack/svelte-query';
	import { page } from '$app/stores';
	import MoneyIcon from '$lib/components/icons/MoneyIcon.svelte';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
	import ScrollIcon from '$lib/components/icons/ScrollIcon.svelte';
	import GlobalIcon from '$lib/components/icons/GlobalIcon.svelte';
	import XIcon from '$lib/components/icons/XIcon.svelte';
	import GitHubIcon from '$lib/components/icons/GitHubIcon.svelte';
	import LinkedInIcon from '$lib/components/icons/LinkedInIcon.svelte';
	import DiscordIcon from '$lib/components/icons/DiscordIcon.svelte';
	import MessageTextIcon from '$lib/components/icons/MessageTextIcon.svelte';
	import LeaderboardIcon from '$lib/components/icons/LeaderboardIcon.svelte';
	import FlashIcon from '$lib/components/icons/FlashIcon.svelte';
	import ChevronLeftIcon from '$lib/components/icons/ChevronLeftIcon.svelte';
	import CopyIcon from '$lib/components/icons/CopyIcon.svelte';
	import CheckCircleIcon from '$lib/components/icons/CheckCircleIcon.svelte';
	import CupIcon from '$lib/components/icons/CupIcon.svelte';
	import { formatNumber } from '$lib/utils/format';

	let { data }: { data: PageData } = $props();

	const event = $derived(data.event);

	function formatDate(dateStr: string | null | undefined): string {
		if (!dateStr) return '';
		try {
			const date = new Date(dateStr);
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
		} catch {
			return '';
		}
	}

	function getMarketDisplayTitle(market: Market): string {
		if (market.groupItemTitle) return market.groupItemTitle;
		try {
			const outcomes =
				typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes;
			if (Array.isArray(outcomes) && outcomes[0]) return outcomes[0];
		} catch {
			// Invalid JSON, fall through to default
		}
		return market.question || 'Unknown';
	}

	function parseMarketData(market: Market) {
		try {
			const outcomes =
				typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes;
			const prices =
				typeof market.outcomePrices === 'string'
					? JSON.parse(market.outcomePrices)
					: market.outcomePrices;
			if (!Array.isArray(outcomes) || !Array.isArray(prices)) return null;
			return outcomes.map((outcome: string, i: number) => {
				const price = parseFloat(prices[i]) * 100;
				const isResolved = market.closed && (price === 0 || price === 100);
				return {
					label: outcome,
					price,
					priceFormatted: isResolved ? (price === 100 ? 'Won' : 'Lost') : price.toFixed(0),
					isResolved,
					won: isResolved && price === 100
				};
			});
		} catch {
			return null;
		}
	}

	function isPlaceholderMarket(market: Market): boolean {
		const title = getMarketDisplayTitle(market);
		const placeholderPrefixes = [
			'Person',
			'Candidate',
			'Company',
			'Team',
			'Player',
			'Country',
			'Option',
			'Choice',
			'Entry',
			'Participant',
			'Contestant',
			'Nominee',
			'Artist',
			'Song',
			'Film',
			'Movie',
			'Show',
			'Act'
		];
		const prefixPattern = new RegExp(`^(${placeholderPrefixes.join('|')}) [A-Z]$`, 'i');
		return prefixPattern.test(title) || /^Other$/i.test(title);
	}

	function getMarketPrice(market: Market): number {
		const data = parseMarketData(market);
		return data?.[0]?.price ?? 0;
	}

	const filteredMarkets = $derived(
		(event.markets || [])
			.filter((market) => !isPlaceholderMarket(market))
			.sort((a, b) => getMarketPrice(b) - getMarketPrice(a))
	);

	const isMultiMarket = $derived(filteredMarkets.length > 1);
	let selectedMarketIndex = $state(0);
	const selectedMarket = $derived(filteredMarkets[selectedMarketIndex] || null);
	const selectedMarketData = $derived(selectedMarket ? parseMarketData(selectedMarket) : null);
	const isMarketResolved = $derived(selectedMarket?.closed || false);
	const winningOutcome = $derived.by(() => {
		if (!isMarketResolved || !selectedMarketData) return null;
		return selectedMarketData.find((outcome) => outcome.won);
	});

	let selectedOutcome = $state(0);
	type TabType = 'outcomes' | 'about' | 'comments';
	let activeTab = $state<TabType>('about');
	type TimeRange = '1H' | '6H' | '1D' | '1W' | '1M' | 'MAX';
	let selectedTimeRange = $state<TimeRange>('1D');
	const selectedMarketConditionId = $derived(selectedMarket?.conditionId);

	const commentsQuery = createQuery<Comment[]>(() => ({
		queryKey: ['comments', event.id],
		queryFn: async () => {
			const params = new URLSearchParams({
				parent_entity_type: 'Event',
				parent_entity_id: event.id,
				limit: '20',
				order: 'createdAt',
				ascending: 'false'
			});
			const response = await fetch(`/api/comments?${params}`);
			if (!response.ok) throw new Error('Failed to fetch comments');
			return response.json();
		},
		enabled: activeTab === 'comments'
	}));

	const holdersQuery = createQuery<MarketHolders[]>(() => ({
		queryKey: ['holders', selectedMarketConditionId],
		queryFn: async () => {
			if (!selectedMarketConditionId) return [];
			const response = await fetch(
				`/api/users/holders?market=${encodeURIComponent(selectedMarketConditionId)}`
			);
			if (!response.ok) throw new Error('Failed to fetch holders');
			return response.json();
		},
		enabled: activeTab === 'holders' && !!selectedMarketConditionId
	}));

	function formatRelativeTime(dateStr: string | null): string {
		if (!dateStr) return '';
		try {
			const date = new Date(dateStr);
			const now = new Date();
			const diffMs = now.getTime() - date.getTime();
			const diffMins = Math.floor(diffMs / 60000);
			const diffHours = Math.floor(diffMs / 3600000);
			const diffDays = Math.floor(diffMs / 86400000);
			if (diffMins < 1) return 'just now';
			if (diffMins < 60) return `${diffMins}m ago`;
			if (diffHours < 24) return `${diffHours}h ago`;
			if (diffDays < 7) return `${diffDays}d ago`;
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		} catch {
			return '';
		}
	}

	function selectMarket(index: number) {
		selectedMarketIndex = index;
		selectedOutcome = 0;
	}

	interface ParsedSegment {
		type: 'text' | 'url';
		content: string;
		domain?: string;
		iconType?: 'x' | 'github' | 'linkedin' | 'discord' | 'global';
	}

	function getDomainFromUrl(url: string): string {
		try {
			return new URL(url).hostname.replace(/^www\./, '');
		} catch {
			return url;
		}
	}

	function getIconTypeForDomain(domain: string): ParsedSegment['iconType'] {
		if (domain.includes('twitter.com') || domain.includes('x.com')) return 'x';
		if (domain.includes('github.com')) return 'github';
		if (domain.includes('linkedin.com')) return 'linkedin';
		if (domain.includes('discord.com') || domain.includes('discord.gg')) return 'discord';
		return 'global';
	}

	function parseTextWithUrls(text: string): ParsedSegment[] {
		const urlRegex = /(https?:\/\/[^\s<>()[\]]+?)([.,;:!?)]*(?:\s|$))/g;
		const segments: ParsedSegment[] = [];
		let lastIndex = 0;
		let match;
		while ((match = urlRegex.exec(text)) !== null) {
			if (match.index > lastIndex) {
				segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
			}
			const url = match[1];
			const domain = getDomainFromUrl(url);
			segments.push({ type: 'url', content: url, domain, iconType: getIconTypeForDomain(domain) });
			if (match[2]) {
				segments.push({ type: 'text', content: match[2] });
			}
			lastIndex = match.index + match[0].length;
		}
		if (lastIndex < text.length) {
			segments.push({ type: 'text', content: text.slice(lastIndex) });
		}
		return segments;
	}

	const parsedDescription = $derived(event.description ? parseTextWithUrls(event.description) : []);

	let copyState = $state<'idle' | 'copied'>('idle');
	async function copyShareLink() {
		try {
			await navigator.clipboard.writeText($page.url.href);
			copyState = 'copied';
			setTimeout(() => (copyState = 'idle'), 2000);
		} catch {
			const input = document.createElement('input');
			input.value = $page.url.href;
			document.body.appendChild(input);
			input.select();
			document.execCommand('copy');
			document.body.removeChild(input);
			copyState = 'copied';
			setTimeout(() => (copyState = 'idle'), 2000);
		}
	}
</script>

<svelte:head>
	<title>{event.title || 'Event'} | Glitch Markets</title>
</svelte:head>

<div class="event-page">
	<!-- Back Link -->
	<a href="/" class="back-link">
		<ChevronLeftIcon size={18} />
		<span>Back</span>
	</a>

	<!-- Header -->
	<header class="event-header">
		<div class="header-row">
			{#if event.image}
				<img src={event.image} alt={event.title || 'Event icon'} class="event-icon" />
			{/if}
			<h1 class="event-title">{event.title || 'Untitled Event'}</h1>
			<button
				class="share-btn"
				class:copied={copyState === 'copied'}
				onclick={copyShareLink}
				aria-label="Copy link"
			>
				{#if copyState === 'copied'}
					<CheckCircleIcon size={18} />
				{:else}
					<CopyIcon size={18} />
				{/if}
			</button>
		</div>
	</header>

	<!-- Main Content -->
	<div class="content-grid">
		<!-- Left Column -->
		<main class="main-content">
			<!-- Probability Summary (Mobile Only) -->
			<section class="probability-summary mobile-only">
				{#if isMultiMarket}
					{#each filteredMarkets.slice(0, 3) as market, index (market.id)}
						{@const marketData = parseMarketData(market)}
						{@const percentage = marketData?.[0]?.priceFormatted || '—'}
						<div class="summary-item">
							<span class="summary-dot" style="background-color: {index === 0 ? 'var(--success)' : index === 1 ? 'var(--danger)' : 'var(--text-3)'}"></span>
							<span class="summary-name">{getMarketDisplayTitle(market)}</span>
							<span class="summary-percentage">{percentage}%</span>
						</div>
					{/each}
				{:else if selectedMarketData}
					{#each selectedMarketData as outcome, index (index)}
						<div class="summary-item">
							<span class="summary-dot" style="background-color: {index === 0 ? 'var(--success)' : 'var(--danger)'}"></span>
							<span class="summary-name">{outcome.label}</span>
							<span class="summary-percentage">{outcome.priceFormatted}%</span>
						</div>
					{/each}
				{/if}
			</section>

			<!-- Chart -->
			<section class="card chart-card">
				<div class="chart-placeholder">
					<span>Chart coming soon</span>
				</div>
				<div class="time-controls">
					{#each ['1H', '6H', '1D', '1W', '1M', 'MAX'] as range}
						<button
							class="time-btn"
							class:active={selectedTimeRange === range}
							onclick={() => (selectedTimeRange = range as TimeRange)}
						>
							{range}
						</button>
					{/each}
				</div>
			</section>

			<!-- Tabs -->
			<section class="card tabs-card">
				<div class="tabs-header">
					<button
						class="tab mobile-only"
						class:active={activeTab === 'outcomes'}
						onclick={() => (activeTab = 'outcomes')}
					>
						Outcomes
					</button>
					<button
						class="tab"
						class:active={activeTab === 'about'}
						onclick={() => (activeTab = 'about')}
					>
						About
					</button>
					<button
						class="tab"
						class:active={activeTab === 'comments'}
						onclick={() => (activeTab = 'comments')}
					>
						<MessageTextIcon size={16} />
						Comments
					</button>
				</div>
				<div class="tab-content">
					{#if activeTab === 'outcomes'}
						<div class="outcomes-grid mobile-only">
							{#if isMultiMarket}
								{#each filteredMarkets as market, index (market.id)}
									{@const marketData = parseMarketData(market)}
									<div class="outcome-card">
										<div class="outcome-card-header">
											<span class="outcome-card-name">{getMarketDisplayTitle(market)}</span>
											<span class="outcome-card-volume">{formatNumber(market.volume || 0)} Vol.</span>
										</div>
										<div class="outcome-card-body">
											<span class="outcome-card-percentage">
												{#if marketData?.[0]?.isResolved}
													<span class="resolved-tag" class:won={marketData[0].won}>
														{marketData[0].priceFormatted}
													</span>
												{:else}
													{marketData?.[0]?.priceFormatted || '—'}%
												{/if}
											</span>
											{#if marketData && !marketData[0]?.isResolved}
												<div class="outcome-card-actions">
													<button class="bet-btn yes">
														Yes · {marketData[0]?.priceFormatted || '—'}¢
													</button>
													<button class="bet-btn no">
														No · {marketData[1]?.priceFormatted || '—'}¢
													</button>
												</div>
											{/if}
										</div>
									</div>
								{/each}
							{:else if selectedMarketData}
								{#each selectedMarketData as outcome, index (index)}
									<div class="outcome-card">
										<div class="outcome-card-header">
											<span class="outcome-card-name">{outcome.label}</span>
											<span class="outcome-card-volume">{formatNumber(selectedMarket?.volume || 0)} Vol.</span>
										</div>
										<div class="outcome-card-body">
											<span class="outcome-card-percentage">
												{#if outcome.isResolved}
													<span class="resolved-tag" class:won={outcome.won}>{outcome.priceFormatted}</span>
												{:else}
													{outcome.priceFormatted}%
												{/if}
											</span>
											{#if !outcome.isResolved}
												<div class="outcome-card-actions">
													<button class="bet-btn yes">
														Yes · {outcome.priceFormatted}¢
													</button>
												</div>
											{/if}
										</div>
									</div>
								{/each}
							{/if}
						</div>
					{:else if activeTab === 'about'}
						{#if event.description}
							<div class="about-content">
								<p class="about-text">
									{#each parsedDescription as segment, i (i)}{#if segment.type === 'text'}{segment.content}{:else}<a
												href={segment.content}
												target="_blank"
												rel="noopener noreferrer"
												class="rules-link"
												>{#if segment.iconType === 'x'}<XIcon
													size={12}
												/>{:else if segment.iconType === 'github'}<GitHubIcon
													size={12}
												/>{:else if segment.iconType === 'linkedin'}<LinkedInIcon
													size={12}
												/>{:else if segment.iconType === 'discord'}<DiscordIcon
													size={12}
												/>{:else}<GlobalIcon size={12} />{/if}<span>{segment.domain}</span></a
											>{/if}{/each}
								</p>
								{#if event.endDate}
									<div class="about-meta">
										<div class="meta-row">
											<CalendarIcon size={14} />
											<span>Ends {formatDate(event.endDate)}</span>
										</div>
									</div>
								{/if}
								{#if event.volume}
									<div class="about-meta">
										<div class="meta-row">
											<MoneyIcon size={14} />
											<span>{formatNumber(event.volume)} Volume</span>
										</div>
									</div>
								{/if}
							</div>
						{:else}
							<div class="tab-empty">No description available</div>
						{/if}
					{:else if activeTab === 'comments'}
						{#if commentsQuery.isLoading}
							<div class="tab-empty">Loading...</div>
						{:else if commentsQuery.data?.length}
							<div class="comments-list">
								{#each commentsQuery.data as comment (comment.id)}
									<div class="comment">
										<div class="comment-avatar">
											{#if comment.profile?.profileImage}
												<img
													src={comment.profile.profileImage}
													alt={comment.profile?.name || comment.profile?.pseudonym || 'User avatar'}
													loading="lazy"
												/>
											{/if}
										</div>
										<div class="comment-body">
											<div class="comment-meta">
												<span class="comment-author">
													{comment.profile?.name || comment.profile?.pseudonym || 'Anon'}
												</span>
												<span class="comment-time">{formatRelativeTime(comment.createdAt)}</span>
											</div>
											<p>{comment.body}</p>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="tab-empty">No comments yet</div>
						{/if}
					{/if}
				</div>
			</section>
		</main>

		<!-- Right Sidebar (Desktop only) -->
		<aside class="sidebar desktop-only">
			<div class="outcomes-panel">
				<h2 class="outcomes-panel-title">Outcomes</h2>
				<div class="outcomes-scroll">
					{#if isMultiMarket}
						{#each filteredMarkets as market, index (market.id)}
							{@const marketData = parseMarketData(market)}
							<div class="outcome-card">
								<div class="outcome-card-header">
									<span class="outcome-card-name">{getMarketDisplayTitle(market)}</span>
									<span class="outcome-card-volume">{formatNumber(market.volume || 0)} Vol.</span>
								</div>
								<div class="outcome-card-body">
									<span class="outcome-card-percentage">
										{#if marketData?.[0]?.isResolved}
											<span class="resolved-tag" class:won={marketData[0].won}>
												{marketData[0].priceFormatted}
											</span>
										{:else}
											{marketData?.[0]?.priceFormatted || '—'}%
										{/if}
									</span>
									{#if marketData && !marketData[0]?.isResolved}
										<div class="outcome-card-actions">
											<button class="bet-btn yes">
												Yes · {marketData[0]?.priceFormatted || '—'}¢
											</button>
											<button class="bet-btn no">
												No · {marketData[1]?.priceFormatted || '—'}¢
											</button>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					{:else if selectedMarketData}
						{#each selectedMarketData as outcome, index (index)}
							<div class="outcome-card">
								<div class="outcome-card-header">
									<span class="outcome-card-name">{outcome.label}</span>
									<span class="outcome-card-volume">{formatNumber(selectedMarket?.volume || 0)} Vol.</span>
								</div>
								<div class="outcome-card-body">
									<span class="outcome-card-percentage">
										{#if outcome.isResolved}
											<span class="resolved-tag" class:won={outcome.won}>{outcome.priceFormatted}</span>
										{:else}
											{outcome.priceFormatted}%
										{/if}
									</span>
									{#if !outcome.isResolved}
										<div class="outcome-card-actions">
											<button class="bet-btn yes">
												Yes · {outcome.priceFormatted}¢
											</button>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</aside>
	</div>
</div>

<style>
	/* Reset & Base */
	.event-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 12px;
		padding-bottom: 80px;
	}

	/* Back Link */
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 8px 0;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-2);
		text-decoration: none;
	}

	.back-link:hover {
		color: var(--primary);
	}

	/* Header */
	.event-header {
		margin-bottom: 16px;
	}

	.header-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.event-icon {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		object-fit: cover;
		flex-shrink: 0;
		border: 1.5px solid var(--bg-3);
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.02);
	}

	.event-title {
		font-size: 18px;
		font-weight: 700;
		color: var(--text-0);
		line-height: 1.3;
		margin: 0;
		flex: 1;
		min-width: 0;
	}

	.share-btn {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-2);
		border: 1px solid var(--bg-3);
		border-radius: 8px;
		color: var(--text-2);
		cursor: pointer;
		flex-shrink: 0;
		transition: all var(--transition-fast);
	}

	.share-btn:hover {
		color: var(--primary);
		border-color: var(--bg-4);
	}

	.share-btn.copied {
		color: var(--gold-dark);
		border-color: var(--gold-base);
		background: rgba(var(--gold-rgb), 0.1);
	}

	/* Probability Summary (Mobile) */
	.probability-summary {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 16px;
	}

	.summary-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
	}

	.summary-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.summary-name {
		flex: 1;
		color: var(--text-0);
		font-weight: 500;
	}

	.summary-percentage {
		font-weight: 700;
		color: var(--text-0);
	}

	/* Content Grid */
	.content-grid {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.main-content {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	/* Cards */
	.card {
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: 12px;
		padding: 16px;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		padding-bottom: 10px;
		border-bottom: 1px solid var(--bg-3);
	}

	.card-header h2 {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-0);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin: 0;
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

	/* Chart */
	.chart-card {
		padding: 0;
		overflow: hidden;
	}

	.chart-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 220px;
		background: var(--bg-2);
		color: var(--text-3);
		font-size: 14px;
	}

	.time-controls {
		display: flex;
		gap: 4px;
		padding: 12px;
		background: var(--bg-1);
		border-top: 1px solid var(--bg-3);
	}

	.time-btn {
		flex: 1;
		padding: 8px;
		font-size: 12px;
		font-weight: 600;
		background: var(--bg-2);
		border: 1px solid var(--bg-3);
		border-radius: 6px;
		color: var(--text-2);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.time-btn:hover {
		background: var(--bg-3);
		color: var(--text-0);
	}

	.time-btn.active {
		background: var(--primary);
		color: var(--bg-0);
		border-color: var(--primary);
	}

	.rules-link {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 6px;
		background: var(--bg-2);
		border-radius: 4px;
		color: var(--primary);
		text-decoration: none;
		font-size: 12px;
	}

	.rules-link span {
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Tabs */
	.tabs-card {
		padding: 0;
	}

	.tabs-header {
		display: flex;
		border-bottom: 1px solid var(--bg-3);
	}

	.tab {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 14px 8px;
		font-size: 14px;
		font-weight: 600;
		color: var(--text-2);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.tab:hover {
		color: var(--text-0);
	}

	.tab.active {
		color: var(--primary);
		border-bottom-color: var(--primary);
	}

	.tab-content {
		padding: 16px;
		min-height: 150px;
	}

	.tab-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100px;
		color: var(--text-3);
		font-size: 14px;
	}

	/* Outcome Cards */
	.outcomes-grid {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.outcome-card {
		background: var(--bg-2);
		border: 1px solid var(--bg-3);
		border-radius: 12px;
		padding: 14px;
		transition: all var(--transition-fast);
	}

	.outcomes-grid .outcome-card:not(:last-child) {
		margin-bottom: 16px;
	}

	.outcomes-scroll .outcome-card:not(:last-child) {
		margin-bottom: 12px;
	}

	.outcome-card:hover {
		border-color: var(--bg-4);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.outcome-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		gap: 8px;
	}

	.outcome-card-name {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-0);
		flex: 1;
		min-width: 0;
	}

	.outcome-card-volume {
		font-size: 11px;
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
		font-size: 32px;
		font-weight: 700;
		color: var(--text-0);
		flex-shrink: 0;
	}

	.outcome-card-actions {
		display: flex;
		flex-direction: column;
		gap: 6px;
		flex: 1;
	}

	.bet-btn {
		padding: 10px 14px;
		font-size: 13px;
		font-weight: 600;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all var(--transition-fast);
		white-space: nowrap;
	}

	.bet-btn.yes {
		background: rgba(0, 196, 71, 0.1);
		color: var(--success);
		border: 1px solid rgba(0, 196, 71, 0.2);
	}

	.bet-btn.yes:hover:not(:disabled) {
		background: rgba(0, 196, 71, 0.15);
		border-color: var(--success);
	}

	.bet-btn.no {
		background: rgba(255, 51, 102, 0.1);
		color: var(--danger);
		border: 1px solid rgba(255, 51, 102, 0.2);
	}

	.bet-btn.no:hover:not(:disabled) {
		background: rgba(255, 51, 102, 0.15);
		border-color: var(--danger);
	}

	.bet-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* About Content */
	.about-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.about-text {
		font-size: 14px;
		line-height: 1.6;
		color: var(--text-1);
		margin: 0;
		white-space: pre-wrap;
	}

	.about-meta {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-top: 12px;
		border-top: 1px solid var(--bg-3);
	}

	.meta-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: var(--text-2);
	}

	/* Comments */
	.comments-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.comment {
		display: flex;
		gap: 10px;
	}

	.comment-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--bg-3);
		overflow: hidden;
		flex-shrink: 0;
	}

	.comment-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.comment-body {
		flex: 1;
		min-width: 0;
	}

	.comment-meta {
		display: flex;
		gap: 8px;
		margin-bottom: 4px;
	}

	.comment-author {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-0);
	}

	.comment-time {
		font-size: 12px;
		color: var(--text-3);
	}

	.comment-body p {
		font-size: 14px;
		color: var(--text-1);
		margin: 0;
		line-height: 1.5;
	}

	/* Holders */
	.holders-grid {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.holders-col {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.holders-label {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		margin-bottom: 4px;
	}

	.holders-label.yes {
		color: var(--success);
	}

	.holders-label.no {
		color: var(--danger);
	}

	.holder {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px;
		background: var(--bg-2);
		border-radius: 8px;
		font-size: 13px;
	}

	.holder-rank {
		color: var(--text-3);
		font-size: 12px;
		flex-shrink: 0;
		min-width: 24px;
	}

	.holder:first-child .holder-rank {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-base) 100%);
		color: #5c4a15;
		border-radius: 50%;
		font-size: 10px;
		font-weight: 700;
		box-shadow: 0 1px 2px rgba(var(--gold-rgb), 0.3);
	}

	.holder-name {
		flex: 1;
		min-width: 0;
		color: var(--text-0);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.holder-amount {
		font-weight: 600;
		flex-shrink: 0;
	}

	.holder-amount.yes {
		color: var(--success);
	}

	.holder-amount.no {
		color: var(--danger);
	}

	/* Mobile/Desktop visibility */
	.mobile-only {
		display: block;
	}

	.desktop-only {
		display: none;
	}

	/* Sidebar (Desktop) */
	.sidebar {
		position: sticky;
		top: 80px;
		height: fit-content;
		max-height: calc(100vh - 100px);
		overflow-y: auto;
	}

	.outcomes-panel {
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: 12px;
		overflow: hidden;
	}

	.outcomes-panel-title {
		font-size: 14px;
		font-weight: 700;
		color: var(--text-0);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin: 0;
		padding: 16px;
		border-bottom: 1px solid var(--bg-3);
	}

	.outcomes-scroll {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 16px;
		max-height: calc(100vh - 200px);
		overflow-y: auto;
	}

	/* Desktop Layout */
	@media (min-width: 768px) {
		.event-page {
			padding: 24px;
			padding-bottom: 48px;
		}

		.event-title {
			font-size: 20px;
		}

		.event-icon {
			width: 48px;
			height: 48px;
		}

		.chart-placeholder {
			height: 380px;
		}

		.mobile-only {
			display: none;
		}

		.desktop-only {
			display: block;
		}

		.content-grid {
			display: grid;
			grid-template-columns: 1fr 380px;
			gap: 24px;
			align-items: start;
		}

		.main-content {
			gap: 16px;
		}

		.card {
			padding: 20px;
		}

		.chart-card {
			padding: 0;
		}

		.time-controls {
			padding: 16px;
		}
	}

	@media (min-width: 1024px) {
		.event-title {
			font-size: 24px;
		}

		.event-icon {
			width: 56px;
			height: 56px;
		}

		.content-grid {
			grid-template-columns: 1fr 420px;
		}
	}
</style>
