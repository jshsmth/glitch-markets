<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'size'> {
		/**
		 * Input variant/style
		 */
		variant?: 'default' | 'search';

		/**
		 * Input size variant
		 */
		inputSize?: 'small' | 'medium' | 'large';

		/**
		 * Error state
		 */
		error?: boolean;

		/**
		 * Error message to display
		 */
		errorMessage?: string;

		/**
		 * Icon to show before input (optional)
		 */
		iconBefore?: Snippet;

		/**
		 * Icon/element to show after input (optional)
		 */
		iconAfter?: Snippet;

		/**
		 * Input value (bindable)
		 */
		value?: string;

		/**
		 * Input handler
		 */
		oninput?: (event: Event) => void;

		/**
		 * Reference to the underlying input element (bindable)
		 */
		inputElement?: HTMLInputElement;
	}

	let {
		variant = 'default',
		inputSize = 'medium',
		error = false,
		errorMessage,
		iconBefore,
		iconAfter,
		value = $bindable(''),
		oninput,
		inputElement = $bindable(),
		class: className,
		...restProps
	}: Props = $props();
</script>

<div class="input-wrapper">
	<div class="input-container variant-{variant} size-{inputSize}" class:error>
		{#if iconBefore}
			<span class="input-icon icon-before">
				{@render iconBefore()}
			</span>
		{/if}

		<input
			bind:this={inputElement}
			class="input {className || ''}"
			class:has-icon-before={iconBefore}
			class:has-icon-after={iconAfter}
			bind:value
			{oninput}
			{...restProps}
		/>

		{#if iconAfter}
			<span class="input-icon icon-after">
				{@render iconAfter()}
			</span>
		{/if}
	</div>

	{#if error && errorMessage}
		<span class="error-message">{errorMessage}</span>
	{/if}
</div>

<style>
	/* ============================================
     INPUT WRAPPER
     ============================================ */

	.input-wrapper {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	/* ============================================
     INPUT CONTAINER
     ============================================ */

	.input-container {
		position: relative;
		isolation: isolate;
		display: flex;
		align-items: center;
		width: 100%;
		border-radius: var(--radius-md);
	}

	/* Background + shadow layer (similar to Tailwind's before pseudo) */
	.input-container::before {
		content: '';
		position: absolute;
		inset: 1px;
		border-radius: calc(var(--radius-md) - 1px);
		background-color: var(--bg-1);
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		z-index: -2;
		transition: background-color var(--transition-base);
	}

	/* Focus ring layer (similar to Tailwind's after pseudo) */
	.input-container::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: var(--radius-md);
		border: 2px solid transparent;
		pointer-events: none;
		z-index: -1;
		transition: border-color var(--transition-base);
	}

	.input-container:hover::before {
		background-color: var(--bg-0);
	}

	.input-container:focus-within::before {
		background-color: var(--bg-0);
	}

	.input-container:focus-within::after {
		border-color: var(--primary);
	}

	.input-container.error::after {
		border-color: var(--danger);
	}

	/* Disabled state */
	.input-container:has(input:disabled)::before {
		background-color: var(--bg-3);
		box-shadow: none;
		opacity: 0.5;
	}

	/* ============================================
     SIZE VARIANTS
     ============================================ */

	.input-container.size-small {
		height: 38px;
	}

	.input-container.size-medium {
		height: 44px;
	}

	.input-container.size-large {
		height: 52px;
	}

	/* ============================================
     INPUT ELEMENT
     ============================================ */

	.input {
		/* Reset */
		appearance: none;
		background: transparent;
		border: 1px solid rgba(0, 0, 0, 0.1);
		outline: none;

		/* Layout */
		position: relative;
		flex: 1;
		width: 100%;
		height: 100%;
		border-radius: var(--radius-md);
		padding: 0 14px;

		/* Typography */
		color: var(--text-0);
		font-size: 14px;
		font-family: var(--font-sans);
		line-height: 1.5;
		-webkit-font-smoothing: antialiased;

		/* Transitions */
		transition: border-color var(--transition-base);
	}

	.input:hover {
		border-color: rgba(0, 0, 0, 0.15);
	}

	.input:focus {
		border-color: transparent;
	}

	.input::placeholder {
		color: var(--text-3);
	}

	.input:disabled {
		cursor: not-allowed;
		border-color: transparent;
	}

	/* Dark mode border adjustments */
	@media (prefers-color-scheme: dark) {
		.input {
			border-color: rgba(255, 255, 255, 0.1);
		}

		.input:hover {
			border-color: rgba(255, 255, 255, 0.15);
		}

		.input:focus {
			border-color: transparent;
		}
	}

	.input.has-icon-before {
		padding-left: 42px;
	}

	.input.has-icon-after {
		padding-right: 48px;
	}

	/* ============================================
     ICONS
     ============================================ */

	.input-icon {
		position: absolute;
		display: flex;
		align-items: center;
		color: var(--text-3);
		pointer-events: none;
		transition: color 0.2s ease;
	}

	.input-icon.icon-before {
		left: 14px;
	}

	.input-icon.icon-after {
		right: 14px;
	}

	.input-container:focus-within .input-icon.icon-before {
		color: var(--primary);
	}

	/* ============================================
     ERROR MESSAGE
     ============================================ */

	.error-message {
		font-size: 12px;
		color: var(--danger);
		padding-left: 2px;
	}

	/* ============================================
     SEARCH VARIANT
     ============================================ */

	.input-container.variant-search {
		background-color: var(--bg-2);
	}

	.input-container.variant-search:hover {
		background-color: var(--bg-1);
	}
</style>
