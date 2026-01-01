<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/**
		 * Button variant - primary, secondary, or google
		 */
		variant?: 'primary' | 'secondary' | 'google';
		/**
		 * Whether the button is disabled
		 */
		disabled?: boolean;
		/**
		 * Whether the button is in a loading state
		 */
		loading?: boolean;
		/**
		 * Aria busy state
		 */
		ariaBusy?: boolean;
		/**
		 * Click handler
		 */
		onclick?: () => void;
		/**
		 * Button type attribute
		 */
		type?: 'button' | 'submit' | 'reset';
		/**
		 * Icon snippet to render before text
		 */
		icon?: Snippet;
		/**
		 * Button text content
		 */
		children?: Snippet;
	}

	let {
		variant = 'primary',
		disabled = false,
		loading = false,
		ariaBusy = false,
		onclick,
		type = 'button',
		icon,
		children
	}: Props = $props();
</script>

<button
	class="auth-button {variant}"
	{disabled}
	aria-busy={ariaBusy}
	{onclick}
	{type}
>
	{#if loading}
		<div class="spinner"></div>
	{:else if icon}
		{@render icon()}
	{/if}
	{#if children}
		{@render children()}
	{/if}
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

	.auth-button.primary {
		background: var(--primary);
		color: white;
		box-shadow: 0 2px 8px color-mix(in srgb, var(--primary) 25%, transparent);
	}

	.auth-button.primary:not(:disabled):hover {
		background: var(--primary-hover);
		box-shadow: 0 4px 12px color-mix(in srgb, var(--primary) 35%, transparent);
	}

	.auth-button.secondary {
		background: var(--bg-2);
		color: var(--text-1);
		border: 1px solid var(--bg-4);
	}

	.auth-button.secondary:not(:disabled):hover {
		background: var(--bg-3);
		color: var(--text-0);
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

	.auth-button:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 25%, transparent);
	}

	.auth-button.google:focus-visible {
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--google-bg) 25%, transparent);
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
