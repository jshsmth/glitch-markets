/**
 * SvelteKit server route for fetching open orders
 * GET /api/users/orders
 *
 * Returns open orders for the authenticated user via L2 CLOB client
 * Requires user authentication
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { Logger } from '$lib/utils/logger';
import { createL2Client } from '$lib/server/polymarket/l2-client.js';
import { formatErrorResponse } from '$lib/server/errors/api-errors.js';
import type { Order } from '$lib/types/user.js';

const logger = new Logger({ component: 'OrdersRoute' });

export async function GET({ locals }: RequestEvent) {
	try {
		const {
			data: { user },
			error: authError
		} = await locals.supabase.auth.getUser();

		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = user.id;

		logger.info('Fetching open orders', { userId });

		const client = await createL2Client(userId);
		const clobOrders = await client.getOpenOrders();

		logger.info('Open orders fetched', { userId, count: clobOrders.length });

		const orders: Order[] = clobOrders.map((order) => {
			const originalSize = parseFloat(order.original_size);
			const sizeMatched = parseFloat(order.size_matched);
			const remaining = originalSize - sizeMatched;

			return {
				id: order.id,
				market: order.market,
				side: order.side.toUpperCase() as 'BUY' | 'SELL',
				type: order.order_type.toUpperCase() as 'LIMIT' | 'MARKET',
				price: parseFloat(order.price),
				size: originalSize,
				filled: sizeMatched,
				remaining,
				status: sizeMatched > 0 ? 'PARTIALLY_FILLED' : 'OPEN',
				timestamp: order.created_at,
				outcome: order.outcome,
				icon: '',
				eventSlug: ''
			};
		});

		return json(orders, {
			headers: {
				'Cache-Control': 'public, max-age=10, s-maxage=10',
				'CDN-Cache-Control': 'public, max-age=10',
				'Vercel-CDN-Cache-Control': 'public, max-age=10'
			}
		});
	} catch (error) {
		logger.error('Failed to fetch open orders', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined
		});

		const errorResponse = formatErrorResponse(error as Error);
		return json(errorResponse, { status: errorResponse.statusCode });
	}
}
