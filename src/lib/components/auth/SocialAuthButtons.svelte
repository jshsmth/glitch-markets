<script lang="ts">
	import type { AuthProvider } from '$lib/types/modal';
	import GoogleIcon from '$lib/components/icons/GoogleIcon.svelte';
	import AuthButton from '$lib/components/ui/AuthButton.svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { Logger } from '$lib/utils/logger';
	import { getErrorMessage } from '$lib/utils/error';

	const log = Logger.forComponent('SocialAuthButtons');

	interface Props {
		/**
		 * Currently authenticating provider
		 */
		authenticatingProvider?: AuthProvider | null;

		/**
		 * Callback to set authentication state
		 */
		onAuthStateChange?: (provider: AuthProvider | null) => void;

		/**
		 * Callback to set error message
		 */
		onError?: (message: string | null) => void;
	}

	let { authenticatingProvider = null, onAuthStateChange, onError }: Props = $props();

	let isAuthenticating = $derived(authenticatingProvider !== null);

	async function handleSocialAuth(provider: 'google') {
		if (!browser) return;

		onAuthStateChange?.(provider);
		onError?.(null);

		try {
			const supabase = $page.data.supabase;
			const redirectUrl = `${window.location.origin}/auth/callback`;

			const { error } = await supabase.auth.signInWithOAuth({
				provider,
				options: {
					redirectTo: redirectUrl
				}
			});

			if (error) throw error;
		} catch (err) {
			log.error(`${provider} auth failed`, err);
			const errorMessage = getErrorMessage(err, `Failed to authenticate with ${provider}.`);
			onError?.(errorMessage);
			onAuthStateChange?.(null);
		}
	}

	let googleButtonText = $derived(
		authenticatingProvider === 'google' ? 'Authenticating...' : 'Continue with Google'
	);
</script>

<AuthButton
	variant="google"
	onclick={() => handleSocialAuth('google')}
	disabled={isAuthenticating}
	loading={authenticatingProvider === 'google'}
	ariaBusy={authenticatingProvider === 'google'}
>
	{#snippet icon()}
		<GoogleIcon size={20} />
	{/snippet}
	<span>{googleButtonText}</span>
</AuthButton>
