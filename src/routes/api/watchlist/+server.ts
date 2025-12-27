/**
 * Watchlist API Endpoint
 * Handles bookmark operations for authenticated users
 *
 * GET /api/watchlist - Returns user's bookmarked events with full details
 * POST /api/watchlist - Add event to watchlist
 * DELETE /api/watchlist?eventId=<id> - Remove event from watchlist
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { EventService } from '$lib/server/services/event-service';
import { Logger } from '$lib/utils/logger';

const eventService = new EventService();
const log = Logger.forRoute('/api/watchlist');

/**
 * GET /api/watchlist
 * Fetch user's bookmarked events with full event details
 */
export const GET: RequestHandler = async ({ locals }) => {
	try {
		const {
			data: { user },
			error: authError
		} = await locals.supabase.auth.getUser();

		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = user.id;

		const { data: watchlistEntries, error: watchlistError } = await locals.supabase
			.from('watchlist')
			.select('event_id, created_at')
			.eq('user_id', userId)
			.order('created_at', { ascending: false });

		if (watchlistError) {
			log.error('Failed to fetch watchlist:', watchlistError);
			return json({ error: 'Failed to fetch watchlist' }, { status: 500 });
		}

		if (!watchlistEntries || watchlistEntries.length === 0) {
			return json([], {
				headers: {
					'Cache-Control': 'private, max-age=30'
				}
			});
		}

		const eventIds = watchlistEntries.map((entry) => entry.event_id);

		const events = await Promise.all(
			eventIds.map(async (eventId) => {
				try {
					return await eventService.getEventById(eventId);
				} catch {
					log.warn('Event not found or unavailable', { eventId });
					return null;
				}
			})
		);

		const validEvents = events.filter((event) => event !== null);

		return json(validEvents, {
			headers: {
				'Cache-Control': 'private, max-age=30'
			}
		});
	} catch (error) {
		log.error('Error in watchlist GET:', error);
		return json({ error: 'Failed to fetch watchlist' }, { status: 500 });
	}
};

/**
 * POST /api/watchlist
 * Add event to user's watchlist
 * Request body: { eventId: string }
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	try {
		const {
			data: { user },
			error: authError
		} = await locals.supabase.auth.getUser();

		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = user.id;

		const { eventId } = await request.json();

		if (!eventId || typeof eventId !== 'string') {
			return json({ error: 'Invalid event ID' }, { status: 400 });
		}

		const { error: insertError } = await locals.supabase.from('watchlist').insert({
			user_id: userId,
			event_id: eventId,
			created_at: new Date().toISOString()
		});

		if (insertError) {
			if (insertError.code === '23505') {
				return json({ success: true, message: 'Event already bookmarked' });
			}

			log.error('Failed to add bookmark:', insertError);
			return json({ error: 'Failed to add bookmark' }, { status: 500 });
		}

		return json({ success: true, message: 'Event bookmarked' });
	} catch (error) {
		log.error('Error in watchlist POST:', error);
		return json({ error: 'Failed to add bookmark' }, { status: 500 });
	}
};

/**
 * DELETE /api/watchlist?eventId=<id>
 * Remove event from user's watchlist
 */
export const DELETE: RequestHandler = async ({ locals, url }) => {
	try {
		const {
			data: { user },
			error: authError
		} = await locals.supabase.auth.getUser();

		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = user.id;
		const eventId = url.searchParams.get('eventId');

		if (!eventId) {
			return json({ error: 'Event ID required' }, { status: 400 });
		}

		const { error: deleteError } = await locals.supabase
			.from('watchlist')
			.delete()
			.eq('user_id', userId)
			.eq('event_id', eventId);

		if (deleteError) {
			log.error('Failed to remove bookmark:', deleteError);
			return json({ error: 'Failed to remove bookmark' }, { status: 500 });
		}

		return json({ success: true, message: 'Bookmark removed' });
	} catch (error) {
		log.error('Error in watchlist DELETE:', error);
		return json({ error: 'Failed to remove bookmark' }, { status: 500 });
	}
};
