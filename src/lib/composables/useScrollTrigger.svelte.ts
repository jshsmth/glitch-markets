export interface UseScrollTriggerOptions {
	onLoadMore: () => void | Promise<void>;
	hasMore: boolean;
	isLoading?: boolean;
	loadMoreInterval?: number;
	rootMargin?: string;
}

export function useScrollTrigger(options: UseScrollTriggerOptions) {
	let sentinelElement = $state<HTMLElement | null>(null);
	let loadingMore = $state(false);
	let lastLoadTime = $state(0);

	$effect(() => {
		const {
			onLoadMore,
			hasMore,
			isLoading = false,
			loadMoreInterval = 500,
			rootMargin = '200px'
		} = options;

		if (!sentinelElement || !hasMore || !onLoadMore) return;

		const observer = new IntersectionObserver(
			async (entries) => {
				const entry = entries[0];
				const now = Date.now();

				if (
					entry.isIntersecting &&
					!loadingMore &&
					!isLoading &&
					hasMore &&
					onLoadMore &&
					now - lastLoadTime >= loadMoreInterval
				) {
					loadingMore = true;
					lastLoadTime = now;

					if (sentinelElement) {
						observer.unobserve(sentinelElement);
					}

					try {
						await onLoadMore();
					} catch (error) {
						if (error instanceof Error) {
							console.error('Error loading more:', error);
						}
					} finally {
						loadingMore = false;

						if (sentinelElement && observer) {
							observer.observe(sentinelElement);
						}
					}
				}
			},
			{
				rootMargin
			}
		);

		observer.observe(sentinelElement);

		return () => {
			observer.disconnect();
		};
	});

	return {
		get sentinelRef() {
			return sentinelElement;
		},
		set sentinelRef(value: HTMLElement | null) {
			sentinelElement = value;
		},
		get isLoadingMore() {
			return loadingMore;
		}
	};
}
