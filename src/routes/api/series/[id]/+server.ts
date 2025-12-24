/**
 * SvelteKit server route for fetching a series by ID
 * GET /api/series/[id]
 */

import { SeriesService } from '$lib/server/services/series-service.js';
import { createGetByIdHandler } from '$lib/server/utils/api-handler.js';

const seriesService = new SeriesService();

export const GET = createGetByIdHandler({
	loggerComponent: 'SeriesByIdRoute',
	entityName: 'Series',
	cacheMaxAge: 60,
	serviceFn: (id) => seriesService.getSeriesById(id)
});
