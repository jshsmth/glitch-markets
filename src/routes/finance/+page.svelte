<script lang="ts">
	import CategoryPage from '$lib/components/pages/CategoryPage.svelte';

	let { data } = $props();
</script>

<CategoryPage categorySlug="finance" categoryTitle="Finance" initialEvents={data.initialEvents} subcategories={data.subcategories} />
