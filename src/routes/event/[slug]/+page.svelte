<script lang="ts">
	import type { PageData } from './$types';
	import type { Market } from '$lib/server/api/polymarket-client';
	import MoneyIcon from '$lib/components/icons/MoneyIcon.svelte';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
	import ScrollIcon from '$lib/components/icons/ScrollIcon.svelte';

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

	// Filter out placeholder markets (Person X, Candidate X, Other, etc.)
	function isPlaceholderMarket(market: Market): boolean {
		const title = getMarketDisplayTitle(market);
		// Match placeholder patterns:
		// - "Person X" where X is a single letter
		// - "Candidate X" where X is a single letter
		// - "Other" exactly
		return /^(Person|Candidate) [A-Z]$/i.test(title) || /^Other$/i.test(title);
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

	// Handle market selection
	function selectMarket(index: number) {
		selectedMarketIndex = index;
		selectedOutcome = 0; // Reset outcome selection when market changes
	}
</script>

<svelte:head>
	<title>{event.title || 'Event'} | Glitch Markets</title>
</svelte:head>

<div class="event-page">
	<div class="event-layout">
		<!-- Left Column: Event Details -->
		<div class="event-main">
			<!-- Header -->
			<header class="event-header">
				<div class="header-top">
					{#if event.image}
						<div class="event-icon">
							<img src={event.image} alt="" />
						</div>
					{/if}
					<h1 class="event-title">{event.title || 'Untitled Event'}</h1>
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

			<!-- Chart Placeholder -->
			<div class="chart-section">
				<div class="chart-placeholder">
					<span class="placeholder-text">Chart coming soon</span>
				</div>
			</div>

			<!-- Outcomes Section -->
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
							<!-- Multi-market: Show all markets as selectable options -->
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
							<!-- Binary market: Show outcomes -->
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
		</div>

		<!-- Right Column: Buy Card -->
		<aside class="buy-card-container">
			<div class="buy-card">
				<!-- Market Title -->
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

				<!-- Outcome Selection Pills -->
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

				<!-- Amount Input -->
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

				<!-- Trade Button -->
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

	.event-title {
		font-size: 24px;
		font-weight: 700;
		color: var(--text-0);
		line-height: 1.3;
		margin: 0;
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
