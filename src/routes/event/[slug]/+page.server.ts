import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { EventService } from '$lib/server/services/event-service.js';
import { Logger } from '$lib/utils/logger';

const eventService = new EventService();
const log = Logger.forRoute('/event/[slug]');

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;

	if (!slug || slug.trim() === '') {
		throw error(400, 'Event slug is required');
	}

	try {
		const event = await eventService.getEventBySlug(slug);

		if (!event) {
			throw error(404, 'Event not found');
		}

		return {
			event
		};
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		log.error('Error fetching event', err, { slug });
		throw error(500, 'Failed to load event');
	}
};
