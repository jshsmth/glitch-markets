<script lang="ts">
	import CategoryPage from '$lib/components/pages/CategoryPage.svelte';

	let { data } = $props();
</script>

<CategoryPage
	categorySlug="politics"
	categoryTitle="politics"
	initialEvents={data.categoryData.initialEvents}
	subcategories={data.categoryData.subcategories}
/>
