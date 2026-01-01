/**
 * Composable for bookmark toggle functionality
 * Handles authentication checks and bookmark state management
 */

import { isBookmarked } from '$lib/stores/watchlist.svelte';
import { useAddToWatchlist, useRemoveFromWatchlist } from './use-watchlist.svelte';
import { openSignInModal } from '$lib/stores/modal.svelte';
import { authState } from '$lib/stores/auth.svelte';
import type { Event } from '$lib/server/api/polymarket-client';

export function useBookmark(getEventId: () => string, getEvent?: () => Event) {
	const addMutation = useAddToWatchlist();
	const removeMutation = useRemoveFromWatchlist();

	const isEventBookmarked = $derived(isBookmarked(getEventId()));

	async function toggleBookmark() {
		if (!authState.user) {
			openSignInModal();
			return;
		}

		const eventId = getEventId();

		if (isEventBookmarked) {
			removeMutation.mutate(eventId);
		} else {
			try {
				const event = getEvent?.();
				addMutation.mutate({ eventId, event });
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
		get isLoading() {
			return addMutation.isPending || removeMutation.isPending;
		},
		toggleBookmark
	};
}
