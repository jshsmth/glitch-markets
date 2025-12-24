import type { PageServerLoad } from './$types';
import { loadCategoryData } from '$lib/server/utils/category-loader.js';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120'
	});
	return await loadCategoryData('finance', fetch);
};
