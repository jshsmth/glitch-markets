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
		display: flex;
		align-items: center;
		background-color: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-md);
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease,
			box-shadow 0.2s ease;
	}

	.input-container:hover {
		background-color: var(--bg-1);
	}

	.input-container:focus-within {
		background-color: var(--bg-0);
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(0, 217, 255, 0.1);
	}

	.input-container.error {
		border-color: var(--danger);
	}

	.input-container.error:focus-within {
		border-color: var(--danger);
		box-shadow: 0 0 0 3px rgba(250, 28, 101, 0.1);
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
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		color: var(--text-0);
		font-size: 14px;
		padding: 0 14px;
		width: 100%;
		height: 100%;
	}

	.input::placeholder {
		color: var(--text-3);
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
