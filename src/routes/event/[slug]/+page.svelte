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

	let { data }: { data: PageData } = $props();

	const event = $derived(data.event);

	function formatNumber(num: number | null | undefined): string {
		if (num === null || num === undefined) return '$0';
		if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
		if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
		return `$${num.toFixed(0)}`;
	}

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
	let rulesExpanded = $state(false);
	type TabType = 'comments' | 'holders' | 'activity';
	let activeTab = $state<TabType>('comments');
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
			<div class="header-text">
				<h1 class="event-title">{event.title || 'Untitled Event'}</h1>
				<div class="event-meta">
					<span class="meta-item">
						<MoneyIcon size={14} />
						{formatNumber(event.volume)}
					</span>
					{#if event.endDate}
						<span class="meta-item">
							<CalendarIcon size={14} />
							{formatDate(event.endDate)}
						</span>
					{/if}
				</div>
			</div>
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
		{#if event.tags && event.tags.length > 0}
			<div class="tags-row">
				{#each event.tags.slice(0, 4) as tag (tag.id)}
					<span class="tag">{tag.label}</span>
				{/each}
			</div>
		{/if}
	</header>

	<!-- Main Content -->
	<div class="content-grid">
		<!-- Left Column -->
		<main class="main-content">
			<!-- Trade Card (Mobile: inline, Desktop: in sidebar) -->
			<section class="trade-section mobile-only">
				{#if isMarketResolved}
					<div class="resolved-banner">
						<CheckCircleIcon size={20} />
						<span>Resolved: {winningOutcome?.label || 'Complete'}</span>
					</div>
				{:else if selectedMarketData}
					<div class="quick-trade">
						{#if isMultiMarket && selectedMarket}
							<div class="trade-market-name">{getMarketDisplayTitle(selectedMarket)}</div>
						{/if}
						<div class="trade-pills">
							{#each selectedMarketData as outcome, index (index)}
								<button
									class="trade-pill"
									class:selected={selectedOutcome === index}
									class:yes={index === 0}
									class:no={index === 1}
									onclick={() => (selectedOutcome = index)}
								>
									<span class="pill-label">{outcome.label}</span>
									<span class="pill-price">{outcome.priceFormatted}¢</span>
								</button>
							{/each}
						</div>
						<button class="trade-btn" disabled>Trade</button>
					</div>
				{/if}
			</section>

			<!-- Outcomes -->
			<section class="card">
				<div class="card-header">
					<h2>Outcomes</h2>
					{#if filteredMarkets.length > 5}
						<ScrollIcon size={14} />
					{/if}
				</div>
				<div class="outcomes-list">
					{#if isMultiMarket}
						{#each filteredMarkets as market, index (market.id)}
							{@const marketData = parseMarketData(market)}
							<button
								class="outcome-row"
								class:selected={selectedMarketIndex === index}
								onclick={() => selectMarket(index)}
							>
								<span class="outcome-name">{getMarketDisplayTitle(market)}</span>
								<span class="outcome-price">
									{#if marketData?.[0]?.isResolved}
										<span class="resolved-tag" class:won={marketData[0].won}>
											{marketData[0].priceFormatted}
										</span>
									{:else}
										{marketData?.[0]?.priceFormatted || '—'}%
									{/if}
								</span>
							</button>
						{/each}
					{:else if selectedMarketData}
						{#each selectedMarketData as outcome, index (index)}
							<button
								class="outcome-row"
								class:selected={selectedOutcome === index}
								onclick={() => (selectedOutcome = index)}
							>
								<span class="outcome-name">{outcome.label}</span>
								<span class="outcome-price">
									{#if outcome.isResolved}
										<span class="resolved-tag" class:won={outcome.won}
											>{outcome.priceFormatted}</span
										>
									{:else}
										{outcome.priceFormatted}%
									{/if}
								</span>
							</button>
						{/each}
					{/if}
				</div>
			</section>

			<!-- Chart -->
			<section class="card">
				<div class="chart-placeholder">Chart coming soon</div>
			</section>

			<!-- Rules -->
			{#if event.description}
				<section class="card">
					<div class="card-header">
						<h2>Rules</h2>
					</div>
					<div class="rules-content" class:expanded={rulesExpanded}>
						<p class="rules-text">
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
					</div>
					{#if event.description.length > 200}
						<button class="show-more" onclick={() => (rulesExpanded = !rulesExpanded)}>
							{rulesExpanded ? 'Show less' : 'Show more'}
						</button>
					{/if}
				</section>
			{/if}

			<!-- Tabs -->
			<section class="card tabs-card">
				<div class="tabs-header">
					<button
						class="tab"
						class:active={activeTab === 'comments'}
						onclick={() => (activeTab = 'comments')}
					>
						<MessageTextIcon size={16} />
						Comments
					</button>
					<button
						class="tab"
						class:active={activeTab === 'holders'}
						onclick={() => (activeTab = 'holders')}
					>
						<LeaderboardIcon size={16} />
						Holders
					</button>
					<button
						class="tab"
						class:active={activeTab === 'activity'}
						onclick={() => (activeTab = 'activity')}
					>
						<FlashIcon size={16} />
						Activity
					</button>
				</div>
				<div class="tab-content">
					{#if activeTab === 'comments'}
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
					{:else if activeTab === 'holders'}
						{#if holdersQuery.isLoading}
							<div class="tab-empty">Loading...</div>
						{:else if holdersQuery.data?.length}
							{@const allHolders = holdersQuery.data.flatMap((m) => m.holders)}
							{@const yesHolders = allHolders.filter((h) => h.outcomeIndex === 0).slice(0, 5)}
							{@const noHolders = allHolders.filter((h) => h.outcomeIndex === 1).slice(0, 5)}
							<div class="holders-grid">
								<div class="holders-col">
									<div class="holders-label yes">Yes</div>
									{#each yesHolders as holder, i (holder.proxyWallet)}
										<div class="holder">
											<span class="holder-rank">#{i + 1}</span>
											<span class="holder-name">{holder.name || holder.pseudonym || 'Anon'}</span>
											<span class="holder-amount yes">{formatNumber(holder.amount)}</span>
										</div>
									{/each}
								</div>
								<div class="holders-col">
									<div class="holders-label no">No</div>
									{#each noHolders as holder, i (holder.proxyWallet)}
										<div class="holder">
											<span class="holder-rank">#{i + 1}</span>
											<span class="holder-name">{holder.name || holder.pseudonym || 'Anon'}</span>
											<span class="holder-amount no">{formatNumber(holder.amount)}</span>
										</div>
									{/each}
								</div>
							</div>
						{:else}
							<div class="tab-empty">No holders data</div>
						{/if}
					{:else}
						<div class="tab-empty">Activity coming soon</div>
					{/if}
				</div>
			</section>
		</main>

		<!-- Right Sidebar (Desktop only) -->
		<aside class="sidebar desktop-only">
			<div class="sidebar-card">
				{#if isMarketResolved}
					<div class="resolved-card">
						<div class="resolved-icon">
							<svg width="48" height="48" viewBox="0 0 48 48" fill="none">
								<circle cx="24" cy="24" r="24" fill="var(--primary)" />
								<path
									d="M34 16L20 30L14 24"
									stroke="white"
									stroke-width="3"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						<h3>Outcome: {winningOutcome?.label || 'Resolved'}</h3>
						<p>
							{isMultiMarket && selectedMarket
								? getMarketDisplayTitle(selectedMarket)
								: event.title}
						</p>
					</div>
				{:else}
					<div class="sidebar-header">
						{#if event.image}
							<img src={event.image} alt={event.title || 'Event icon'} class="sidebar-icon" />
						{/if}
						<span class="sidebar-title">
							{isMultiMarket && selectedMarket
								? getMarketDisplayTitle(selectedMarket)
								: event.title}
						</span>
					</div>
					{#if selectedMarketData}
						<div class="sidebar-pills">
							{#each selectedMarketData as outcome, index (index)}
								<button
									class="sidebar-pill"
									class:selected={selectedOutcome === index}
									class:yes={index === 0}
									class:no={index === 1}
									onclick={() => (selectedOutcome = index)}
								>
									<span>{outcome.label}</span>
									<span class="price">{outcome.priceFormatted}¢</span>
								</button>
							{/each}
						</div>
					{/if}
					<div class="sidebar-amount">
						<label for="amount">Amount</label>
						<input id="amount" type="number" placeholder="$0" />
						<div class="quick-btns">
							<button>+$1</button>
							<button>+$20</button>
							<button>+$100</button>
							<button>Max</button>
						</div>
					</div>
					<button class="sidebar-trade-btn" disabled>Trade</button>
					<p class="terms">By trading, you agree to the <a href="/terms">Terms of Use</a></p>
				{/if}
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
		align-items: flex-start;
		gap: 12px;
	}

	.event-icon {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		object-fit: cover;
		flex-shrink: 0;
	}

	.header-text {
		flex: 1;
		min-width: 0;
	}

	.event-title {
		font-size: 18px;
		font-weight: 700;
		color: var(--text-0);
		line-height: 1.3;
		margin: 0 0 6px 0;
	}

	.event-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 13px;
		color: var(--text-2);
	}

	.share-btn {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: 8px;
		color: var(--text-2);
		cursor: pointer;
		flex-shrink: 0;
	}

	.share-btn:hover {
		color: var(--primary);
		border-color: var(--primary);
	}

	.share-btn.copied {
		color: var(--success);
		border-color: var(--success);
	}

	.tags-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 10px;
	}

	.tag {
		padding: 4px 10px;
		font-size: 11px;
		font-weight: 500;
		color: var(--text-2);
		background: var(--bg-2);
		border-radius: 6px;
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
		border: 1px solid var(--bg-4);
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

	/* Trade Section (Mobile) */
	.trade-section {
		margin-bottom: 4px;
	}

	.resolved-banner {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 14px;
		background: var(--primary);
		color: var(--bg-0);
		border-radius: 12px;
		font-weight: 600;
		font-size: 15px;
	}

	.quick-trade {
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: 12px;
		padding: 14px;
	}

	.trade-market-name {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-0);
		margin-bottom: 10px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.trade-pills {
		display: flex;
		gap: 8px;
		margin-bottom: 12px;
	}

	.trade-pill {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px;
		background: var(--bg-2);
		border: 2px solid var(--bg-4);
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.trade-pill.selected.yes {
		border-color: var(--success);
		background: rgba(0, 196, 71, 0.1);
	}

	.trade-pill.selected.no {
		border-color: var(--danger);
		background: rgba(255, 51, 102, 0.1);
	}

	.trade-pill .pill-label {
		font-size: 14px;
		font-weight: 500;
		color: var(--text-0);
	}

	.trade-pill .pill-price {
		font-size: 15px;
		font-weight: 700;
		color: var(--text-0);
	}

	.trade-pill.selected.yes .pill-price {
		color: var(--success);
	}

	.trade-pill.selected.no .pill-price {
		color: var(--danger);
	}

	.trade-btn {
		width: 100%;
		padding: 14px;
		font-size: 16px;
		font-weight: 600;
		background: var(--primary);
		border: none;
		border-radius: 10px;
		color: var(--bg-0);
		cursor: pointer;
	}

	.trade-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Outcomes */
	.outcomes-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-height: 300px;
		overflow-y: auto;
	}

	.outcome-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px;
		background: var(--bg-2);
		border: 2px solid transparent;
		border-radius: 10px;
		cursor: pointer;
		width: 100%;
		text-align: left;
	}

	.outcome-row:hover {
		background: var(--bg-3);
	}

	.outcome-row.selected {
		border-color: var(--primary);
		background: var(--primary-hover-bg);
	}

	.outcome-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--text-0);
		flex: 1;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-right: 12px;
	}

	.outcome-price {
		font-size: 16px;
		font-weight: 700;
		color: var(--text-0);
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

	/* Chart */
	.chart-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 180px;
		background: var(--bg-2);
		border-radius: 8px;
		color: var(--text-3);
		font-size: 14px;
	}

	/* Rules */
	.rules-content {
		max-height: 80px;
		overflow: hidden;
	}

	.rules-content.expanded {
		max-height: none;
	}

	.rules-text {
		font-size: 14px;
		line-height: 1.6;
		color: var(--text-2);
		margin: 0;
		white-space: pre-wrap;
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

	.show-more {
		margin-top: 8px;
		padding: 0;
		font-size: 13px;
		font-weight: 500;
		color: var(--primary);
		background: none;
		border: none;
		cursor: pointer;
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
		font-size: 13px;
		font-weight: 500;
		color: var(--text-2);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
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
		display: grid;
		grid-template-columns: 1fr 1fr;
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
		gap: 6px;
		padding: 8px;
		background: var(--bg-2);
		border-radius: 8px;
		font-size: 12px;
	}

	.holder-rank {
		color: var(--text-3);
		width: 20px;
	}

	.holder-name {
		flex: 1;
		color: var(--text-0);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.holder-amount {
		font-weight: 600;
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
		top: 100px;
	}

	.sidebar-card {
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: 16px;
		padding: 20px;
	}

	.resolved-card {
		text-align: center;
		padding: 24px 16px;
	}

	.resolved-card .resolved-icon {
		margin-bottom: 16px;
	}

	.resolved-card h3 {
		font-size: 18px;
		font-weight: 700;
		color: var(--primary);
		margin: 0 0 8px 0;
	}

	.resolved-card p {
		font-size: 14px;
		color: var(--text-2);
		margin: 0;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 16px;
	}

	.sidebar-icon {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		object-fit: cover;
	}

	.sidebar-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-0);
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.sidebar-pills {
		display: flex;
		gap: 8px;
		margin-bottom: 16px;
	}

	.sidebar-pill {
		flex: 1;
		display: flex;
		justify-content: space-between;
		padding: 12px;
		background: var(--bg-2);
		border: 2px solid var(--bg-4);
		border-radius: 10px;
		cursor: pointer;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-0);
	}

	.sidebar-pill .price {
		font-weight: 700;
	}

	.sidebar-pill.selected.yes {
		border-color: var(--success);
		background: rgba(0, 196, 71, 0.1);
	}

	.sidebar-pill.selected.yes .price {
		color: var(--success);
	}

	.sidebar-pill.selected.no {
		border-color: var(--danger);
		background: rgba(255, 51, 102, 0.1);
	}

	.sidebar-pill.selected.no .price {
		color: var(--danger);
	}

	.sidebar-amount {
		margin-bottom: 16px;
	}

	.sidebar-amount label {
		display: block;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-2);
		margin-bottom: 8px;
	}

	.sidebar-amount input {
		width: 100%;
		padding: 14px;
		font-size: 20px;
		font-weight: 700;
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: 10px;
		color: var(--text-0);
		outline: none;
		margin-bottom: 8px;
	}

	.sidebar-amount input:focus {
		border-color: var(--primary);
	}

	.quick-btns {
		display: flex;
		gap: 6px;
	}

	.quick-btns button {
		flex: 1;
		padding: 8px;
		font-size: 12px;
		font-weight: 500;
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: 8px;
		color: var(--text-1);
		cursor: pointer;
	}

	.quick-btns button:hover {
		border-color: var(--primary);
	}

	.sidebar-trade-btn {
		width: 100%;
		padding: 16px;
		font-size: 16px;
		font-weight: 600;
		background: var(--primary);
		border: none;
		border-radius: 10px;
		color: var(--bg-0);
		cursor: pointer;
		margin-bottom: 12px;
	}

	.sidebar-trade-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.terms {
		font-size: 11px;
		color: var(--text-3);
		text-align: center;
		margin: 0;
	}

	.terms a {
		color: var(--primary);
	}

	/* Desktop Layout */
	@media (min-width: 768px) {
		.event-page {
			padding: 24px;
			padding-bottom: 48px;
		}

		.event-title {
			font-size: 24px;
		}

		.event-icon {
			width: 56px;
			height: 56px;
		}

		.chart-placeholder {
			height: 280px;
		}

		.mobile-only {
			display: none;
		}

		.desktop-only {
			display: block;
		}

		.content-grid {
			display: grid;
			grid-template-columns: 1fr 340px;
			gap: 24px;
			align-items: start;
		}
	}
</style>
