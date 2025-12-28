import type { PageServerLoad } from './$types';
import { EventService } from '$lib/server/services/event-service.js';
import { Logger } from '$lib/utils/logger';
import { EXCLUDED_SPORTS_TAG_IDS } from '$lib/config/filters';

const eventService = new EventService();
const logger = new Logger({ component: 'HomePage' });

export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120'
	});

	const initialEvents = await eventService
		.getEvents({
			active: true,
			archived: false,
			closed: false,
			order: 'volume24hr',
			ascending: false,
			limit: 20,
			offset: 0,
			exclude_tag_id: [...EXCLUDED_SPORTS_TAG_IDS]
		})
		.catch((err) => {
			logger.error('Error loading homepage events', {
				error: err instanceof Error ? err.message : 'Unknown error'
			});
			return [];
		});

	return {
		initialEvents
	};
};
