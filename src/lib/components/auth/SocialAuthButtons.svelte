<script lang="ts">
	import type { AuthProvider } from '$lib/types/modal';
	import GoogleIcon from '$lib/components/icons/GoogleIcon.svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

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
			console.error(`[SocialAuthButtons] ${provider} auth failed:`, err);

			const error = err as { message?: string };
			let userMessage = `Failed to authenticate with ${provider}.`;

			if (error?.message) {
				userMessage = `Error: ${error.message}`;
			}

			onError?.(userMessage);
			onAuthStateChange?.(null);
		}
	}

	let googleButtonText = $derived(
		authenticatingProvider === 'google' ? 'Authenticating...' : 'Continue with Google'
	);
</script>

<button
	class="auth-button google"
	onclick={() => handleSocialAuth('google')}
	disabled={isAuthenticating}
	aria-busy={authenticatingProvider === 'google'}
>
	{#if authenticatingProvider === 'google'}
		<div class="spinner"></div>
	{:else}
		<GoogleIcon size={20} />
	{/if}
	<span>{googleButtonText}</span>
</button>

<style>
	.auth-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 16px 24px;
		border: none;
		border-radius: 10px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		height: 54px;
		width: 100%;
	}

	.auth-button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
		filter: saturate(0.8);
	}

	.auth-button:not(:disabled):hover {
		transform: translateY(-1px);
		box-shadow: var(--shadow-button-lift);
	}

	.auth-button:not(:disabled):active {
		transform: translateY(0);
	}

	.auth-button:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--google-bg) 25%, transparent);
	}

	.auth-button.google {
		background: var(--google-bg);
		color: #ffffff;
		box-shadow: 0 2px 8px color-mix(in srgb, var(--google-bg) 25%, transparent);
	}

	.auth-button.google:not(:disabled):hover {
		background: color-mix(in srgb, var(--google-bg) 90%, white);
		box-shadow: 0 4px 12px color-mix(in srgb, var(--google-bg) 35%, transparent);
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (min-width: 768px) {
		.auth-button {
			height: 52px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.auth-button {
			transition: none;
		}

		.spinner {
			animation: none;
			border-top-color: currentColor;
		}
	}
</style>
