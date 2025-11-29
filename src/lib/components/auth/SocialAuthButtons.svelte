<script lang="ts">
	import type { AuthProvider } from '$lib/types/modal';
	import GoogleIcon from '$lib/components/icons/GoogleIcon.svelte';
	import DiscordIcon from '$lib/components/icons/DiscordIcon.svelte';
	import { authenticateWithSocial } from '@dynamic-labs-sdk/client';
	import { authState } from '$lib/stores/auth.svelte';
	import { browser } from '$app/environment';

	const DEV = import.meta.env.DEV;

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

	async function handleSocialAuth(provider: 'google' | 'discord') {
		if (!browser) return;

		if (!authState.client) {
			onError?.(
				'Authentication service is still initializing. Please wait a moment and try again.'
			);
			return;
		}

		onAuthStateChange?.(provider);
		onError?.(null);

		try {
			const redirectUrl = window.location.origin + window.location.pathname;
			if (DEV) {
				console.log(`[SocialAuthButtons] Initiating ${provider} OAuth with redirect:`, redirectUrl);
			}

			await authenticateWithSocial(
				{
					provider: provider as 'google',
					redirectUrl
				},
				authState.client
			);

			if (DEV) {
				console.log(`[SocialAuthButtons] OAuth redirect initiated for ${provider}`);
			}
		} catch (err) {
			if (DEV) {
				console.error(`[SocialAuthButtons] ${provider} auth failed:`, err);
			}

			const errorObj = err as Record<string, unknown>;
			let userMessage = `Failed to authenticate with ${provider}.`;

			if (typeof errorObj?.message === 'string' && errorObj.message.includes('not enabled')) {
				userMessage = `${provider} authentication is not enabled. Please try another sign-in method.`;
			} else if (typeof errorObj?.message === 'string') {
				userMessage = `Error: ${errorObj.message}`;
			}

			onError?.(userMessage);
			onAuthStateChange?.(null);
		}
	}

	let googleButtonText = $derived(
		authenticatingProvider === 'google' ? 'Authenticating...' : 'Continue with Google'
	);
	let discordButtonText = $derived(
		authenticatingProvider === 'discord' ? 'Authenticating...' : 'Continue with Discord'
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

<button
	class="auth-button discord"
	onclick={() => handleSocialAuth('discord')}
	disabled={isAuthenticating}
	aria-busy={authenticatingProvider === 'discord'}
>
	{#if authenticatingProvider === 'discord'}
		<div class="spinner"></div>
	{:else}
		<DiscordIcon size={20} />
	{/if}
	<span>{discordButtonText}</span>
</button>

<style>
	.auth-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 14px 24px;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		height: 52px;
		width: 100%;
	}

	.auth-button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.auth-button:not(:disabled):hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px color-mix(in srgb, var(--text-0) 10%, transparent);
	}

	.auth-button:not(:disabled):active {
		transform: translateY(0);
	}

	.auth-button.google {
		background: #000000;
		color: #ffffff;
	}

	.auth-button.google:not(:disabled):hover {
		background: #1a1a1a;
	}

	.auth-button.discord {
		background: #5865f2;
		color: #ffffff;
	}

	.auth-button.discord:not(:disabled):hover {
		background: #4752c4;
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
			height: 50px;
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
