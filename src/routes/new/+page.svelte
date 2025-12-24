<script lang="ts">
	import { createInfiniteQuery } from '@tanstack/svelte-query';
	import EventList from '$lib/components/events/EventList.svelte';
	import type { Event } from '$lib/server/api/polymarket-client';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	let { data } = $props();

	let resolvedCategoryData = $state<{ initialEvents: Event[] } | null>(null);

	$effect(() => {
		Promise.resolve(data.categoryData).then((categoryData) => {
			resolvedCategoryData = categoryData;
		});
	});

	const eventsQuery = createInfiniteQuery(() => ({
		queryKey: ['events', 'new'],
		queryFn: async ({ pageParam = 0 }) => {
			const params = new SvelteURLSearchParams({
				active: 'true',
				archived: 'false',
				closed: 'false',
				order: 'startDate',
				ascending: 'false',
				limit: '20',
				offset: String(pageParam)
			});

			params.append('exclude_tag_id', '100639');
			params.append('exclude_tag_id', '102169');

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
			resolvedCategoryData && resolvedCategoryData.initialEvents.length > 0
				? {
						pages: [resolvedCategoryData.initialEvents],
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
	<EventList
		events={allEvents}
		loading={resolvedCategoryData === null && isInitialLoading}
		error={eventsQuery.error}
		onRetry={() => eventsQuery.refetch()}
		onLoadMore={loadMore}
		{hasMore}
		title="New Markets"
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
