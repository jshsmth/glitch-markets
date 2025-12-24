/**
 * SvelteKit server route for fetching an event by ID
 * GET /api/events/[id]
 */

import { EventService } from '$lib/server/services/event-service.js';
import { createGetByIdHandler } from '$lib/server/utils/api-handler.js';

const eventService = new EventService();

export const GET = createGetByIdHandler({
	loggerComponent: 'EventByIdRoute',
	entityName: 'Event',
	cacheMaxAge: 60,
	serviceFn: (id) => eventService.getEventById(id)
});
