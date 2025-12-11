import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { EventService } from '$lib/server/services/event-service.js';

const eventService = new EventService();

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
		console.error('Error fetching event:', err);
		throw error(500, 'Failed to load event');
	}
};
