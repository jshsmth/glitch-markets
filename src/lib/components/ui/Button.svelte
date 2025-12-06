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
		 * - small: 36px height (meets WCAG 2.2 AA with 44px touch target)
		 * - medium: 44px height (WCAG 2.1 AA / comfortable)
		 * - large: 56px height (enhanced usability for primary CTAs)
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

		/* Accessible by default - actual size meets or exceeds WCAG 2.2 AA */
	}

	/* Touch target expansion for small buttons on touch devices
	   Ensures WCAG 2.2 AA compliance (24×24px min) with comfortable 44×44px target */
	.button.size-small::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: max(100%, var(--target-comfortable));
		height: max(100%, var(--target-comfortable));
		transform: translate(-50%, -50%);
	}

	@media (pointer: fine) {
		.button.size-small::before {
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

	/* Small - Compact actions (touch target expanded via ::before) */
	.button.size-small {
		padding: 6px 16px;
		font-size: 14px;
		border-radius: var(--radius-md);
		min-height: 36px;
		line-height: 1.5;
		letter-spacing: 0.02em;
	}

	/* Medium - Default size (WCAG 2.1 AA / comfortable) */
	.button.size-medium {
		padding: 10px 20px;
		font-size: 15px;
		border-radius: var(--radius-button);
		min-height: var(--target-comfortable); /* 44px */
		line-height: 1.5;
		letter-spacing: 0.02em;
	}

	/* Large - Important CTAs (enhanced usability) */
	.button.size-large {
		padding: 14px 28px;
		font-size: 16px;
		border-radius: var(--radius-lg);
		min-height: var(--target-large); /* 56px */
		line-height: 1.5;
		letter-spacing: 0.02em;
	}

	/* ============================================
     PRIMARY VARIANT (High Emphasis)
     ============================================ */

	.button.variant-primary {
		background-color: var(--primary);
		color: var(--bg-0);
		border: none;
		box-shadow: 0 1px 3px rgba(var(--primary-rgb), 0.2);
		position: relative;
		overflow: hidden;
	}

	.button.variant-primary::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.15) 0%,
			rgba(255, 255, 255, 0) 100%
		);
		pointer-events: none;
		border-radius: inherit;
	}

	.button.variant-primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.25);
	}

	.button.variant-primary:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: 0 1px 4px rgba(var(--primary-rgb), 0.2);
	}

	.button.variant-primary:disabled {
		box-shadow: none;
		opacity: 0.5;
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
