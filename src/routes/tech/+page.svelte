<script lang="ts">
	import CategoryPage from '$lib/components/pages/CategoryPage.svelte';

	let { data } = $props();
</script>

<CategoryPage
	categorySlug="tech"
	categoryTitle="tech"
	initialEvents={data.categoryData.initialEvents}
	subcategories={data.categoryData.subcategories}
/>
