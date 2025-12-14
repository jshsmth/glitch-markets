/**
 * Watchlist store for managing user bookmarks
 * Provides reactive state and operations for the watchlist feature
 */

import { SvelteSet } from 'svelte/reactivity';
import { browser } from '$app/environment';
import { queryKeys } from '$lib/query/client';

let queryClient: any = null;

export function setQueryClient(client: any) {
	queryClient = client;
}

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
		console.error('Failed to initialize watchlist:', error);
		watchlistState.error = error instanceof Error ? error.message : 'Unknown error';
	} finally {
		watchlistState.isLoading = false;
	}
}

/**
 * Add event to watchlist
 */
export async function addToWatchlist(eventId: string): Promise<boolean> {
	if (!browser) return false;

	try {
		bookmarkedEventIds.add(eventId);

		const response = await fetch('/api/watchlist', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ eventId })
		});

		if (response.status === 401) {
			bookmarkedEventIds.delete(eventId);
			throw new Error('UNAUTHORIZED');
		}

		if (!response.ok) {
			bookmarkedEventIds.delete(eventId);
			throw new Error('Failed to add bookmark');
		}

		if (queryClient) {
			await queryClient.refetchQueries({ queryKey: queryKeys.watchlist.all });
		}

		return true;
	} catch (error) {
		console.error('Failed to add to watchlist:', error);

		if (error instanceof Error && error.message === 'UNAUTHORIZED') {
			throw error;
		}

		return false;
	}
}

/**
 * Remove event from watchlist
 */
export async function removeFromWatchlist(eventId: string): Promise<boolean> {
	if (!browser) return false;

	try {
		bookmarkedEventIds.delete(eventId);

		if (queryClient) {
			queryClient.setQueryData(queryKeys.watchlist.all, (old: any) => {
				if (!old) return old;
				return old.filter((event: any) => event.id !== eventId);
			});
		}

		const response = await fetch(`/api/watchlist?eventId=${encodeURIComponent(eventId)}`, {
			method: 'DELETE'
		});

		if (!response.ok) {
			bookmarkedEventIds.add(eventId);
			if (queryClient) {
				await queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });
			}
			throw new Error('Failed to remove bookmark');
		}

		return true;
	} catch (error) {
		console.error('Failed to remove from watchlist:', error);
		return false;
	}
}

/**
 * Check if event is bookmarked
 */
export function isBookmarked(eventId: string): boolean {
	return bookmarkedEventIds.has(eventId);
}

/**
 * Clear watchlist (used on sign out)
 */
export function clearWatchlist(): void {
	bookmarkedEventIds.clear();
}
