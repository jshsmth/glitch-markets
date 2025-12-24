<script lang="ts">
	import EventList from '$lib/components/events/EventList.svelte';
	import { useInfiniteEvents } from '$lib/composables/use-infinite-events.svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	const state = useInfiniteEvents({
		buildParams: () => {
			const params = new SvelteURLSearchParams({
				active: 'true',
				archived: 'false',
				closed: 'false',
				order: 'startDate',
				ascending: 'false'
			});

			params.append('exclude_tag_id', '100639');
			params.append('exclude_tag_id', '102169');

			return params;
		}
	});
</script>

<div class="page-container">
	<EventList
		events={state.events}
		loading={state.isLoading}
		error={state.error}
		onRetry={state.handleRetry}
		onLoadMore={state.handleLoadMore}
		hasMore={state.hasMore}
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
