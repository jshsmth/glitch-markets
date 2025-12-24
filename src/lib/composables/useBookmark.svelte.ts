/**
 * Composable for bookmark toggle functionality
 * Handles authentication checks and bookmark state management
 */

import { isBookmarked, addToWatchlist, removeFromWatchlist } from '$lib/stores/watchlist.svelte';
import { openSignInModal } from '$lib/stores/modal.svelte';
import { authState } from '$lib/stores/auth.svelte';
import type { Event } from '$lib/server/api/polymarket-client';

export function useBookmark(getEventId: () => string, getEvent?: () => Event) {
	const isEventBookmarked = $derived(isBookmarked(getEventId()));

	async function toggleBookmark() {
		if (!authState.user) {
			openSignInModal();
			return;
		}

		const eventId = getEventId();

		if (isEventBookmarked) {
			await removeFromWatchlist(eventId);
		} else {
			try {
				const event = getEvent?.();
				await addToWatchlist(eventId, event);
			} catch (error) {
				if (error instanceof Error && error.message === 'UNAUTHORIZED') {
					openSignInModal();
				}
			}
		}
	}

	return {
		get isBookmarked() {
			return isEventBookmarked;
		},
		toggleBookmark
	};
}
