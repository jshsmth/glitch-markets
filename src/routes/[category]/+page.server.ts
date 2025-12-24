import type { PageServerLoad } from './$types.js';
import { loadCategoryData } from '$lib/server/utils/category-loader.js';
import { error } from '@sveltejs/kit';

const VALID_CATEGORIES = [
	'finance',
	'tech',
	'culture',
	'economy',
	'geopolitics',
	'pop-culture',
	'world',
	'politics'
] as const;

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	if (!VALID_CATEGORIES.includes(params.category as (typeof VALID_CATEGORIES)[number])) {
		throw error(404, 'Category not found');
	}

	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120'
	});

	const categoryData = await loadCategoryData(params.category);

	return {
		categoryData,
		categorySlug: params.category
	};
};
