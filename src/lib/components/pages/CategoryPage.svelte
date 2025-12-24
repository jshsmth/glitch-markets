<script lang="ts">
	import { createInfiniteQuery, createQuery } from '@tanstack/svelte-query';
	import EventList from '$lib/components/events/EventList.svelte';
	import SubcategoryNav from '$lib/components/navigation/SubcategoryNav.svelte';
	import type { Event, Tag } from '$lib/server/api/polymarket-client';

	interface Props {
		categorySlug: string;
		categoryTitle: string;
	}

	let { categorySlug, categoryTitle }: Props = $props();

	let selectedTag = $state<string | null>(null);
	let status = $state<'active' | 'closed' | 'all'>('active');
	let sort = $state<string>('volume24hr');
	let volumeMin = $state<number | undefined>(undefined);
	let volumeMax = $state<number | undefined>(undefined);
	let liquidityMin = $state<number | undefined>(undefined);
	let liquidityMax = $state<number | undefined>(undefined);
	let startDateMin = $state<string | undefined>(undefined);
	let startDateMax = $state<string | undefined>(undefined);
	let endDateMin = $state<string | undefined>(undefined);
	let endDateMax = $state<string | undefined>(undefined);

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

	function handleVolumeChange(min: number | undefined, max: number | undefined) {
		volumeMin = min;
		volumeMax = max;
	}

	function handleLiquidityChange(min: number | undefined, max: number | undefined) {
		liquidityMin = min;
		liquidityMax = max;
	}

	function handleDateRangeChange(
		sMin: string | undefined,
		sMax: string | undefined,
		eMin: string | undefined,
		eMax: string | undefined
	) {
		startDateMin = sMin;
		startDateMax = sMax;
		endDateMin = eMin;
		endDateMax = eMax;
	}

	const subcategoriesQuery = createQuery(() => ({
		queryKey: ['tags', categorySlug, 'related'],
		queryFn: async () => {
			const res = await fetch(`/api/tags/slug/${categorySlug}/related`);

			if (!res.ok) {
				throw new Error(`Failed to fetch subcategories: ${res.statusText}`);
			}

			return res.json() as Promise<Tag[]>;
		}
	}));

	const eventsQuery = createInfiniteQuery(() => ({
		queryKey: [
			'events',
			categorySlug,
			tag_slug,
			status,
			sort,
			volumeMin,
			volumeMax,
			liquidityMin,
			liquidityMax,
			startDateMin,
			startDateMax,
			endDateMin,
			endDateMax
		],
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
			if (volumeMin !== undefined) params.volume_min = String(volumeMin);
			if (volumeMax !== undefined) params.volume_max = String(volumeMax);
			if (liquidityMin !== undefined) params.liquidity_min = String(liquidityMin);
			if (liquidityMax !== undefined) params.liquidity_max = String(liquidityMax);
			if (startDateMin !== undefined) params.start_date_min = startDateMin;
			if (startDateMax !== undefined) params.start_date_max = startDateMax;
			if (endDateMin !== undefined) params.end_date_min = endDateMin;
			if (endDateMax !== undefined) params.end_date_max = endDateMax;

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
		bind:volumeMin
		bind:volumeMax
		bind:liquidityMin
		bind:liquidityMax
		bind:startDateMin
		bind:startDateMax
		bind:endDateMin
		bind:endDateMax
		onVolumeChange={handleVolumeChange}
		onLiquidityChange={handleLiquidityChange}
		onDateRangeChange={handleDateRangeChange}
		showAdvanced={true}
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
