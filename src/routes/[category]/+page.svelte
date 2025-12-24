<script lang="ts">
	import CategoryPage from '$lib/components/pages/CategoryPage.svelte';

	let { data } = $props();

	function formatCategoryTitle(slug: string): string {
		if (slug === 'pop-culture') return 'Pop Culture';

		return slug
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	const categoryTitle = $derived(formatCategoryTitle(data.categorySlug));
</script>

<CategoryPage
	categorySlug={data.categorySlug}
	{categoryTitle}
	initialEvents={data.categoryData.initialEvents}
	subcategories={data.categoryData.subcategories}
/>
