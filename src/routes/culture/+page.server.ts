import type { PageServerLoad } from './$types.js';
import { loadCategoryData } from '$lib/server/utils/category-loader.js';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120'
	});

	const categoryData = await loadCategoryData('culture', fetch);

	return {
		categoryData
	};
};
