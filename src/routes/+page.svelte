<script lang="ts">
	import EventList from '$lib/components/events/EventList.svelte';
	import WatchlistSection from '$lib/components/events/WatchlistSection.svelte';
	import { useInfiniteEvents } from '$lib/composables/use-infinite-events.svelte';

	const state = useInfiniteEvents({
		buildParams: () => {
			const params = new URLSearchParams({
				active: 'true',
				archived: 'false',
				closed: 'false',
				order: 'volume24hr',
				ascending: 'false'
			});
			return params;
		}
	});
</script>

<div class="page-container">
	<WatchlistSection />
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
</style>
