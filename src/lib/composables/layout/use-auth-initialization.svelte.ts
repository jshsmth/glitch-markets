import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '$lib/types/user';
import { browser } from '$app/environment';
import { initializeAuth } from '$lib/stores/auth.svelte';
import { initializeWalletFromProfile } from '$lib/stores/wallet.svelte';

export function useAuthInitialization(
	session: Session | null | undefined,
	profile: UserProfile | null | undefined
) {
	$effect(() => {
		if (browser) {
			initializeAuth(session ?? null);
			initializeWalletFromProfile(profile ?? null);
		}
	});
}
