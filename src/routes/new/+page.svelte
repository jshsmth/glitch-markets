<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys } from '$lib/query/client';
	import EventList from '$lib/components/events/EventList.svelte';
	import type { Event } from '$lib/server/api/polymarket-client';
	import { browser } from '$app/environment';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	const PAGE_SIZE = 20;
	let offset = $state(0);
	let allEvents = $state<Event[]>([]);
	let hasMore = $state(true);
	let isInitialLoad = $state(true);

	const query = createQuery<Event[]>(() => ({
		queryKey: [...queryKeys.events.all, offset],
		queryFn: async () => {
			const params = new SvelteURLSearchParams({
				limit: PAGE_SIZE.toString(),
				active: 'true',
				archived: 'false',
				closed: 'false',
				order: 'startDate',
				ascending: 'false',
				offset: offset.toString()
			});

			params.append('exclude_tag_id', '100639');
			params.append('exclude_tag_id', '102169');

			const response = await fetch(`/api/events?${params.toString()}`);
			if (!response.ok) {
				throw new Error('Failed to fetch new events');
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
			isInitialLoad = false;
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

	// Get error safely
	const error = $derived(browser ? (query.error as Error | null) : null);
</script>

<div class="page-container">
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
