<script lang="ts">
	import CategoryPage from '$lib/components/pages/CategoryPage.svelte';

	let { data } = $props();
</script>

<CategoryPage
	categorySlug="economy"
	categoryTitle="Economy"
	initialEvents={data.initialEvents}
	subcategories={data.subcategories}
/>
