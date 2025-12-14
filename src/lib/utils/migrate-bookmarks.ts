/**
 * Migrate localStorage bookmarks to database
 * Should be called once after user signs in for the first time
 */

import { addToWatchlist } from '$lib/stores/watchlist.svelte';

const BOOKMARKS_KEY = 'glitch-bookmarks';
const MIGRATION_FLAG_KEY = 'glitch-bookmarks-migrated';

export async function migrateLocalStorageBookmarks(): Promise<{
	migrated: number;
	failed: number;
}> {
	if (localStorage.getItem(MIGRATION_FLAG_KEY) === 'true') {
		return { migrated: 0, failed: 0 };
	}

	try {
		const stored = localStorage.getItem(BOOKMARKS_KEY);
		if (!stored) {
			localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
			return { migrated: 0, failed: 0 };
		}

		const eventIds = JSON.parse(stored) as string[];
		let migrated = 0;
		let failed = 0;

		for (const eventId of eventIds) {
			try {
				const success = await addToWatchlist(eventId);
				if (success) {
					migrated++;
				} else {
					failed++;
				}
			} catch (error) {
				console.error('Failed to migrate bookmark:', eventId, error);
				failed++;
			}
		}

		localStorage.setItem(MIGRATION_FLAG_KEY, 'true');

		localStorage.removeItem(BOOKMARKS_KEY);

		return { migrated, failed };
	} catch (error) {
		console.error('Failed to migrate bookmarks:', error);
		return { migrated: 0, failed: 0 };
	}
}

export function shouldOfferMigration(): boolean {
	return (
		!!localStorage.getItem(BOOKMARKS_KEY) && localStorage.getItem(MIGRATION_FLAG_KEY) !== 'true'
	);
}
