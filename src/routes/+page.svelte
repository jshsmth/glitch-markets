<script lang="ts">
	import { createInfiniteQuery } from '@tanstack/svelte-query';
	import EventList from '$lib/components/events/EventList.svelte';
	import WatchlistSection from '$lib/components/events/WatchlistSection.svelte';
	import type { Event } from '$lib/server/api/polymarket-client';

	let { data } = $props();

	const eventsQuery = createInfiniteQuery(() => ({
		queryKey: ['events', 'trending'],
		queryFn: async ({ pageParam = 0 }) => {
			const params = new URLSearchParams({
				active: 'true',
				archived: 'false',
				closed: 'false',
				order: 'volume24hr',
				ascending: 'false',
				limit: '20',
				offset: String(pageParam)
			});

			const response = await fetch(`/api/events?${params}`);
			if (!response.ok) {
				throw new Error('Failed to fetch events');
			}
			return (await response.json()) as Event[];
		},
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage.length < 20) return undefined;
			return allPages.length * 20;
		},
		initialPageParam: 0,
		initialData:
			data.initialEvents && data.initialEvents.length > 0
				? {
						pages: [data.initialEvents],
						pageParams: [0]
					}
				: undefined
	}));

	const allEvents = $derived(eventsQuery.data?.pages.flat() ?? []);
	const hasMore = $derived(eventsQuery.hasNextPage ?? false);
	const isInitialLoading = $derived(eventsQuery.isPending);

	async function loadMore() {
		if (eventsQuery.hasNextPage && !eventsQuery.isFetchingNextPage) {
			await eventsQuery.fetchNextPage();
		}
	}
</script>

<div class="page-container">
	<WatchlistSection />
	<EventList
		events={allEvents}
		loading={isInitialLoading}
		error={eventsQuery.error}
		onRetry={() => eventsQuery.refetch()}
		onLoadMore={loadMore}
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
