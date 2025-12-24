<script lang="ts">
	import CategoryPage from '$lib/components/pages/CategoryPage.svelte';

	let { data } = $props();
</script>

<CategoryPage categorySlug="pop-culture" categoryTitle="Culture" initialEvents={data.initialEvents} subcategories={data.subcategories} />
