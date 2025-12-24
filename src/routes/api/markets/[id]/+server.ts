/**
 * SvelteKit server route for fetching a market by ID
 * GET /api/markets/[id]
 */

import { MarketService } from '$lib/server/services/market-service.js';
import { createGetByIdHandler } from '$lib/server/utils/api-handler.js';

const marketService = new MarketService();

export const GET = createGetByIdHandler({
	loggerComponent: 'MarketByIdRoute',
	entityName: 'Market',
	cacheMaxAge: 30,
	serviceFn: (id) => marketService.getMarketById(id)
});
