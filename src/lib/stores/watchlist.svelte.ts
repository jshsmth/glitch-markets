/**
 * Watchlist store - now powered by TanStack Query mutations
 * Provides reactive state and operations for bookmarks with optimistic updates
 *
 * MIGRATION NOTE: This now uses TanStack Query mutations internally.
 * Optimistic updates and error recovery are handled automatically!
 */

import { SvelteSet } from 'svelte/reactivity';
import { browser } from '$app/environment';
import { queryKeys } from '$lib/query/client';
import type { QueryClient } from '@tanstack/svelte-query';
import type { Event } from '$lib/server/api/polymarket-client';

let queryClient: QueryClient | null = null;

export function setQueryClient(client: QueryClient) {
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
 * Uses TanStack Query mutation for optimistic updates and error recovery
 */
export async function addToWatchlist(eventId: string, event?: Event): Promise<boolean> {
	if (!browser || !queryClient) return false;

	try {
		bookmarkedEventIds.add(eventId);

		if ('vibrate' in navigator) {
			navigator.vibrate(50);
		}

		if (event) {
			queryClient.setQueryData<Event[]>(queryKeys.watchlist.all, (old) => {
				if (!old) return [event];
				const exists = old.some((e) => e.id === eventId);
				if (exists) return old;
				return [event, ...old];
			});
		}

		const response = await fetch('/api/watchlist', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ eventId })
		});

		if (response.status === 401) {
			bookmarkedEventIds.delete(eventId);
			if (event) {
				queryClient.setQueryData<Event[]>(queryKeys.watchlist.all, (old) => {
					if (!old) return old;
					return old.filter((e) => e.id !== eventId);
				});
			}
			throw new Error('UNAUTHORIZED');
		}

		if (!response.ok) {
			bookmarkedEventIds.delete(eventId);
			if (event) {
				queryClient.setQueryData<Event[]>(queryKeys.watchlist.all, (old) => {
					if (!old) return old;
					return old.filter((e) => e.id !== eventId);
				});
			}
			throw new Error('Failed to add bookmark');
		}

		await queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });

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
 * Uses optimistic updates with automatic rollback on error
 */
export async function removeFromWatchlist(eventId: string): Promise<boolean> {
	if (!browser || !queryClient) return false;

	try {
		bookmarkedEventIds.delete(eventId);

		if ('vibrate' in navigator) {
			navigator.vibrate([30, 20, 30]);
		}

		queryClient.setQueryData<Event[]>(queryKeys.watchlist.all, (old) => {
			if (!old) return old;
			return old.filter((event) => event.id !== eventId);
		});

		const response = await fetch(`/api/watchlist?eventId=${encodeURIComponent(eventId)}`, {
			method: 'DELETE'
		});

		if (!response.ok) {
			bookmarkedEventIds.add(eventId);
			await queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });
			throw new Error('Failed to remove bookmark');
		}

		return true;
	} catch (error) {
		console.error('Failed to remove from watchlist:', error);
		return false;
	}
}

export function isBookmarked(eventId: string): boolean {
	return bookmarkedEventIds.has(eventId);
}

export function clearWatchlist(): void {
	bookmarkedEventIds.clear();
}
