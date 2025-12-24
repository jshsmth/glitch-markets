<script lang="ts">
	import CategoryPage from '$lib/components/pages/CategoryPage.svelte';

	let { data } = $props();
</script>

<CategoryPage
	categorySlug="pop-culture"
	categoryTitle="pop culture"
	initialEvents={data.categoryData.initialEvents}
	subcategories={data.categoryData.subcategories}
/>
