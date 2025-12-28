<script lang="ts">
	import type { PageData } from './$types';
	import type { Comment } from '$lib/server/api/polymarket-client';
	import type { TimeRange } from '$lib/utils/event-helpers';
	import { createQuery } from '@tanstack/svelte-query';
	import MessageTextIcon from '$lib/components/icons/MessageTextIcon.svelte';
	import EventHeader from '$lib/components/event/EventHeader.svelte';
	import ProbabilitySummary from '$lib/components/event/ProbabilitySummary.svelte';
	import PriceChartSection from '$lib/components/event/PriceChartSection.svelte';
	import AboutTab from '$lib/components/event/AboutTab.svelte';
	import CommentsTab from '$lib/components/event/CommentsTab.svelte';
	import OutcomesSidebar from '$lib/components/event/OutcomesSidebar.svelte';
	import OutcomeCard from '$lib/components/event/OutcomeCard.svelte';
	import {
		parseMarketData,
		isPlaceholderMarket,
		getMarketPrice,
		getMarketDisplayTitle,
		getClobTokenId,
		getSeriesColor,
		getIntervalForTimeRange,
		getFidelityForTimeRange
	} from '$lib/utils/event-helpers';
	import { parseTextWithUrls } from '$lib/utils/text-parser';

	let { data }: { data: PageData } = $props();

	const event = $derived(data.event);

	const filteredMarkets = $derived(
		(event.markets || [])
			.filter((market) => !isPlaceholderMarket(market))
			.sort((a, b) => getMarketPrice(b) - getMarketPrice(a))
	);

	const isMultiMarket = $derived(filteredMarkets.length > 1);
	let selectedMarketIndex = $state(0);
	const selectedMarket = $derived(filteredMarkets[selectedMarketIndex] || null);
	const selectedMarketData = $derived(selectedMarket ? parseMarketData(selectedMarket) : null);
	type TabType = 'outcomes' | 'about' | 'comments';
	let activeTab = $state<TabType>(
		typeof window !== 'undefined' && window.innerWidth < 768 ? 'outcomes' : 'about'
	);
	let selectedTimeRange = $state<TimeRange>('MAX');

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

	interface PriceHistoryResponse {
		history: Array<{ t: number; p: number }>;
	}

	const top3Markets = $derived(filteredMarkets.slice(0, 3));

	const priceHistoryQueries = $derived(
		top3Markets.map((market) => {
			const tokenId = getClobTokenId(market);
			return createQuery<PriceHistoryResponse>(() => ({
				queryKey: ['priceHistory', tokenId, selectedTimeRange],
				queryFn: async () => {
					if (!tokenId) throw new Error('No token ID available');

					// eslint-disable-next-line svelte/prefer-svelte-reactivity
					const params = new URLSearchParams({
						market: tokenId,
						interval: getIntervalForTimeRange(selectedTimeRange)
					});

					const fidelity = getFidelityForTimeRange(selectedTimeRange);
					if (fidelity !== undefined) {
						params.set('fidelity', fidelity.toString());
					}

					const response = await fetch(`/api/prices/history?${params}`);
					if (!response.ok) throw new Error('Failed to fetch price history');
					return response.json();
				},
				enabled: !!tokenId
			}));
		})
	);

	const chartSeries = $derived(
		priceHistoryQueries.map((query, index) => ({
			name: getMarketDisplayTitle(top3Markets[index]),
			color: getSeriesColor(index),
			data: query.data?.history ?? []
		}))
	);

	const isAnyLoading = $derived(priceHistoryQueries.some((q) => q.isPending));
	const anyError = $derived(priceHistoryQueries.find((q) => q.error)?.error?.message ?? null);

	const parsedDescription = $derived(event.description ? parseTextWithUrls(event.description) : []);
</script>

<svelte:head>
	<title>{event.title || 'Event'} | Glitch Markets</title>
</svelte:head>

<div class="event-page">
	<EventHeader title={event.title || 'Untitled Event'} image={event.image} />

	<!-- Main Content -->
	<div class="content-grid">
		<!-- Left Column -->
		<main class="main-content">
			<ProbabilitySummary markets={filteredMarkets} {isMultiMarket} {selectedMarketData} />

			<PriceChartSection
				series={chartSeries}
				loading={isAnyLoading}
				error={anyError}
				{selectedTimeRange}
				onTimeRangeChange={(range) => (selectedTimeRange = range)}
			/>

			<!-- Tabs -->
			<section class="tabs-section">
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
								{#each filteredMarkets as market (market.id)}
									{@const marketData = parseMarketData(market)}
									{#if marketData}
										<OutcomeCard
											name={getMarketDisplayTitle(market)}
											volume={Number(market.volume) || 0}
											outcomeData={marketData}
										/>
									{/if}
								{/each}
							{:else if selectedMarketData}
								<OutcomeCard
									name={selectedMarket?.question || 'Unknown'}
									volume={Number(selectedMarket?.volume) || 0}
									outcomeData={selectedMarketData}
									showBetButtons={selectedMarketData.length === 1}
								/>
							{/if}
						</div>
					{:else if activeTab === 'about'}
						<AboutTab
							description={event.description}
							{parsedDescription}
							endDate={event.endDate ?? null}
							volume={event.volume ? Number(event.volume) : null}
						/>
					{:else if activeTab === 'comments'}
						<CommentsTab comments={commentsQuery.data} isLoading={commentsQuery.isLoading} />
					{/if}
				</div>
			</section>
		</main>

		<OutcomesSidebar
			markets={filteredMarkets}
			{isMultiMarket}
			{selectedMarket}
			{selectedMarketData}
		/>
	</div>
</div>

<style>
	.event-page {
		max-width: 1400px;
		margin: 0 auto;
		padding: var(--spacing-3);
		padding-bottom: 80px;
	}

	.content-grid {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4);
	}

	.main-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3);
	}

	.tabs-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4);
	}

	.tabs-header {
		display: flex;
		border-bottom: 1px solid var(--bg-3);
		gap: var(--spacing-1);
	}

	.tab {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 14px var(--spacing-2);
		font-size: 14px;
		font-weight: 600;
		color: var(--text-2);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		transition:
			color var(--transition-fast),
			border-bottom-color var(--transition-fast);
	}

	@media (hover: hover) {
		.tab:hover {
			color: var(--text-0);
		}
	}

	.tab.active {
		color: var(--primary);
		border-bottom-color: var(--primary);
	}

	.tab-content {
		min-height: 150px;
	}

	.outcomes-grid {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3);
	}

	.mobile-only {
		display: block;
	}

	@media (min-width: 768px) {
		.event-page {
			padding: var(--spacing-6);
			padding-bottom: var(--spacing-12);
		}

		.mobile-only {
			display: none;
		}

		.content-grid {
			display: grid;
			grid-template-columns: 1fr 380px;
			gap: var(--spacing-6);
			align-items: start;
		}

		.main-content {
			gap: var(--spacing-4);
		}
	}

	@media (min-width: 1024px) {
		.content-grid {
			grid-template-columns: 1fr 420px;
		}
	}
</style>
