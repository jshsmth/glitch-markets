<script lang="ts">
	import CategoryPage from '$lib/components/pages/CategoryPage.svelte';
	import type { Event, Tag } from '$lib/server/api/polymarket-client';

	let { data } = $props();

	let initialEvents = $state<Event[]>([]);
	let subcategories = $state<Tag[]>([]);

	$effect(() => {
		Promise.resolve(data.categoryData).then((categoryData) => {
			initialEvents = categoryData.initialEvents;
			subcategories = categoryData.subcategories;
		});
	});
</script>

<CategoryPage
	categorySlug="politics"
	categoryTitle="Politics"
	{initialEvents}
	{subcategories}
/>
