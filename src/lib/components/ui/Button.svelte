<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		/**
		 * Button variant following UI Design Principle #3
		 * - primary: Most important action (high emphasis)
		 * - secondary: Alternative actions (medium emphasis)
		 * - tertiary: Least important actions (low emphasis)
		 */
		variant?: 'primary' | 'secondary' | 'tertiary';

		/**
		 * Button size
		 * All sizes meet WCAG minimum touch target (48px)
		 */
		size?: 'small' | 'medium' | 'large';

		/**
		 * Full width button (stretches to container)
		 */
		fullWidth?: boolean;

		/**
		 * Loading state - shows loading indicator
		 */
		loading?: boolean;

		/**
		 * Disabled state
		 */
		disabled?: boolean;

		/**
		 * Icon to show before text (optional)
		 */
		iconBefore?: Snippet;

		/**
		 * Icon to show after text (optional)
		 */
		iconAfter?: Snippet;

		/**
		 * Button content (text/elements)
		 */
		children?: Snippet;

		/**
		 * Click handler
		 */
		onclick?: (event: MouseEvent) => void;
	}

	let {
		variant = 'primary',
		size = 'medium',
		fullWidth = false,
		loading = false,
		disabled = false,
		iconBefore,
		iconAfter,
		children,
		onclick,
		class: className,
		...restProps
	}: Props = $props();

	const isDisabled = $derived(disabled || loading);
</script>

<button
	class="button variant-{variant} size-{size} {className || ''}"
	class:full-width={fullWidth}
	class:loading
	disabled={isDisabled}
	{onclick}
	{...restProps}
>
	{#if loading}
		<span class="loading-spinner" aria-hidden="true"></span>
	{/if}

	{#if iconBefore && !loading}
		<span class="icon icon-before">
			{@render iconBefore()}
		</span>
	{/if}

	<span class="button-text">
		{@render children?.()}
	</span>

	{#if iconAfter && !loading}
		<span class="icon icon-after">
			{@render iconAfter()}
		</span>
	{/if}
</button>

<style>
	/* ============================================
     BASE BUTTON STYLES
     ============================================ */

	.button {
		/* Reset */
		border: none;
		background: none;
		margin: 0;
		cursor: pointer;

		/* Layout */
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-xs);

		/* Typography */
		font-family: var(--font-sans);
		font-weight: var(--font-semibold);
		text-decoration: none;
		white-space: nowrap;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-rendering: optimizeLegibility;

		/* Transitions */
		transition: var(--transition-colors);

		/* Touch target (WCAG AA) */
		min-height: var(--target-min);

		/* Accessibility */
		position: relative;
	}

	.button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.button.full-width {
		width: 100%;
	}

	/* ============================================
     SIZE VARIANTS
     ============================================ */

	/* Small - Compact actions */
	.button.size-small {
		padding: 8px 16px;
		font-size: 14px;
		border-radius: var(--radius-md);
		min-height: var(--target-min);
	}

	/* Medium - Default size */
	.button.size-medium {
		padding: 10px 20px;
		font-size: 15px;
		border-radius: var(--radius-button);
		min-height: var(--target-min);
		line-height: 1.5;
	}

	/* Large - Important CTAs */
	.button.size-large {
		padding: 14px 28px;
		font-size: 16px;
		border-radius: var(--radius-lg);
		min-height: var(--target-comfortable);
	}

	/* ============================================
     PRIMARY VARIANT (High Emphasis)
     ============================================ */

	.button.variant-primary {
		background-color: var(--primary);
		color: #111111;
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.05),
			0 0 0 1px rgba(0, 0, 0, 0.05);
		transition:
			background-color 0.2s ease,
			box-shadow 0.2s ease,
			transform 0.15s ease;
	}

	.button.variant-primary:hover:not(:disabled) {
		background-color: var(--primary-hover);
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.08),
			0 0 0 1px rgba(0, 0, 0, 0.08);
		transform: translateY(-1px);
	}

	.button.variant-primary:active:not(:disabled) {
		background-color: var(--primary-active);
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.05),
			0 0 0 1px rgba(0, 0, 0, 0.1);
		transform: translateY(0);
	}

	/* ============================================
     SECONDARY VARIANT (Medium Emphasis)
     ============================================ */

	.button.variant-secondary {
		background-color: var(--bg-2);
		color: var(--text-0);
		border: 1px solid var(--bg-4);
	}

	.button.variant-secondary:hover:not(:disabled) {
		background-color: var(--bg-3);
		border-color: var(--primary);
	}

	.button.variant-secondary:active:not(:disabled) {
		background-color: var(--bg-4);
	}

	/* ============================================
     TERTIARY VARIANT (Low Emphasis)
     ============================================ */

	.button.variant-tertiary {
		background-color: transparent;
		color: var(--text-1);
	}

	.button.variant-tertiary:hover:not(:disabled) {
		background-color: var(--bg-2);
		color: var(--text-0);
	}

	.button.variant-tertiary:active:not(:disabled) {
		background-color: var(--bg-3);
	}

	/* ============================================
     LOADING STATE
     ============================================ */

	.button.loading {
		pointer-events: none;
	}

	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ============================================
     ICON SPACING
     ============================================ */

	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.button-text {
		display: inline-flex;
		align-items: center;
	}

	/* Hide text when loading to prevent layout shift */
	.button.loading .button-text {
		visibility: hidden;
	}

	.button.loading .icon {
		visibility: hidden;
	}
</style>
