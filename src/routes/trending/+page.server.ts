import type { PageServerLoad } from './$types';
import { EventService } from '$lib/server/services/event-service.js';
import { Logger } from '$lib/server/utils/logger';

const eventService = new EventService();
const logger = new Logger({ component: 'TrendingPage' });

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120'
	});

	const order = url.searchParams.get('order') || 'volume24hr';
	const limit = 20;
	const offset = 0;

	try {
		const events = await eventService.getEvents({
			active: true,
			archived: false,
			closed: false,
			order,
			ascending: false,
			limit,
			offset
		});

		return {
			initialEvents: events,
			initialSort: order
		};
	} catch (err) {
		logger.error('Error loading trending events', {
			error: err instanceof Error ? err.message : 'Unknown error'
		});
		return {
			initialEvents: [],
			initialSort: order
		};
	}
};
