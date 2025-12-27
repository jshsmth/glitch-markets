import type { SupabaseClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '$lib/types/user';
import { onMount } from 'svelte';
import { invalidate } from '$app/navigation';
import { updateAuthState } from '$lib/stores/auth.svelte';
import { walletState } from '$lib/stores/wallet.svelte';
import { TIMEOUTS } from '$lib/config/constants';

export function useAuthListener(
	supabase: SupabaseClient,
	session: Session | null | undefined,
	profile: UserProfile | null | undefined,
	onUserSignIn: () => void
) {
	$effect(() => {
		if (session?.user && !profile?.serverWalletAddress) {
			onUserSignIn();
		}
	});

	onMount(() => {
		let authInvalidationTimeout: ReturnType<typeof setTimeout> | null = null;

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange(async (_event, session) => {
			updateAuthState(session);

			if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED' || _event === 'SIGNED_OUT') {
				if (authInvalidationTimeout) {
					clearTimeout(authInvalidationTimeout);
				}

				authInvalidationTimeout = setTimeout(async () => {
					await invalidate('supabase:auth');
				}, TIMEOUTS.AUTH_INVALIDATION_DEBOUNCE);
			}

			if (session?.user && (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED')) {
				if (!walletState.serverWalletAddress) {
					onUserSignIn();
				}
			}
		});

		return () => {
			subscription.unsubscribe();
			if (authInvalidationTimeout) {
				clearTimeout(authInvalidationTimeout);
			}
		};
	});
}
