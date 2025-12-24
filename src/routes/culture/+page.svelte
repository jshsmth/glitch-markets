<script lang="ts">
	import CategoryPage from '$lib/components/pages/CategoryPage.svelte';

	let { data } = $props();
</script>

<CategoryPage
	categorySlug="culture"
	categoryTitle="Culture"
	initialEvents={data.categoryData.initialEvents}
	subcategories={data.categoryData.subcategories}
/>
