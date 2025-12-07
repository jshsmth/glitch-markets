<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys } from '$lib/query/client';
	import EventList from '$lib/components/events/EventList.svelte';
	import FilterBar from '$lib/components/filters/FilterBar.svelte';
	import type { Event } from '$lib/server/api/polymarket-client';
	import { browser } from '$app/environment';

	const PAGE_SIZE = 20;
	let offset = $state(0);
	let allEvents = $state<Event[]>([]);
	let hasMore = $state(true);
	let currentSort = $state('volume24hr');

	const query = createQuery<Event[]>(() => ({
		queryKey: [...queryKeys.events.all, offset, currentSort],
		queryFn: async () => {
			const params = new URLSearchParams({
				limit: PAGE_SIZE.toString(),
				active: 'true',
				archived: 'false',
				closed: 'false',
				order: currentSort,
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

	$effect(() => {
		if (browser && query.data) {
			if (offset === 0) {
				allEvents = query.data;
			} else {
				allEvents = [...allEvents, ...query.data];
			}
			hasMore = query.data.length === PAGE_SIZE;
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
			query.refetch();
		}
	}

	function handleSortChange(sort: string) {
		currentSort = sort;
		offset = 0;
		allEvents = [];
		hasMore = true;
	}

	// Get isPending and error safely
	const isPending = $derived(browser ? query.isPending : false);
	const error = $derived(browser ? (query.error as Error | null) : null);
</script>

<div class="page-container">
	<div class="filter-container">
		<FilterBar {currentSort} onSortChange={handleSortChange} />
	</div>

	<EventList
		events={allEvents}
		loading={isPending}
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

	.filter-container {
		display: flex;
		justify-content: flex-end;
		margin-bottom: var(--space-lg);
	}
</style>
