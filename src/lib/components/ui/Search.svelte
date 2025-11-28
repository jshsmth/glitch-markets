<script lang="ts">
	import Input from './Input.svelte';
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte';

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
		 * Input handler
		 */
		oninput?: (event: Event) => void;

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
		showShortcut = true,
		inputSize = 'medium',
		class: className
	}: Props = $props();

	let inputElement = $state<HTMLInputElement>();

	// Listen for "/" key to focus search
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === '/' && event.target !== inputElement) {
			event.preventDefault();
			inputElement?.focus();
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="search-wrapper {className || ''}">
	<Input
		bind:inputElement
		bind:value
		type="search"
		{placeholder}
		{oninput}
		{inputSize}
		variant="search"
		aria-label="Search"
	>
		{#snippet iconBefore()}
			<SearchIcon size={16} color="currentColor" />
		{/snippet}

		{#snippet iconAfter()}
			{#if showShortcut}
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
</style>
