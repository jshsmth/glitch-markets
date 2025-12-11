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

	// Format numbers
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

	function formatDate(dateStr: string | null | undefined): string {
		if (!dateStr) return '';
		try {
			const date = new Date(dateStr);
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return '';
		}
	}

	// Get display title for market (for multi-market events)
	function getMarketDisplayTitle(market: Market): string {
		if (market.groupItemTitle) return market.groupItemTitle;
		try {
			const outcomes =
				typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes;
			if (Array.isArray(outcomes) && outcomes[0]) return outcomes[0];
		} catch {
			// fallthrough
		}
		return market.question || 'Unknown';
	}

	// Parse market data
	function parseMarketData(market: Market) {
		try {
			const outcomes =
				typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes;
			const prices =
				typeof market.outcomePrices === 'string'
					? JSON.parse(market.outcomePrices)
					: market.outcomePrices;

			if (!Array.isArray(outcomes) || !Array.isArray(prices)) return null;

			return outcomes.map((outcome: string, i: number) => ({
				label: outcome,
				price: parseFloat(prices[i]) * 100,
				priceFormatted: (parseFloat(prices[i]) * 100).toFixed(0)
			}));
		} catch {
			return null;
		}
	}

	// Filter out placeholder markets
	function isPlaceholderMarket(market: Market): boolean {
		const title = getMarketDisplayTitle(market);
		// Match placeholder patterns:
		// - "Word X" where Word is common placeholder prefix and X is a single letter (A-Z)
		// - "Other" exactly
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

	// Get the primary outcome price for sorting
	function getMarketPrice(market: Market): number {
		const data = parseMarketData(market);
		return data?.[0]?.price ?? 0;
	}

	// Get filtered markets (excluding placeholders), sorted by highest chance
	const filteredMarkets = $derived(
		(event.markets || [])
			.filter((market) => !isPlaceholderMarket(market))
			.sort((a, b) => getMarketPrice(b) - getMarketPrice(a))
	);

	// Check if multi-market event
	const isMultiMarket = $derived(filteredMarkets.length > 1);

	// Selected market for the buy card
	let selectedMarketIndex = $state(0);

	const selectedMarket = $derived(filteredMarkets[selectedMarketIndex] || null);

	const selectedMarketData = $derived(selectedMarket ? parseMarketData(selectedMarket) : null);

	// Selected outcome within the buy card (0 = first outcome, 1 = second)
	let selectedOutcome = $state(0);

	// Rules section expanded state
	let rulesExpanded = $state(false);

	// Tabs state: 'comments' | 'holders' | 'activity'
	type TabType = 'comments' | 'holders' | 'activity';
	let activeTab = $state<TabType>('comments');

	// Get selected market condition ID for holders query (API requires conditionId, not id)
	const selectedMarketConditionId = $derived(selectedMarket?.conditionId);

	// Comments query
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

	// Top Holders query (for selected market only)
	const holdersQuery = createQuery<MarketHolders[]>(() => ({
		queryKey: ['holders', selectedMarketConditionId],
		queryFn: async () => {
			if (!selectedMarketConditionId) return [];
			const params = new URLSearchParams();
			params.append('market', selectedMarketConditionId);
			const response = await fetch(`/api/users/holders?${params}`);
			if (!response.ok) throw new Error('Failed to fetch holders');
			return response.json();
		},
		enabled: activeTab === 'holders' && !!selectedMarketConditionId
	}));

	// Format relative time
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

	// Handle market selection
	function selectMarket(index: number) {
		selectedMarketIndex = index;
		selectedOutcome = 0; // Reset outcome selection when market changes
	}

	// URL parsing for rules section
	interface ParsedSegment {
		type: 'text' | 'url';
		content: string;
		domain?: string;
		iconType?: 'x' | 'github' | 'linkedin' | 'discord' | 'global';
	}

	function getDomainFromUrl(url: string): string {
		try {
			const urlObj = new URL(url);
			return urlObj.hostname.replace(/^www\./, '');
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
			// Add text before the URL
			if (match.index > lastIndex) {
				segments.push({
					type: 'text',
					content: text.slice(lastIndex, match.index)
				});
			}

			// Add the URL
			const url = match[1];
			const domain = getDomainFromUrl(url);
			segments.push({
				type: 'url',
				content: url,
				domain,
				iconType: getIconTypeForDomain(domain)
			});

			// Add trailing punctuation as text if any
			if (match[2] && match[2].trim()) {
				segments.push({
					type: 'text',
					content: match[2]
				});
			} else if (match[2]) {
				segments.push({
					type: 'text',
					content: match[2]
				});
			}

			lastIndex = match.index + match[0].length;
		}

		// Add remaining text
		if (lastIndex < text.length) {
			segments.push({
				type: 'text',
				content: text.slice(lastIndex)
			});
		}

		return segments;
	}

	const parsedDescription = $derived(
		event.description ? parseTextWithUrls(event.description) : []
	);

	// Share functionality
	let copyState = $state<'idle' | 'copied'>('idle');

	async function copyShareLink() {
		try {
			await navigator.clipboard.writeText($page.url.href);
			copyState = 'copied';
			setTimeout(() => {
				copyState = 'idle';
			}, 2000);
		} catch {
			// Fallback for older browsers
			const input = document.createElement('input');
			input.value = $page.url.href;
			document.body.appendChild(input);
			input.select();
			document.execCommand('copy');
			document.body.removeChild(input);
			copyState = 'copied';
			setTimeout(() => {
				copyState = 'idle';
			}, 2000);
		}
	}
</script>

<svelte:head>
	<title>{event.title || 'Event'} | Glitch Markets</title>
</svelte:head>

<div class="event-page">
	<a href="/" class="back-link">
		<ChevronLeftIcon size={18} />
		<span>Back to Markets</span>
	</a>

	<div class="event-layout">
		<div class="event-main">
			<header class="event-header">
				<div class="header-top">
					{#if event.image}
						<div class="event-icon">
							<img src={event.image} alt="" />
						</div>
					{/if}
					<div class="header-content">
						<h1 class="event-title">{event.title || 'Untitled Event'}</h1>
						{#if event.tags && event.tags.length > 0}
							<div class="event-tags">
								{#each event.tags as tag (tag.id)}
									<span class="event-tag">{tag.label}</span>
								{/each}
							</div>
						{/if}
					</div>
					<button
						class="share-btn"
						class:copied={copyState === 'copied'}
						onclick={copyShareLink}
						aria-label={copyState === 'copied' ? 'Link copied!' : 'Copy link to share'}
					>
						{#if copyState === 'copied'}
							<CheckCircleIcon size={18} />
						{:else}
							<CopyIcon size={18} />
						{/if}
					</button>
				</div>

				<div class="event-meta">
					<div class="meta-item">
						<MoneyIcon size={16} />
						<span class="meta-value">{formatNumber(event.volume)}</span>
						<span class="meta-label">Vol.</span>
					</div>
					{#if event.endDate}
						<div class="meta-item">
							<CalendarIcon size={16} />
							<span class="meta-value">{formatDate(event.endDate)}</span>
						</div>
					{/if}
				</div>
			</header>

			<div class="chart-section">
				<div class="chart-placeholder">
					<span class="placeholder-text">Chart coming soon</span>
				</div>
			</div>

			<section class="outcomes-section">
				<div class="outcomes-header">
					<h2 class="section-title">Outcomes</h2>
					<div class="outcomes-header-right">
						{#if filteredMarkets.length > 5}
							<span class="scroll-hint">
								<ScrollIcon size={14} />
							</span>
						{/if}
						<span class="outcomes-label">Chance</span>
					</div>
				</div>

				<div class="outcomes-list-wrapper" class:has-more={filteredMarkets.length > 5}>
					<div class="outcomes-list">
						{#if isMultiMarket}
							{#each filteredMarkets as market, index (market.id)}
								{@const marketData = parseMarketData(market)}
								<button
									class="outcome-row"
									class:selected={selectedMarketIndex === index}
									onclick={() => selectMarket(index)}
								>
									<div class="outcome-info">
										<span class="outcome-label">{getMarketDisplayTitle(market)}</span>
										{#if market.volume24hr}
											<span class="outcome-volume"
												>{formatNumber(market.volume24hr)} <span class="vol-label">Vol.</span></span
											>
										{/if}
									</div>
									<div class="outcome-odds">
										{#if marketData && marketData[0]}
											<span class="odds-value">{marketData[0].priceFormatted}%</span>
										{:else}
											<span class="odds-value">—</span>
										{/if}
									</div>
								</button>
							{/each}
						{:else if selectedMarketData}
							{#each selectedMarketData as outcome, index (index)}
								<button
									class="outcome-row"
									class:selected={selectedOutcome === index}
									onclick={() => (selectedOutcome = index)}
								>
									<div class="outcome-info">
										<span class="outcome-label">{outcome.label}</span>
									</div>
									<div class="outcome-odds">
										<span class="odds-value">{outcome.priceFormatted}%</span>
									</div>
								</button>
							{/each}
						{/if}
					</div>
					{#if filteredMarkets.length > 5}
						<div class="scroll-fade"></div>
					{/if}
				</div>
			</section>

			{#if event.description}
				<section class="rules-section">
					<div class="rules-header">
						<h2 class="section-title">Rules</h2>
					</div>
					<div class="rules-content" class:expanded={rulesExpanded}>
						<p class="rules-text">{#each parsedDescription as segment, i (i)}{#if segment.type === 'text'}{segment.content}{:else}<a
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
								>{/if}{/each}</p>
					</div>
					{#if event.description.length > 300}
						<button class="show-more-btn" onclick={() => (rulesExpanded = !rulesExpanded)}>
							{rulesExpanded ? 'Show less' : 'Show more'}
						</button>
					{/if}
				</section>
			{/if}

			<section class="tabs-section">
				<div class="tabs-header">
					<button
						class="tab-btn"
						class:active={activeTab === 'comments'}
						onclick={() => (activeTab = 'comments')}
					>
						<MessageTextIcon size={16} />
						<span>Comments</span>
					</button>
					<button
						class="tab-btn"
						class:active={activeTab === 'holders'}
						onclick={() => (activeTab = 'holders')}
					>
						<LeaderboardIcon size={16} />
						<span>Top Holders</span>
					</button>
					<button
						class="tab-btn"
						class:active={activeTab === 'activity'}
						onclick={() => (activeTab = 'activity')}
					>
						<FlashIcon size={16} />
						<span>Activity</span>
					</button>
				</div>

				<div class="tabs-content">
					{#if activeTab === 'comments'}
						<div class="tab-panel">
							{#if commentsQuery.isLoading}
								<div class="tab-loading">Loading comments...</div>
							{:else if commentsQuery.error}
								<div class="tab-error">Failed to load comments</div>
							{:else if commentsQuery.data && commentsQuery.data.length > 0}
								<div class="comments-list">
									{#each commentsQuery.data as comment (comment.id)}
										<div class="comment-item">
											<div class="comment-header">
												<div class="comment-avatar">
													{#if comment.profile?.profileImage}
														<img src={comment.profile.profileImage} alt="" />
													{:else}
														<div class="avatar-placeholder"></div>
													{/if}
												</div>
												<div class="comment-meta">
													<span class="comment-author">
														{comment.profile?.name ||
															comment.profile?.pseudonym ||
															'Anonymous'}
													</span>
													<span class="comment-time"
														>{formatRelativeTime(comment.createdAt)}</span
													>
												</div>
											</div>
											<p class="comment-body">{comment.body}</p>
										</div>
									{/each}
								</div>
							{:else}
								<div class="tab-empty">No comments yet</div>
							{/if}
						</div>
					{:else if activeTab === 'holders'}
						<div class="tab-panel">
							{#if holdersQuery.isLoading}
								<div class="tab-loading">Loading top holders...</div>
							{:else if holdersQuery.error}
								<div class="tab-error">Failed to load holders</div>
							{:else if holdersQuery.data && holdersQuery.data.length > 0}
								{@const allHolders = holdersQuery.data.flatMap(m => m.holders)}
								{@const yesHolders = allHolders.filter(h => h.outcomeIndex === 0).slice(0, 10)}
								{@const noHolders = allHolders.filter(h => h.outcomeIndex === 1).slice(0, 10)}
								<div class="holders-columns">
									<div class="holders-column">
										<div class="holders-table-header">
											<span class="holders-table-label yes">Yes</span>
											<span class="holders-table-label">Shares</span>
										</div>
										<div class="holders-list">
											{#each yesHolders as holder, index (holder.proxyWallet)}
												<div class="holder-item">
													<span class="holder-rank">#{index + 1}</span>
													<div class="holder-avatar">
														{#if holder.profileImage}
															<img src={holder.profileImage} alt="" />
														{:else}
															<div class="avatar-placeholder"></div>
														{/if}
													</div>
													<div class="holder-info">
														<span class="holder-name">
															{holder.name || holder.pseudonym || 'Anonymous'}
														</span>
													</div>
													<span class="holder-amount yes">{formatNumber(holder.amount)}</span>
												</div>
											{/each}
										</div>
									</div>
									<div class="holders-column">
										<div class="holders-table-header">
											<span class="holders-table-label no">No</span>
											<span class="holders-table-label">Shares</span>
										</div>
										<div class="holders-list">
											{#each noHolders as holder, index (holder.proxyWallet)}
												<div class="holder-item">
													<span class="holder-rank">#{index + 1}</span>
													<div class="holder-avatar">
														{#if holder.profileImage}
															<img src={holder.profileImage} alt="" />
														{:else}
															<div class="avatar-placeholder"></div>
														{/if}
													</div>
													<div class="holder-info">
														<span class="holder-name">
															{holder.name || holder.pseudonym || 'Anonymous'}
														</span>
													</div>
													<span class="holder-amount no">{formatNumber(holder.amount)}</span>
												</div>
											{/each}
										</div>
									</div>
								</div>
							{:else}
								<div class="tab-empty">No holders data available</div>
							{/if}
						</div>
					{:else if activeTab === 'activity'}
						<div class="tab-panel">
							<div class="tab-empty">Activity feed coming soon</div>
						</div>
					{/if}
				</div>
			</section>
		</div>

		<aside class="buy-card-container">
			<div class="buy-card">
				<div class="buy-card-header">
					{#if event.image}
						<div class="buy-card-icon">
							<img src={event.image} alt="" />
						</div>
					{/if}
					<span class="buy-card-title">
						{#if isMultiMarket && selectedMarket}
							{getMarketDisplayTitle(selectedMarket)}
						{:else}
							{event.title || 'Select Outcome'}
						{/if}
					</span>
				</div>

				{#if selectedMarketData}
					<div class="outcome-pills">
						{#each selectedMarketData as outcome, index (index)}
							<button
								class="outcome-pill"
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
				{/if}

				<div class="amount-section">
					<label class="amount-label" for="amount-input">Amount</label>
					<div class="amount-input-wrapper">
						<input
							id="amount-input"
							type="number"
							class="amount-input"
							placeholder="$0"
							min="0"
							step="1"
						/>
						<div class="quick-amounts">
							<button class="quick-amount">+$1</button>
							<button class="quick-amount">+$20</button>
							<button class="quick-amount">+$100</button>
							<button class="quick-amount">Max</button>
						</div>
					</div>
				</div>

				<button class="trade-button" disabled>Trade</button>

				<p class="terms-text">By trading, you agree to the <a href="/terms">Terms of Use</a></p>
			</div>
		</aside>
	</div>
</div>

<style>
	.event-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-lg) 12px;
	}

	/* Back Link */
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 6px 0;
		margin-bottom: var(--space-md);
		font-size: 14px;
		font-weight: 500;
		color: var(--text-2);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.back-link:hover {
		color: var(--primary);
	}

	.event-layout {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-xl);
	}

	/* ============================================
	   LEFT COLUMN - EVENT MAIN
	   ============================================ */

	.event-main {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	/* Header */
	.event-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.header-top {
		display: flex;
		align-items: flex-start;
		gap: var(--space-md);
	}

	.event-icon {
		flex-shrink: 0;
		width: 48px;
		height: 48px;
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
	}

	.event-icon img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.header-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.event-title {
		font-size: 24px;
		font-weight: 700;
		color: var(--text-0);
		line-height: 1.3;
		margin: 0;
	}

	/* Tags */
	.event-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.event-tag {
		display: inline-flex;
		padding: 4px 10px;
		font-size: 12px;
		font-weight: 500;
		color: var(--text-2);
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-sm);
	}

	/* Share Button */
	.share-btn {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		padding: 0;
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-sm);
		color: var(--text-2);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.share-btn:hover {
		color: var(--primary);
		border-color: var(--primary);
		background: var(--primary-hover-bg);
	}

	.share-btn.copied {
		color: var(--success);
		border-color: var(--success);
		background: rgba(0, 255, 136, 0.1);
	}

	.event-meta {
		display: flex;
		align-items: center;
		gap: var(--space-lg);
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--text-2);
	}

	.meta-value {
		font-weight: 600;
		color: var(--text-0);
	}

	.meta-label {
		font-size: 13px;
		color: var(--text-3);
	}

	/* Chart Section */
	.chart-section {
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-card);
		overflow: hidden;
	}

	.chart-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 300px;
		background: var(--bg-2);
	}

	.placeholder-text {
		font-size: 14px;
		color: var(--text-3);
	}

	/* Outcomes Section */
	.outcomes-section {
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-card);
		padding: var(--space-lg);
	}

	.outcomes-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-md);
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--bg-3);
	}

	.section-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-0);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin: 0;
	}

	.outcomes-header-right {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.scroll-hint {
		display: flex;
		align-items: center;
		color: var(--text-3);
		opacity: 0.7;
	}

	.outcomes-label {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-3);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.outcomes-list-wrapper {
		position: relative;
	}

	.outcomes-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		max-height: 280px;
		overflow-y: auto;
	}

	.scroll-fade {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 50px;
		background: linear-gradient(to bottom, transparent, var(--bg-1));
		pointer-events: none;
		border-radius: 0 0 var(--radius-sm) var(--radius-sm);
	}

	/* ============================================
	   RULES SECTION
	   ============================================ */

	.rules-section {
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-card);
		padding: var(--space-lg);
	}

	.rules-header {
		margin-bottom: var(--space-md);
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--bg-3);
	}

	.rules-content {
		max-height: 100px;
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
		padding: 2px 8px;
		background: var(--bg-2);
		border-radius: var(--radius-sm);
		color: var(--primary);
		text-decoration: none;
		font-size: 13px;
		font-weight: 500;
		transition: all var(--transition-fast);
		vertical-align: middle;
	}

	.rules-link:hover {
		background: var(--bg-3);
		color: var(--primary-hover);
	}

	.rules-link span {
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.show-more-btn {
		margin-top: var(--space-sm);
		padding: 0;
		font-size: 13px;
		font-weight: 500;
		color: var(--primary);
		background: none;
		border: none;
		cursor: pointer;
		transition: color var(--transition-fast);
	}

	.show-more-btn:hover {
		color: var(--primary-hover);
	}

	.outcome-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 14px;
		background: var(--bg-2);
		border: 2px solid transparent;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
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

	.outcome-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.outcome-label {
		font-size: 15px;
		font-weight: 500;
		color: var(--text-0);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.outcome-volume {
		font-size: 12px;
		color: var(--text-3);
	}

	.vol-label {
		font-size: 11px;
	}

	.outcome-odds {
		flex-shrink: 0;
	}

	.odds-value {
		font-size: 18px;
		font-weight: 700;
		color: var(--text-0);
	}

	/* ============================================
	   RIGHT COLUMN - BUY CARD
	   ============================================ */

	.buy-card-container {
		position: sticky;
		top: var(--space-lg);
		height: fit-content;
	}

	.buy-card {
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-card);
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.buy-card-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.buy-card-icon {
		width: 32px;
		height: 32px;
		border-radius: var(--radius-sm);
		overflow: hidden;
		background: var(--bg-2);
		flex-shrink: 0;
	}

	.buy-card-icon img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.buy-card-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-0);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Outcome Pills */
	.outcome-pills {
		display: flex;
		gap: 8px;
	}

	.outcome-pill {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 12px;
		background: var(--bg-2);
		border: 2px solid var(--bg-4);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.outcome-pill:hover {
		background: var(--bg-3);
	}

	.outcome-pill.selected.yes {
		border-color: var(--success);
		background: rgba(0, 196, 71, 0.1);
	}

	.outcome-pill.selected.no {
		border-color: var(--danger);
		background: rgba(255, 51, 102, 0.1);
	}

	.pill-label {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-0);
	}

	.pill-price {
		font-size: 14px;
		font-weight: 700;
		color: var(--text-0);
	}

	.outcome-pill.selected.yes .pill-price {
		color: var(--success);
	}

	.outcome-pill.selected.no .pill-price {
		color: var(--danger);
	}

	/* Amount Section */
	.amount-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.amount-label {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-2);
	}

	.amount-input-wrapper {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.amount-input {
		width: 100%;
		padding: 12px 14px;
		font-size: 24px;
		font-weight: 700;
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-sm);
		color: var(--text-0);
		outline: none;
		transition: border-color var(--transition-fast);
	}

	.amount-input:focus {
		border-color: var(--primary);
	}

	.amount-input::placeholder {
		color: var(--text-4);
	}

	.quick-amounts {
		display: flex;
		gap: 6px;
	}

	.quick-amount {
		flex: 1;
		padding: 8px;
		font-size: 12px;
		font-weight: 500;
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-sm);
		color: var(--text-1);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.quick-amount:hover {
		background: var(--bg-3);
		border-color: var(--primary);
	}

	/* Trade Button */
	.trade-button {
		width: 100%;
		padding: 14px;
		font-size: 16px;
		font-weight: 600;
		background: var(--primary);
		border: none;
		border-radius: var(--radius-sm);
		color: var(--bg-0);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.trade-button:hover:not(:disabled) {
		background: var(--primary-hover);
	}

	.trade-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.terms-text {
		font-size: 11px;
		color: var(--text-3);
		text-align: center;
		margin: 0;
	}

	.terms-text a {
		color: var(--primary);
		text-decoration: underline;
	}

	/* ============================================
	   TABS SECTION
	   ============================================ */

	.tabs-section {
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-card);
		overflow: hidden;
	}

	.tabs-header {
		display: flex;
		border-bottom: 1px solid var(--bg-3);
	}

	.tab-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 14px 12px;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-2);
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.tab-btn:hover {
		color: var(--text-0);
		background: var(--bg-2);
	}

	.tab-btn.active {
		color: var(--primary);
		border-bottom-color: var(--primary);
	}

	.tabs-content {
		padding: var(--space-md);
	}

	.tab-panel {
		min-height: 200px;
	}

	.tab-loading,
	.tab-error,
	.tab-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 150px;
		font-size: 14px;
		color: var(--text-3);
	}

	.tab-error {
		color: var(--danger);
	}

	/* Comments List */
	.comments-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		max-height: 400px;
		overflow-y: auto;
	}

	.comment-item {
		padding: var(--space-sm);
		background: var(--bg-2);
		border-radius: var(--radius-sm);
	}

	.comment-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: 8px;
	}

	.comment-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
	}

	.comment-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		background: var(--bg-4);
	}

	.comment-meta {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.comment-author {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-0);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.comment-time {
		font-size: 11px;
		color: var(--text-3);
	}

	.comment-body {
		font-size: 14px;
		line-height: 1.5;
		color: var(--text-1);
		margin: 0;
		word-wrap: break-word;
	}

	/* Holders Columns */
	.holders-columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
		min-width: 0;
	}

	.holders-column {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		min-width: 0;
		overflow: hidden;
	}

	.holders-table-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 10px 8px;
		border-bottom: 1px solid var(--bg-3);
		margin-bottom: 8px;
	}

	.holders-table-label {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-3);
	}

	.holders-table-label.yes {
		color: var(--success);
	}

	.holders-table-label.no {
		color: var(--danger);
	}

	/* Holders List */
	.holders-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-height: 350px;
		overflow-y: auto;
		min-width: 0;
	}

	.holder-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: 8px 10px;
		background: var(--bg-2);
		border-radius: var(--radius-sm);
		min-width: 0;
	}

	.holder-rank {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-3);
		min-width: 24px;
	}

	.holder-avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
	}

	.holder-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.holder-info {
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}

	.holder-name {
		display: block;
		font-size: 12px;
		font-weight: 500;
		color: var(--text-0);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.holder-amount {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-0);
	}

	.holder-amount.yes {
		color: var(--success);
	}

	.holder-amount.no {
		color: var(--danger);
	}

	/* ============================================
	   RESPONSIVE
	   ============================================ */

	@media (min-width: 768px) {
		.event-page {
			padding: var(--space-xl) 24px;
		}

		.event-title {
			font-size: 28px;
		}
	}

	@media (min-width: 1024px) {
		.event-layout {
			grid-template-columns: 1fr 340px;
		}
	}
</style>
