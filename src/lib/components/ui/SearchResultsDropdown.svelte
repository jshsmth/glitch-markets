<script lang="ts">
	import type { SearchResults } from '$lib/server/api/polymarket-client';
	import SearchResultItem from './SearchResultItem.svelte';
	import TagChip from './TagChip.svelte';
	import ProfileListItem from './ProfileListItem.svelte';
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte';

	interface Props {
		results: SearchResults | null;
		isLoading: boolean;
		query: string;
		onClose?: () => void;
	}

	let { results, isLoading, query, onClose }: Props = $props();

	const hasResults = $derived(
		results && (results.events.length > 0 || results.tags.length > 0 || results.profiles.length > 0)
	);

	const totalResults = $derived(results?.pagination.totalResults || 0);
	const hasMore = $derived(results?.pagination.hasMore || false);

	function handleLinkClick() {
		onClose?.();
	}
</script>

<div class="search-results-dropdown" role="listbox" aria-label="Search results">
	{#if isLoading}
		<!-- Loading State -->
		<div class="loading-state">
			<div class="spinner"></div>
			<p class="loading-text">Searching...</p>
		</div>
	{:else if hasResults && results}
		<!-- Events/Markets Section -->
		{#if results.events.length > 0}
			<section class="results-section">
				<div class="events-list">
					{#each results.events as event (event.id)}
						<SearchResultItem {event} onclick={handleLinkClick} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Tags/Topics Section -->
		{#if results.tags.length > 0}
			<section class="results-section">
				<h3 class="section-title">Topics</h3>
				<div class="tags-list">
					{#each results.tags as tag (tag.id)}
						<TagChip {tag} onclick={handleLinkClick} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Profiles Section -->
		{#if results.profiles.length > 0}
			<section class="results-section">
				<h3 class="section-title">Profiles</h3>
				<div class="profiles-list">
					{#each results.profiles as profile (profile.id)}
						<ProfileListItem {profile} onclick={handleLinkClick} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- View All Link -->
		{#if hasMore}
			<div class="view-all-footer">
				<a
					href="/search?q={encodeURIComponent(query)}"
					class="view-all-link"
					onclick={handleLinkClick}
				>
					View all {totalResults} results →
				</a>
			</div>
		{/if}
	{:else}
		<!-- Empty State -->
		<div class="empty-state">
			<SearchIcon size={32} color="var(--text-3)" />
			<p class="empty-title">No results found</p>
			<p class="empty-text">No markets, topics, or profiles found for "{query}"</p>
		</div>
	{/if}
</div>

<style>
	.search-results-dropdown {
		position: absolute;
		top: calc(100% + 12px);
		left: 0;
		right: 0;
		max-width: 600px;
		max-height: 80vh;
		overflow-y: auto;
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-lg);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
		z-index: var(--z-popover);
		padding: 16px;
		animation: dropdown-appear 0.12s cubic-bezier(0.16, 1, 0.3, 1);
	}

	:global([data-theme='dark']) .search-results-dropdown {
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.3),
			0 4px 6px -2px rgba(0, 0, 0, 0.15);
	}

	@keyframes dropdown-appear {
		from {
			opacity: 0;
			transform: translateY(-4px) scale(0.97);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* Loading State */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 32px 16px;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 3px solid var(--bg-3);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-text {
		font-size: 14px;
		color: var(--text-2);
		margin: 0;
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 32px 16px;
		text-align: center;
	}

	.empty-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--text-0);
		margin: 0;
	}

	.empty-text {
		font-size: 13px;
		color: var(--text-2);
		margin: 0;
		max-width: 300px;
	}

	/* Results Sections */
	.results-section {
		margin-bottom: 20px;
	}

	.results-section:last-of-type {
		margin-bottom: 0;
	}

	.section-title {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-2);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 12px 0;
		padding: 0 4px;
	}

	/* Events List */
	.events-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	/* Tags List */
	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	/* Profiles List */
	.profiles-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	/* View All Footer */
	.view-all-footer {
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid var(--bg-4);
	}

	.view-all-link {
		display: block;
		width: 100%;
		padding: 8px 12px;
		text-align: left;
		font-size: 13px;
		font-weight: 600;
		color: var(--primary);
		text-decoration: none;
		border-radius: var(--radius-md);
		transition: background-color 0.15s ease;
	}

	.view-all-link:hover {
		background-color: var(--primary-hover-bg);
		text-decoration: underline;
	}

	.view-all-link:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	/* Scrollbar Styling */
	.search-results-dropdown::-webkit-scrollbar {
		width: 8px;
	}

	.search-results-dropdown::-webkit-scrollbar-track {
		background: var(--bg-2);
		border-radius: 4px;
	}

	.search-results-dropdown::-webkit-scrollbar-thumb {
		background: var(--bg-4);
		border-radius: 4px;
	}

	.search-results-dropdown::-webkit-scrollbar-thumb:hover {
		background: var(--text-3);
	}
</style>
