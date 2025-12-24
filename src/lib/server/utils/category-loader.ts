import { EventService } from '$lib/server/services/event-service.js';
import type { Event, Tag } from '../api/polymarket-client.js';
import { Logger } from './logger';

const eventService = new EventService();
const logger = new Logger({ component: 'CategoryLoader' });

export interface CategoryData {
	initialEvents: Event[];
	subcategories: Tag[];
}

export async function loadCategoryData(
	categorySlug: string,
	fetch: typeof globalThis.fetch
): Promise<CategoryData> {
	try {
		const [events, subcategoriesResponse] = await Promise.all([
			eventService.getEvents({
				tag_slug: categorySlug,
				archived: false,
				active: true,
				closed: false,
				order: 'volume24hr',
				ascending: false,
				limit: 20,
				offset: 0
			}),
			fetch(`/api/tags/slug/${categorySlug}/related`)
		]);

		const subcategories = subcategoriesResponse.ok ? await subcategoriesResponse.json() : [];

		return {
			initialEvents: events,
			subcategories
		};
	} catch (err) {
		logger.error('Error loading category data', {
			categorySlug,
			error: err instanceof Error ? err.message : 'Unknown error'
		});
		return {
			initialEvents: [],
			subcategories: []
		};
	}
}
