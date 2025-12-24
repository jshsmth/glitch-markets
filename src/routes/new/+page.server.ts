import type { PageServerLoad } from './$types';
import { EventService } from '$lib/server/services/event-service.js';
import { Logger } from '$lib/server/utils/logger';

const eventService = new EventService();
const logger = new Logger({ component: 'NewEventsPage' });

export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders({
		'Cache-Control': 'public, max-age=30, s-maxage=30, stale-while-revalidate=60'
	});

	try {
		const events = await eventService.getEvents({
			active: true,
			archived: false,
			closed: false,
			order: 'startDate',
			ascending: false,
			limit: 20,
			offset: 0,
			exclude_tag_id: [100639, 102169]
		});

		return {
			initialEvents: events
		};
	} catch (err) {
		logger.error('Error loading new events', {
			error: err instanceof Error ? err.message : 'Unknown error'
		});
		return {
			initialEvents: []
		};
	}
};
