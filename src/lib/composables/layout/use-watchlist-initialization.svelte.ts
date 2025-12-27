import { browser } from '$app/environment';
import { initializeWatchlist, clearWatchlist } from '$lib/stores/watchlist.svelte';
import { migrateLocalStorageBookmarks, shouldOfferMigration } from '$lib/utils/migrate-bookmarks';
import { authState } from '$lib/stores/auth.svelte';
import { Logger } from '$lib/utils/logger';

const log = Logger.forModule('WatchlistInit');

export function useWatchlistInitialization() {
	$effect(() => {
		if (browser && authState.user) {
			initializeWatchlist();

			if (shouldOfferMigration()) {
				migrateLocalStorageBookmarks().then((result) => {
					if (result.migrated > 0) {
						log.info('Migrated bookmarks to database', { count: result.migrated });
					}
				});
			}

			const prefetchAssets = () => {
				fetch('/api/bridge/supported-assets')
					.then((r) => r.json())
					.catch(() => {});
			};

			if ('requestIdleCallback' in window) {
				requestIdleCallback(prefetchAssets, { timeout: 2000 });
			} else {
				setTimeout(prefetchAssets, 1000);
			}
		} else if (browser) {
			clearWatchlist();
		}
	});
}
