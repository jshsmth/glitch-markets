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
		position: relative;
		isolation: isolate;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;

		/* Typography */
		font-family: var(--font-sans);
		font-weight: var(--font-semibold);
		text-decoration: none;
		white-space: nowrap;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-rendering: optimizeLegibility;

		/* Transitions */
		transition:
			background-color var(--transition-base),
			transform var(--transition-fast);

		/* Touch target (WCAG AA) */
		min-height: var(--target-min);
	}

	/* Touch target expansion for mobile - expands to 44×44px minimum */
	.button::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: max(100%, 44px);
		height: max(100%, 44px);
		transform: translate(-50%, -50%);
	}

	@media (pointer: fine) {
		.button::before {
			display: none;
		}
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
		line-height: 1.5;
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
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 1px 2px 0 rgba(0, 0, 0, 0.05),
			inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
	}

	.button.variant-primary::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		border-radius: inherit;
		background: transparent;
		transition: background-color var(--transition-fast);
		pointer-events: none;
	}

	.button.variant-primary:hover:not(:disabled) {
		background-color: var(--primary-hover);
		border-color: rgba(0, 0, 0, 0.15);
		box-shadow:
			0 2px 4px 0 rgba(0, 0, 0, 0.08),
			inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
		transform: translateY(-1px);
	}

	.button.variant-primary:hover:not(:disabled)::after {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.button.variant-primary:active:not(:disabled) {
		background-color: var(--primary-active);
		border-color: rgba(0, 0, 0, 0.2);
		box-shadow:
			0 1px 2px 0 rgba(0, 0, 0, 0.05),
			inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
		transform: translateY(0);
	}

	.button.variant-primary:active:not(:disabled)::after {
		background-color: rgba(0, 0, 0, 0.05);
	}

	.button.variant-primary:disabled {
		box-shadow: none;
		border-color: transparent;
	}

	/* ============================================
     SECONDARY VARIANT (Medium Emphasis)
     ============================================ */

	.button.variant-secondary {
		background-color: var(--bg-2);
		color: var(--text-0);
		border: 1px solid var(--bg-4);
	}

	.button.variant-secondary::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		border-radius: inherit;
		background: transparent;
		transition: background-color var(--transition-fast);
		pointer-events: none;
	}

	.button.variant-secondary:hover:not(:disabled) {
		border-color: var(--primary);
	}

	.button.variant-secondary:hover:not(:disabled)::after {
		background-color: var(--bg-3);
	}

	.button.variant-secondary:active:not(:disabled)::after {
		background-color: var(--bg-4);
	}

	/* ============================================
     TERTIARY VARIANT (Low Emphasis)
     ============================================ */

	.button.variant-tertiary {
		background-color: transparent;
		color: var(--text-1);
	}

	.button.variant-tertiary::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		border-radius: inherit;
		background: transparent;
		transition: background-color var(--transition-fast);
		pointer-events: none;
	}

	.button.variant-tertiary:hover:not(:disabled) {
		color: var(--text-0);
	}

	.button.variant-tertiary:hover:not(:disabled)::after {
		background-color: var(--bg-2);
	}

	.button.variant-tertiary:active:not(:disabled)::after {
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
		flex-shrink: 0;
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
