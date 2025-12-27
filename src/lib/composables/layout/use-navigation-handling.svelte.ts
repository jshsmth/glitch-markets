import { onNavigate } from '$app/navigation';
import { onMount } from 'svelte';
import { navigating } from '$app/stores';
import { showToast } from '$lib/stores/toast.svelte';
import { TIMEOUTS } from '$lib/config/constants';

export function useNavigationTimeout() {
	onMount(() => {
		let navigationTimeoutId: ReturnType<typeof setTimeout> | null = null;

		const unsubscribe = navigating.subscribe((isNavigating) => {
			if (isNavigating) {
				navigationTimeoutId = setTimeout(() => {
					showToast(
						'Navigation is taking longer than expected. Please refresh if this persists.',
						'warning',
						8000
					);
				}, TIMEOUTS.NAVIGATION_TIMEOUT);
			} else {
				if (navigationTimeoutId) {
					clearTimeout(navigationTimeoutId);
					navigationTimeoutId = null;
				}
			}
		});

		return unsubscribe;
	});
}

export function useViewTransitions() {
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			let viewTransitionTimeout: ReturnType<typeof setTimeout> | null = null;

			viewTransitionTimeout = setTimeout(() => {
				resolve();
			}, TIMEOUTS.VIEW_TRANSITION_TIMEOUT);

			document.startViewTransition(async () => {
				if (viewTransitionTimeout) {
					clearTimeout(viewTransitionTimeout);
				}
				resolve();
				await navigation.complete;
			});
		});
	});
}
