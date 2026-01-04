/**
 * Watchlist composable with TanStack Query mutations
 * Provides optimistic updates and automatic error recovery
 */

import { createMutation, useQueryClient } from '@tanstack/svelte-query';
import { queryKeys } from '$lib/query/client';
import type { Event } from '$lib/server/api/polymarket-client';
import { bookmarkedEventIds } from '$lib/stores/watchlist.svelte';
import { vibrateSuccess, vibrateRemove } from '$lib/utils/haptics';

interface AddToWatchlistParams {
	eventId: string;
	event?: Event;
}

export function useAddToWatchlist() {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationKey: ['watchlist', 'add'],
		mutationFn: async ({ eventId }: AddToWatchlistParams) => {
			const response = await fetch('/api/watchlist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ eventId })
			});

			if (response.status === 401) {
				throw new Error('UNAUTHORIZED');
			}

			if (!response.ok) {
				throw new Error('Failed to add bookmark');
			}

			return response.json();
		},
		onMutate: async ({ eventId, event }: AddToWatchlistParams) => {
			vibrateSuccess();

			await queryClient.cancelQueries({ queryKey: queryKeys.watchlist.all });

			const previousWatchlist = queryClient.getQueryData<Event[]>(queryKeys.watchlist.all);

			if (event) {
				queryClient.setQueryData<Event[]>(queryKeys.watchlist.all, (old) => {
					if (!old) return [event];
					const exists = old.some((e) => e.id === eventId);
					return exists ? old : [event, ...old];
				});
			}

			bookmarkedEventIds.add(eventId);

			return { previousWatchlist, eventId };
		},
		onError: (_err, _vars, context) => {
			if (context?.previousWatchlist) {
				queryClient.setQueryData(queryKeys.watchlist.all, context.previousWatchlist);
			}
			if (context?.eventId) {
				bookmarkedEventIds.delete(context.eventId);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });
		}
	}));
}

export function useRemoveFromWatchlist() {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationKey: ['watchlist', 'remove'],
		mutationFn: async (eventId: string) => {
			const response = await fetch(`/api/watchlist?eventId=${encodeURIComponent(eventId)}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to remove bookmark');
			}

			return response.json();
		},
		onMutate: async (eventId) => {
			vibrateRemove();

			await queryClient.cancelQueries({ queryKey: queryKeys.watchlist.all });

			const previousWatchlist = queryClient.getQueryData<Event[]>(queryKeys.watchlist.all);

			queryClient.setQueryData<Event[]>(queryKeys.watchlist.all, (old) => {
				if (!old) return old;
				return old.filter((event) => event.id !== eventId);
			});

			bookmarkedEventIds.delete(eventId);

			return { previousWatchlist, eventId };
		},
		onError: (_err, _eventId, context) => {
			if (context?.previousWatchlist) {
				queryClient.setQueryData(queryKeys.watchlist.all, context.previousWatchlist);
			}
			if (context?.eventId) {
				bookmarkedEventIds.add(context.eventId);
			}
			queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });
		}
	}));
}
