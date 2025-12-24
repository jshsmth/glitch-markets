<script lang="ts">
	import { createInfiniteQuery, createQuery } from '@tanstack/svelte-query';
	import EventList from '$lib/components/events/EventList.svelte';
	import SubcategoryNav from '$lib/components/navigation/SubcategoryNav.svelte';
	import type { Event, Tag } from '$lib/server/api/polymarket-client';

	interface Props {
		categorySlug: string;
		categoryTitle: string;
		initialEvents?: Event[];
		subcategories?: Tag[];
	}

	let { categorySlug, categoryTitle, initialEvents = [], subcategories = [] }: Props = $props();

	let selectedTag = $state<string | null>(null);
	let status = $state<'active' | 'closed' | 'all'>('active');
	let sort = $state<string>('volume24hr');

	let tag_slug = $derived(selectedTag || categorySlug);
	let active = $derived(status === 'all' ? undefined : 'true');
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
		queryKey: ['tags', categorySlug, 'related'],
		queryFn: async () => {
			const res = await fetch(`/api/tags/slug/${categorySlug}/related`);

			if (!res.ok) {
				throw new Error(`Failed to fetch subcategories: ${res.statusText}`);
			}

			return res.json() as Promise<Tag[]>;
		},
		initialData: subcategories?.length > 0 ? subcategories : undefined
	}));

	const shouldUseInitialData = $derived(
		tag_slug === categorySlug &&
			status === 'active' &&
			sort === 'volume24hr' &&
			initialEvents?.length > 0
	);

	const eventsQuery = createInfiniteQuery(() => ({
		queryKey: ['events', categorySlug, tag_slug, status, sort],
		queryFn: async ({ pageParam = 0 }) => {
			const params: Record<string, string> = {
				tag_slug,
				archived: 'false',
				order: status === 'closed' ? 'closedTime' : sort,
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
		initialPageParam: 0,
		initialData: shouldUseInitialData
			? {
					pages: [initialEvents],
					pageParams: [0]
				}
			: undefined
	}));

	let allEvents = $derived(eventsQuery.data?.pages.flat() ?? []);
	let hasMore = $derived(eventsQuery.hasNextPage ?? false);
	let isInitialLoading = $derived(eventsQuery.isPending);

	async function loadMore() {
		if (eventsQuery.hasNextPage && !eventsQuery.isFetchingNextPage) {
			await eventsQuery.fetchNextPage();
		}
	}
</script>

<div class="page-container compact">
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
			loading={isInitialLoading}
			error={eventsQuery.error}
			onRetry={() => eventsQuery.refetch()}
			{hasMore}
			onLoadMore={loadMore}
			title={categoryTitle}
		/>
	</div>
</div>

<style>
	.page-container.compact {
		padding-top: var(--space-md);
	}

	@media (min-width: 768px) {
		.page-container.compact {
			padding-top: var(--space-lg);
		}
	}
</style>
