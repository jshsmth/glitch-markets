import { onMount } from 'svelte';
import { preloadData } from '$app/navigation';

const MAIN_ROUTES = [
	'/',
	'/trending',
	'/new',
	'/politics',
	'/finance',
	'/tech',
	'/culture',
	'/economy',
	'/geopolitics',
	'/pop-culture',
	'/world'
];

export function useRoutePreloading() {
	onMount(() => {
		const preloadRoutes = () => {
			MAIN_ROUTES.forEach((route) => {
				preloadData(route).catch(() => {});
			});
		};

		if ('requestIdleCallback' in window) {
			requestIdleCallback(preloadRoutes);
		} else {
			setTimeout(preloadRoutes, 1000);
		}
	});
}
