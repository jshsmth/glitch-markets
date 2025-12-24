<script lang="ts">
	import CategoryPage from '$lib/components/pages/CategoryPage.svelte';

	let { data } = $props();
</script>

<CategoryPage
	categorySlug="geopolitics"
	categoryTitle="Geopolitics"
	initialEvents={data.initialEvents}
	subcategories={data.subcategories}
/>
