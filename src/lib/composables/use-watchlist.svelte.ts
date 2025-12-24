/**
 * Watchlist composable with TanStack Query mutations
 * Provides optimistic updates and automatic error recovery
 */

import { createMutation, useQueryClient } from '@tanstack/svelte-query';
import { queryKeys } from '$lib/query/client';
import type { Event } from '$lib/server/api/polymarket-client';
import { browser } from '$app/environment';

export function useAddToWatchlist() {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationFn: async (eventId: string) => {
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
		onMutate: async () => {
			if (browser && 'vibrate' in navigator) {
				navigator.vibrate(50);
			}

			await queryClient.cancelQueries({ queryKey: queryKeys.watchlist.all });

			const previousWatchlist = queryClient.getQueryData<Event[]>(queryKeys.watchlist.all);

			return { previousWatchlist };
		},
		onError: (_err, _eventId, context) => {
			if (context?.previousWatchlist) {
				queryClient.setQueryData(queryKeys.watchlist.all, context.previousWatchlist);
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
			if (browser && 'vibrate' in navigator) {
				navigator.vibrate([30, 20, 30]);
			}

			await queryClient.cancelQueries({ queryKey: queryKeys.watchlist.all });

			const previousWatchlist = queryClient.getQueryData<Event[]>(queryKeys.watchlist.all);

			queryClient.setQueryData<Event[]>(queryKeys.watchlist.all, (old) => {
				if (!old) return old;
				return old.filter((event) => event.id !== eventId);
			});

			return { previousWatchlist };
		},
		onError: (_err, _eventId, context) => {
			if (context?.previousWatchlist) {
				queryClient.setQueryData(queryKeys.watchlist.all, context.previousWatchlist);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });
		}
	}));
}
