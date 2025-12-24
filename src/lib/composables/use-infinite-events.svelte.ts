import { createQuery } from '@tanstack/svelte-query';
import { queryKeys } from '$lib/query/client';
import type { Event } from '$lib/server/api/polymarket-client';
import { browser } from '$app/environment';
import { untrack } from 'svelte';

const PAGE_SIZE = 20;
const MAX_EVENTS = 200;

interface UseInfiniteEventsOptions {
	buildParams: (offset: number, sort?: string) => URLSearchParams;
	sort?: string;
	enableSort?: boolean;
}

interface UseInfiniteEventsReturn {
	events: Event[];
	hasMore: boolean;
	isLoading: boolean;
	error: Error | null;
	isFetching: boolean;
	handleLoadMore: () => void;
	handleRetry: () => void;
	handleSortChange?: (sort: string) => void;
	currentSort?: string;
}

export function useInfiniteEvents(options: UseInfiniteEventsOptions): UseInfiniteEventsReturn {
	const { buildParams, sort: initialSort, enableSort = false } = options;

	let offset = $state(0);
	let allEvents = $state<Event[]>([]);
	let hasMore = $state(true);
	let isInitialLoad = $state(true);
	let currentSort = $state(initialSort || '');

	const query = createQuery<Event[]>(() => {
		const queryKey = enableSort
			? [...queryKeys.events.all, offset, currentSort]
			: [...queryKeys.events.all, offset];

		return {
			queryKey,
			queryFn: async () => {
				const params = buildParams(offset, currentSort);
				params.set('limit', PAGE_SIZE.toString());
				params.set('offset', offset.toString());

				const response = await fetch(`/api/events?${params.toString()}`);
				if (!response.ok) {
					throw new Error('Failed to fetch events');
				}
				const data = await response.json();
				return data;
			}
		};
	});

	let lastProcessedOffset = -1;
	let lastProcessedSort = '';

	$effect(() => {
		if (!browser) return;

		const currentOffset = offset;
		const currentSortValue = currentSort;
		const data = query.data;
		const isPending = query.isPending;

		const shouldProcess = enableSort
			? currentOffset !== lastProcessedOffset || currentSortValue !== lastProcessedSort
			: currentOffset !== lastProcessedOffset;

		if (data && shouldProcess) {
			untrack(() => {
				lastProcessedOffset = currentOffset;
				if (enableSort) {
					lastProcessedSort = currentSortValue;
				}

				if (currentOffset === 0) {
					allEvents = data;
				} else {
					allEvents = allEvents.concat(data);
				}

				if (allEvents.length >= MAX_EVENTS) {
					hasMore = false;
				} else {
					hasMore = data.length === PAGE_SIZE;
				}

				isInitialLoad = false;
			});
		} else if (isPending && currentOffset === 0) {
			isInitialLoad = true;
		}
	});

	function handleLoadMore() {
		if (browser && !query.isFetching && hasMore) {
			offset += PAGE_SIZE;
		}
	}

	function handleRetry() {
		if (browser) {
			offset = 0;
			allEvents = [];
			hasMore = true;
			lastProcessedOffset = -1;
			if (enableSort) {
				lastProcessedSort = '';
			}
			query.refetch();
		}
	}

	function handleSortChange(sort: string) {
		if (!enableSort) return;

		currentSort = sort;
		offset = 0;
		allEvents = [];
		hasMore = true;
		lastProcessedOffset = -1;
		lastProcessedSort = '';
	}

	// Use a class to maintain proper reactivity
	class InfiniteEventsReturn {
		get events() {
			return allEvents;
		}
		get hasMore() {
			return hasMore;
		}
		get isLoading() {
			return isInitialLoad;
		}
		get error() {
			return browser ? (query.error as Error | null) : null;
		}
		get isFetching() {
			return browser ? query.isFetching : false;
		}
		get currentSort() {
			return enableSort ? currentSort : undefined;
		}
		handleLoadMore = handleLoadMore;
		handleRetry = handleRetry;
		handleSortChange = enableSort ? handleSortChange : undefined;
	}

	return new InfiniteEventsReturn() as UseInfiniteEventsReturn;
}
