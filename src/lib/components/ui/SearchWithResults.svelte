<script lang="ts">
	import Search from './Search.svelte';
	import SearchResultsDropdown from './SearchResultsDropdown.svelte';
	import type { SearchResults } from '$lib/server/api/polymarket-client';

	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();

	let searchQuery = $state('');
	let searchResults = $state<SearchResults | null>(null);
	let isLoading = $state(false);
	let showDropdown = $state(false);
	let abortController: AbortController | null = null;
	let wrapperElement = $state<HTMLDivElement | undefined>();

	function handleFocus() {
		showDropdown = true;
	}

	async function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const query = target.value.trim();

		searchQuery = query;

		// Show dropdown even for empty queries (browse state)
		showDropdown = true;

		// Don't search for queries less than 2 characters
		if (query.length < 2) {
			searchResults = null;
			return;
		}

		// Cancel previous request
		abortController?.abort();
		abortController = new AbortController();

		isLoading = true;

		try {
			const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit_per_type=5`, {
				signal: abortController.signal
			});

			if (!response.ok) {
				throw new Error(`Search failed: ${response.statusText}`);
			}

			const data = await response.json();
			searchResults = data;
			showDropdown = true;
		} catch (error) {
			// Ignore abort errors (expected when canceling requests)
			if (error instanceof Error && error.name === 'AbortError') {
				return;
			}

			console.error('Search failed:', error);
			searchResults = null;
			showDropdown = false;
		} finally {
			isLoading = false;
		}
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (wrapperElement && !wrapperElement.contains(target)) {
			showDropdown = false;
		}
	}

	function handleEscape(event: KeyboardEvent) {
		if (event.key === 'Escape' && showDropdown) {
			showDropdown = false;
			event.preventDefault();
		}
	}

	function handleClose() {
		showDropdown = false;
	}

	function handleClear() {
		searchQuery = '';
		searchResults = null;
		showDropdown = false;
	}

	// Watch for value changes to handle clear button
	$effect(() => {
		if (searchQuery.length === 0) {
			handleClear();
		}
	});
</script>

<svelte:window onkeydown={handleEscape} onclick={handleClickOutside} />

<div class="search-with-results {className || ''}" bind:this={wrapperElement}>
	<Search
		bind:value={searchQuery}
		placeholder="Find the Glitch"
		oninput={handleSearchInput}
		onfocus={handleFocus}
		showShortcut={true}
		inputSize="medium"
	/>

	{#if showDropdown}
		<SearchResultsDropdown
			results={searchResults}
			{isLoading}
			query={searchQuery}
			onClose={handleClose}
		/>
	{/if}
</div>

<style>
	.search-with-results {
		position: relative;
		width: 100%;
	}
</style>
