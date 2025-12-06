<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import EventList from '$lib/components/events/EventList.svelte';
	import SubcategoryNav from '$lib/components/navigation/SubcategoryNav.svelte';
	import FilterBar from '$lib/components/filters/FilterBar.svelte';
	import type { Event, Tag } from '$lib/server/api/polymarket-client';

	// Internal state (not URL-based, like Polymarket)
	let selectedTag = $state<string | null>(null); // null = "All"
	let status = $state<'active' | 'closed' | 'all'>('active');
	let sort = $state<string>('volume24hr');

	// Determine tag_slug to use
	let tag_slug = $derived(selectedTag || 'economy');

	// Determine active/closed based on status
	// For "active": active=true, closed=false
	// For "closed": active=false, closed=true
	// For "all": don't send active or closed params (let API return everything)
	let active = $derived(
		status === 'active' ? 'true' : status === 'closed' ? 'false' : undefined
	);
	let closed = $derived(status === 'closed' ? 'true' : status === 'active' ? 'false' : undefined);

	// State for infinite scroll
	let offset = $state(0);
	let allEvents = $state<Event[]>([]);
	let hasMore = $state(true);
	let previousFilterKey = $state('');

	// Create a filter key to detect when filters change
	let currentFilterKey = $derived(`${tag_slug}-${status}-${sort}`);

	// Reset offset when filters change using $effect
	$effect(() => {
		if (previousFilterKey !== '' && currentFilterKey !== previousFilterKey) {
			offset = 0;
			allEvents = [];
			hasMore = true;
		}
		previousFilterKey = currentFilterKey;
	});

	// Handlers for filter changes
	function handleTagChange(newTag: string | null) {
		selectedTag = newTag;
	}

	function handleStatusChange(newStatus: 'active' | 'closed' | 'all') {
		status = newStatus;
	}

	function handleSortChange(newSort: string) {
		sort = newSort;
	}

	// Fetch subcategories (related tags)
	const subcategoriesQuery = createQuery(() => ({
		queryKey: ['tags', 'economy', 'related'],
		queryFn: async () => {
			const res = await fetch('/api/tags/slug/economy/related');

			if (!res.ok) {
				throw new Error(`Failed to fetch subcategories: ${res.statusText}`);
			}

			return res.json() as Promise<Tag[]>;
		}
	}));

	// Create derived query that reacts to filter changes
	let eventsQuery = $derived(
		createQuery(() => ({
			queryKey: ['events', 'economy', tag_slug, status, sort, offset],
			queryFn: async () => {
				const params: Record<string, string> = {
					tag_slug,
					archived: 'false',
					order: sort,
					ascending: 'false',
					limit: '20',
					offset: String(offset)
				};

				// Only add active/closed if they're defined (not for "all" status)
				if (active !== undefined) params.active = active;
				if (closed !== undefined) params.closed = closed;

				const searchParams = new URLSearchParams(params);

				const res = await fetch(`/api/events?${searchParams}`);

				if (!res.ok) {
					throw new Error(`Failed to fetch events: ${res.statusText}`);
				}

				const newEvents = (await res.json()) as Event[];

				return newEvents;
			}
		}))
	);

	// Update allEvents when query data changes
	$effect(() => {
		const data = eventsQuery.data;
		if (!data) return;

		// If we got less than 20 events, we've reached the end
		if (data.length < 20) {
			hasMore = false;
		} else {
			hasMore = true;
		}

		// Append new events to the list if offset > 0, otherwise replace
		if (offset === 0) {
			allEvents = data;
		} else {
			allEvents = [...allEvents, ...data];
		}
	});

	async function loadMore() {
		if (!hasMore || eventsQuery.isLoading) return;
		offset += 20;
	}
</script>

<div class="page-container">
	<div class="page-header">
		<h1>Economy</h1>
	</div>

	<!-- Subcategory Navigation -->
	<SubcategoryNav
		subcategories={subcategoriesQuery.data || []}
		activeSlug={selectedTag}
		onTagChange={handleTagChange}
	/>

	<!-- Filters -->
	<FilterBar
		currentStatus={status}
		currentSort={sort}
		onStatusChange={handleStatusChange}
		onSortChange={handleSortChange}
	/>

	<!-- Event List -->
	<div class="content">
		<EventList
			events={allEvents}
			loading={eventsQuery.isLoading && offset === 0}
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

	.page-header {
		margin-bottom: var(--space-lg);
	}

	h1 {
		font-size: var(--h1-size);
		font-weight: var(--h1-weight);
		letter-spacing: var(--h1-tracking);
		color: var(--text-0);
		margin: 0 0 var(--space-xs) 0;
	}

	.page-description {
		font-size: 16px;
		color: var(--text-2);
		margin: 0;
	}
</style>
