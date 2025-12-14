<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys } from '$lib/query/client';
	import EventList from '$lib/components/events/EventList.svelte';
	import WatchlistSection from '$lib/components/events/WatchlistSection.svelte';
	import type { Event } from '$lib/server/api/polymarket-client';
	import { browser } from '$app/environment';
	import { untrack } from 'svelte';

	const PAGE_SIZE = 20;
	const MAX_EVENTS = 200; // Cap at 200 events to prevent unbounded memory growth
	let offset = $state(0);
	let allEvents = $state<Event[]>([]);
	let hasMore = $state(true);
	let isInitialLoad = $state(true);

	const query = createQuery<Event[]>(() => ({
		queryKey: [...queryKeys.events.all, offset],
		queryFn: async () => {
			const params = new URLSearchParams({
				limit: PAGE_SIZE.toString(),
				active: 'true',
				archived: 'false',
				closed: 'false',
				order: 'volume24hr',
				ascending: 'false',
				offset: offset.toString()
			});

			const response = await fetch(`/api/events?${params.toString()}`);
			if (!response.ok) {
				throw new Error('Failed to fetch trending events');
			}
			const data = await response.json();
			return data;
		}
	}));

	let lastProcessedOffset = -1;

	$effect(() => {
		const currentOffset = offset;
		const data = query.data;

		if (browser && data && currentOffset !== lastProcessedOffset) {
			untrack(() => {
				lastProcessedOffset = currentOffset;

				if (currentOffset === 0) {
					allEvents = data;
				} else {
					allEvents = allEvents.concat(data);
				}

				if (allEvents.length >= MAX_EVENTS) {
					hasMore = false;
				} else {
					hasMore = data.length === PAGE_SIZE;
				}

				isInitialLoad = false;
			});
		}
	});

	function handleLoadMore() {
		if (browser && !query.isFetching && hasMore) {
			offset += PAGE_SIZE;
		}
	}

	function handleRetry() {
		if (browser) {
			offset = 0;
			allEvents = [];
			hasMore = true;
			lastProcessedOffset = -1;
			query.refetch();
		}
	}

	const error = $derived(browser ? (query.error as Error | null) : null);
</script>

<div class="page-container">
	<WatchlistSection />
	<EventList
		events={allEvents}
		loading={isInitialLoad}
		error={error as Error}
		onRetry={handleRetry}
		onLoadMore={handleLoadMore}
		{hasMore}
	/>
</div>

<style>
	.page-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: var(--space-lg) 12px;
	}

	@media (min-width: 768px) {
		.page-container {
			padding: var(--space-lg) 24px;
		}
	}
</style>
