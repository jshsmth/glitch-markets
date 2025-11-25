<script lang="ts">
	/**
	 * Social Login Button for JavaScript SDK
	 * Handles Google and Twitter authentication
	 */
	import { authenticateWithSocial } from '@dynamic-labs-sdk/client';
	import { browser } from '$app/environment';

	interface Props {
		provider: 'google' | 'twitter';
		label?: string;
	}

	let { provider, label }: Props = $props();
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	const displayLabel =
		label || (provider === 'google' ? 'Sign in with Google' : 'Sign in with Twitter');

	async function handleClick() {
		if (!browser) return;

		isLoading = true;
		error = null;

		try {
			// Get current URL for callback
			const redirectUrl = window.location.origin + window.location.pathname;

			await authenticateWithSocial({
				provider,
				redirectUrl
			});
		} catch (err) {
			error = err instanceof Error ? err.message : 'Authentication failed';
			console.error('Social auth error:', err);
			isLoading = false;
		}
	}
</script>

<button class="social-btn {provider}" onclick={handleClick} disabled={isLoading}>
	{isLoading ? 'Redirecting...' : displayLabel}
</button>

{#if error}
	<div class="error">{error}</div>
{/if}

<style>
	.social-btn {
		width: 100%;
		padding: 0.875rem 1.5rem;
		border: 1px solid var(--bg-4);
		border-radius: 0.5rem;
		font-weight: 500;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		background-color: var(--bg-1);
		color: var(--text-0);
	}

	.social-btn:hover:not(:disabled) {
		background-color: var(--bg-2);
		border-color: var(--bg-5);
	}

	.social-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.social-btn.google {
		border-color: var(--google-blue);
	}

	.social-btn.twitter {
		border-color: var(--twitter-blue);
	}

	.error {
		margin-top: 0.5rem;
		padding: 0.75rem;
		background-color: var(--error-bg, #fee);
		color: var(--error-text, #c00);
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}
</style>
