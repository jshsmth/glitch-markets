<script lang="ts">
	import { createInfiniteQuery } from '@tanstack/svelte-query';
	import EventList from '$lib/components/events/EventList.svelte';
	import FilterBar from '$lib/components/filters/FilterBar.svelte';
	import type { Event } from '$lib/server/api/polymarket-client';

	let currentSort = $state('volume24hr');

	const eventsQuery = createInfiniteQuery(() => ({
		queryKey: ['events', 'trending', currentSort],
		queryFn: async ({ pageParam = 0 }) => {
			const params = new URLSearchParams({
				active: 'true',
				archived: 'false',
				closed: 'false',
				order: currentSort,
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
		initialPageParam: 0
	}));

	const allEvents = $derived(eventsQuery.data?.pages.flat() ?? []);
	const hasMore = $derived(eventsQuery.hasNextPage ?? false);
	const isInitialLoading = $derived(eventsQuery.isPending);

	async function loadMore() {
		if (eventsQuery.hasNextPage && !eventsQuery.isFetchingNextPage) {
			await eventsQuery.fetchNextPage();
		}
	}

	function handleSortChange(sort: string) {
		currentSort = sort;
	}
</script>

<div class="page-container">
	<div class="filter-container">
		<FilterBar {currentSort} onSortChange={handleSortChange} />
	</div>

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

	.filter-container {
		display: flex;
		justify-content: flex-end;
		margin-bottom: var(--space-lg);
	}
</style>
