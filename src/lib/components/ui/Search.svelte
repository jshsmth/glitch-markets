<script lang="ts">
	import Input from './Input.svelte';
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte';
	import { debounce } from '$lib/utils/debounce';
	import { DEBOUNCE_DELAYS } from '$lib/config/constants';

	interface Props {
		/**
		 * Search query value (bindable)
		 */
		value?: string;

		/**
		 * Placeholder text
		 */
		placeholder?: string;

		/**
		 * Input handler (debounced by 300ms by default)
		 */
		oninput?: (event: Event) => void;

		/**
		 * Debounce delay in milliseconds (default: 300)
		 */
		debounceDelay?: number;

		/**
		 * Show keyboard shortcut hint
		 */
		showShortcut?: boolean;

		/**
		 * Size variant
		 */
		inputSize?: 'small' | 'medium' | 'large';

		/**
		 * Additional CSS classes
		 */
		class?: string;
	}

	let {
		value = $bindable(''),
		placeholder = 'Search...',
		oninput,
		debounceDelay = DEBOUNCE_DELAYS.SEARCH,
		showShortcut = true,
		inputSize = 'medium',
		class: className
	}: Props = $props();

	let inputElement = $state<HTMLInputElement | undefined>();
	let hasValue = $derived(value.length > 0);

	// Create debounced input handler if oninput is provided
	const debouncedInput = oninput ? debounce(oninput, debounceDelay) : undefined;

	function handleInput(event: Event) {
		if (debouncedInput) {
			debouncedInput(event);
		}
	}

	// Listen for "/" key to focus search
	function handleKeyDown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		const isInInput =
			target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

		if (event.key === '/' && !isInInput) {
			event.preventDefault();
			inputElement?.focus();
		}
	}

	function clearSearch() {
		value = '';
		inputElement?.focus();
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="search-wrapper {className || ''}">
	<Input
		bind:inputElement
		bind:value
		type="text"
		{placeholder}
		oninput={handleInput}
		{inputSize}
		variant="search"
		aria-label="Search"
	>
		{#snippet iconBefore()}
			<SearchIcon size={16} color="currentColor" />
		{/snippet}

		{#snippet iconAfter()}
			{#if hasValue}
				<button type="button" class="clear-button" onclick={clearSearch} aria-label="Clear search">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path
							d="M18 6L6 18M6 6l12 12"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>
			{:else if showShortcut}
				<span class="keyboard-shortcut">/</span>
			{/if}
		{/snippet}
	</Input>
</div>

<style>
	.search-wrapper {
		width: 100%;
		max-width: 600px;
	}

	.keyboard-shortcut {
		font-size: 13px;
		font-weight: 600;
		font-family: var(--font-mono);
		color: var(--text-3);
		padding: 2px 6px;
		background-color: var(--bg-3);
		border: 1px solid var(--bg-4);
		border-radius: 4px;
		pointer-events: all;
		transition: opacity 0.2s ease;
	}

	.search-wrapper :global(.input-container:focus-within .keyboard-shortcut) {
		opacity: 0;
	}

	.clear-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		padding: 0;
		background: none;
		border: none;
		border-radius: 50%;
		color: var(--text-3);
		cursor: pointer;
		pointer-events: all;
		transition: all var(--transition-fast);
	}

	.clear-button:hover {
		background-color: var(--bg-3);
		color: var(--text-1);
	}

	.clear-button:active {
		transform: scale(0.9);
	}
</style>
