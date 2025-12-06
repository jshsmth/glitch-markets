<script lang="ts">
	import { createInfiniteQuery, createQuery } from '@tanstack/svelte-query';
	import EventList from '$lib/components/events/EventList.svelte';
	import SubcategoryNav from '$lib/components/navigation/SubcategoryNav.svelte';
	import type { Event, Tag } from '$lib/server/api/polymarket-client';

	let selectedTag = $state<string | null>(null);
	let status = $state<'active' | 'closed' | 'all'>('active');
	let sort = $state<string>('volume24hr');

	let tag_slug = $derived(selectedTag || 'world');
	let active = $derived(status === 'active' ? 'true' : status === 'closed' ? 'false' : undefined);
	let closed = $derived(status === 'closed' ? 'true' : status === 'active' ? 'false' : undefined);

	function handleTagChange(newTag: string | null) {
		selectedTag = newTag;
	}

	function handleStatusChange(newStatus: 'active' | 'closed' | 'all') {
		status = newStatus;
	}

	function handleSortChange(newSort: string) {
		sort = newSort;
	}

	const subcategoriesQuery = createQuery(() => ({
		queryKey: ['tags', 'world', 'related'],
		queryFn: async () => {
			const res = await fetch('/api/tags/slug/world/related');

			if (!res.ok) {
				throw new Error(`Failed to fetch subcategories: ${res.statusText}`);
			}

			return res.json() as Promise<Tag[]>;
		}
	}));

	const eventsQuery = createInfiniteQuery(() => ({
		queryKey: ['events', 'world', tag_slug, status, sort],
		queryFn: async ({ pageParam = 0 }) => {
			const params: Record<string, string> = {
				tag_slug,
				archived: 'false',
				order: sort,
				ascending: 'false',
				limit: '20',
				offset: String(pageParam)
			};

			if (active !== undefined) params.active = active;
			if (closed !== undefined) params.closed = closed;

			const searchParams = new URLSearchParams(params);
			const res = await fetch(`/api/events?${searchParams}`);

			if (!res.ok) {
				throw new Error(`Failed to fetch events: ${res.statusText}`);
			}

			return (await res.json()) as Event[];
		},
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage.length < 20) return undefined;
			return allPages.length * 20;
		},
		initialPageParam: 0
	}));

	let allEvents = $derived(eventsQuery.data?.pages.flat() ?? []);
	let hasMore = $derived(eventsQuery.hasNextPage ?? false);

	async function loadMore() {
		if (eventsQuery.hasNextPage && !eventsQuery.isFetchingNextPage) {
			await eventsQuery.fetchNextPage();
		}
	}
</script>

<div class="page-container">
	<SubcategoryNav
		subcategories={subcategoriesQuery.data || []}
		activeSlug={selectedTag}
		onTagChange={handleTagChange}
		currentStatus={status}
		currentSort={sort}
		onStatusChange={handleStatusChange}
		onSortChange={handleSortChange}
	/>

	<div class="content">
		<EventList
			events={allEvents}
			loading={eventsQuery.isLoading}
			error={eventsQuery.error}
			onRetry={() => eventsQuery.refetch()}
			{hasMore}
			onLoadMore={loadMore}
		/>
	</div>
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
