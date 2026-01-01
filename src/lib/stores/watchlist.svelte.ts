/**
 * Watchlist store - reactive state for bookmarks
 * Provides reactive state tracking. Mutations are handled by use-watchlist.svelte.ts
 */

import { SvelteSet } from 'svelte/reactivity';
import { browser } from '$app/environment';
import { Logger } from '$lib/utils/logger';

const log = Logger.forModule('WatchlistStore');

export const bookmarkedEventIds = new SvelteSet<string>();

export const watchlistState = $state({
	isLoading: false,
	error: null as string | null
});

/**
 * Initialize watchlist from database
 * Should be called on app load if user is authenticated
 */
export async function initializeWatchlist(): Promise<void> {
	if (!browser) return;

	try {
		watchlistState.isLoading = true;
		watchlistState.error = null;

		const response = await fetch('/api/watchlist');

		if (response.status === 401) {
			bookmarkedEventIds.clear();
			return;
		}

		if (!response.ok) {
			throw new Error('Failed to fetch watchlist');
		}

		const events = await response.json();

		bookmarkedEventIds.clear();
		events.forEach((event: { id: string }) => {
			bookmarkedEventIds.add(event.id);
		});
	} catch (error) {
		log.error('Failed to initialize watchlist', error);
		watchlistState.error = error instanceof Error ? error.message : 'Unknown error';
	} finally {
		watchlistState.isLoading = false;
	}
}

export function isBookmarked(eventId: string): boolean {
	return bookmarkedEventIds.has(eventId);
}

export function clearWatchlist(): void {
	bookmarkedEventIds.clear();
}
