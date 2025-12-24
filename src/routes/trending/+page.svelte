<script lang="ts">
	import EventList from '$lib/components/events/EventList.svelte';
	import FilterBar from '$lib/components/filters/FilterBar.svelte';
	import { useInfiniteEvents } from '$lib/composables/use-infinite-events.svelte';

	const state = useInfiniteEvents({
		buildParams: (_offset, sort) => {
			const params = new URLSearchParams({
				active: 'true',
				archived: 'false',
				closed: 'false',
				order: sort || 'volume24hr',
				ascending: 'false'
			});
			return params;
		},
		sort: 'volume24hr',
		enableSort: true
	});
</script>

<div class="page-container">
	<div class="filter-container">
		<FilterBar currentSort={state.currentSort} onSortChange={state.handleSortChange} />
	</div>

	<EventList
		events={state.events}
		loading={state.isLoading}
		error={state.error}
		onRetry={state.handleRetry}
		onLoadMore={state.handleLoadMore}
		hasMore={state.hasMore}
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
