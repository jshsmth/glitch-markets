<script lang="ts">
	import { page } from '$app/stores';
	import SearchResultItem from '$lib/components/ui/SearchResultItem.svelte';
	import TagChip from '$lib/components/ui/TagChip.svelte';
	import ProfileListItem from '$lib/components/ui/ProfileListItem.svelte';
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte';
	import ChevronLeftIcon from '$lib/components/icons/ChevronLeftIcon.svelte';
	import type { SearchResults } from '$lib/server/api/polymarket-client';
	import { Logger } from '$lib/utils/logger';

	const log = Logger.forComponent('ResultsPage');

	let searchResults = $state<SearchResults | null>(null);
	let isLoading = $state(false);
	let isLoadingMore = $state(false);
	let abortController: AbortController | null = null;
	let currentPage = $state(1);

	const RESULTS_PER_PAGE = 20;

	const searchQuery = $derived($page.url.searchParams.get('q') || '');

	const hasResults = $derived(
		searchResults &&
			(searchResults.events.length > 0 ||
				searchResults.tags.length > 0 ||
				searchResults.profiles.length > 0)
	);

	const canLoadMore = $derived(searchResults?.pagination?.hasMore ?? false);

	async function performSearch(query: string) {
		if (query.length < 2) {
			searchResults = null;
			isLoading = false;
			return;
		}

		abortController?.abort();
		abortController = new AbortController();

		isLoading = true;
		currentPage = 1;

		try {
			const response = await fetch(
				`/api/search?q=${encodeURIComponent(query)}&limit_per_type=${RESULTS_PER_PAGE}`,
				{
					signal: abortController.signal
				}
			);

			if (!response.ok) {
				throw new Error(`Search failed: ${response.statusText}`);
			}

			const data = await response.json();
			searchResults = data;
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				return;
			}
			searchResults = null;
		} finally {
			isLoading = false;
		}
	}

	async function loadMore() {
		if (!searchQuery || isLoadingMore || !searchResults || !canLoadMore) return;

		log.debug('Starting load more', {
			currentPage,
			isLoadingMore,
			canLoadMore,
			currentCounts: {
				events: searchResults.events?.length,
				tags: searchResults.tags?.length,
				profiles: searchResults.profiles?.length
			}
		});

		isLoadingMore = true;
		const nextPage = currentPage + 1;

		try {
			const response = await fetch(
				`/api/search?q=${encodeURIComponent(searchQuery)}&limit_per_type=${RESULTS_PER_PAGE}&page=${nextPage}`,
				{
					signal: abortController?.signal
				}
			);

			if (!response.ok) {
				throw new Error(`Search failed: ${response.statusText}`);
			}

			const data: SearchResults = await response.json();

			log.debug('Received paginated data', {
				newEvents: data.events?.length,
				newTags: data.tags?.length,
				newProfiles: data.profiles?.length,
				pagination: data.pagination
			});

			searchResults = {
				events: [...(searchResults.events || []), ...(data.events || [])],
				tags: [...(searchResults.tags || []), ...(data.tags || [])],
				profiles: [...(searchResults.profiles || []), ...(data.profiles || [])],
				pagination: data.pagination
			};
			currentPage = nextPage;

			log.info('Loaded more results', {
				totalEvents: searchResults.events.length,
				totalTags: searchResults.tags.length,
				totalProfiles: searchResults.profiles.length,
				newPage: currentPage
			});
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				log.debug('Load more request aborted');
				return;
			}
			log.error('Error loading more results', error);
		} finally {
			isLoadingMore = false;
		}
	}

	$effect(() => {
		if (searchQuery && searchQuery.length >= 2) {
			performSearch(searchQuery);
		}
	});

	$effect(() => {
		return () => {
			abortController?.abort();
		};
	});
</script>

<div class="page-container">
	<div class="results-header">
		<a href="/" class="back-button">
			<ChevronLeftIcon size={18} />
			<span>Back</span>
		</a>
		{#if searchQuery}
			<h1 class="search-query">Results for "{searchQuery}"</h1>
		{/if}
	</div>

	<div class="results-content">
		{#if isLoading}
			<div class="loading-state">
				<div class="spinner"></div>
				<p class="loading-text">Searching...</p>
			</div>
		{:else if hasResults && searchResults}
			{#if searchResults.events.length > 0}
				<section class="results-section">
					<h3 class="section-title">Markets ({searchResults.events.length})</h3>
					<div class="events-list">
						{#each searchResults.events as event (event.id)}
							<SearchResultItem {event} />
						{/each}
					</div>
				</section>
			{/if}

			{#if searchResults.tags.length > 0}
				<section class="results-section">
					<h3 class="section-title">Topics ({searchResults.tags.length})</h3>
					<div class="tags-list">
						{#each searchResults.tags as tag (tag.id)}
							<TagChip {tag} />
						{/each}
					</div>
				</section>
			{/if}

			{#if searchResults.profiles.length > 0}
				<section class="results-section">
					<h3 class="section-title">Profiles ({searchResults.profiles.length})</h3>
					<div class="profiles-list">
						{#each searchResults.profiles as profile (profile.id)}
							<ProfileListItem {profile} />
						{/each}
					</div>
				</section>
			{/if}

			{#if canLoadMore}
				<div class="load-more-container">
					<button class="load-more-btn" onclick={loadMore} disabled={isLoadingMore}>
						{#if isLoadingMore}
							<div class="btn-spinner"></div>
							<span>Loading...</span>
						{:else}
							<span>Load More Results</span>
						{/if}
					</button>
				</div>
			{/if}
		{:else if searchQuery.length > 0}
			<div class="empty-state">
				<SearchIcon size={48} color="var(--text-3)" />
				<p class="empty-title">No results found</p>
				<p class="empty-text">No markets, topics, or profiles found for "{searchQuery}"</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-lg) 24px;
		padding-bottom: 100px;
	}

	@media (min-width: 1024px) {
		.page-container {
			padding: var(--space-xl) 32px;
		}
	}

	.results-header {
		margin-bottom: var(--space-lg);
	}

	.back-button {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
		padding: var(--spacing-2) 0;
		margin-bottom: 16px;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-2);
		text-decoration: none;
	}

	.back-button:hover {
		color: var(--primary);
	}

	.search-query {
		font-size: 24px;
		font-weight: 700;
		color: var(--text-0);
		margin: 0;
	}

	@media (min-width: 768px) {
		.search-query {
			font-size: 28px;
		}
	}

	@media (min-width: 1024px) {
		.search-query {
			font-size: 32px;
		}
	}

	.results-content {
		min-height: 300px;
	}

	/* Loading State */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 48px 16px;
	}

	.spinner {
		width: 32px;
		height: 32px;
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
		gap: 12px;
		padding: 48px 16px;
		text-align: center;
	}

	.empty-title {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-0);
		margin: 0;
	}

	.empty-text {
		font-size: 14px;
		color: var(--text-2);
		margin: 0;
		max-width: 300px;
	}

	/* Results Sections */
	.results-section {
		margin-bottom: 32px;
	}

	.results-section:last-of-type {
		margin-bottom: 0;
	}

	@media (min-width: 1024px) {
		.results-section {
			margin-bottom: 40px;
		}
	}

	.section-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-2);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 16px 0;
	}

	@media (min-width: 1024px) {
		.section-title {
			font-size: 14px;
			margin: 0 0 18px 0;
		}
	}

	/* Events List */
	.events-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	/* Tags List */
	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	@media (min-width: 768px) {
		.tags-list {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
			gap: 10px;
		}
	}

	@media (min-width: 1024px) {
		.tags-list {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			gap: 12px;
		}
	}

	/* Profiles List */
	.profiles-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	/* Load More Container */
	.load-more-container {
		margin-top: 24px;
		padding-top: 24px;
		border-top: 1px solid var(--bg-3);
	}

	/* Load More Button */
	.load-more-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		padding: 14px 24px;
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-md);
		color: var(--text-0);
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
		min-height: 48px;
	}

	.load-more-btn:hover:not(:disabled) {
		background: var(--primary-hover-bg);
		border-color: var(--primary);
		color: var(--primary);
	}

	.load-more-btn:active:not(:disabled) {
		transform: scale(0.98);
	}

	.load-more-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid var(--bg-4);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
</style>
