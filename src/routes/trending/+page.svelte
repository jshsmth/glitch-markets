<script lang="ts">
	import { createInfiniteQuery } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import EventList from '$lib/components/events/EventList.svelte';
	import FilterBar from '$lib/components/filters/FilterBar.svelte';
	import type { Event } from '$lib/server/api/polymarket-client';

	let { data } = $props();

	let currentSort = $state<string>('volume24hr');

	$effect(() => {
		if (data?.initialSort) {
			currentSort = data.initialSort;
		}
	});

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
		initialPageParam: 0,
		initialData:
			data?.initialEvents?.length > 0
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

	function handleSortChange(sort: string) {
		currentSort = sort;
		const url = new URL($page.url);
		url.searchParams.set('order', sort);
		goto(url.toString(), { replaceState: true, noScroll: true });
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
