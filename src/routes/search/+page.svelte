<script lang="ts">
	import Search from '$lib/components/ui/Search.svelte';
	import SearchResultItem from '$lib/components/ui/SearchResultItem.svelte';
	import TagChip from '$lib/components/ui/TagChip.svelte';
	import ProfileListItem from '$lib/components/ui/ProfileListItem.svelte';
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte';
	import { categories } from '$lib/config/categories';
	import type { SearchResults } from '$lib/server/api/polymarket-client';
	import { debounceCancellable } from '$lib/utils/debounce';

	let searchQuery = $state('');
	let searchResults = $state<SearchResults | null>(null);
	let isLoading = $state(false);
	let abortController: AbortController | null = null;
	let searchInputElement = $state<HTMLInputElement | undefined>();

	const hasResults = $derived(
		searchResults &&
			(searchResults.events.length > 0 ||
				searchResults.tags.length > 0 ||
				searchResults.profiles.length > 0)
	);

	const showBrowse = $derived(!isLoading && !hasResults && searchQuery.length === 0);

	const browseFilters = $derived(categories.filter((c) => c.href === '/' || c.href === '/new'));
	const popularTopics = $derived(categories.filter((c) => c.href !== '/' && c.href !== '/new'));

	async function performSearch(query: string) {
		if (query.length < 2) {
			searchResults = null;
			isLoading = false;
			return;
		}

		abortController?.abort();
		abortController = new AbortController();

		isLoading = true;

		try {
			const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit_per_type=10`, {
				signal: abortController.signal
			});

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

	const { debounced: debouncedSearch, cancel: cancelSearch } = debounceCancellable(
		performSearch,
		300
	);

	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const query = target.value.trim();

		searchQuery = query;

		if (query.length < 2) {
			searchResults = null;
			isLoading = false;
			return;
		}

		isLoading = true;
		debouncedSearch(query);
	}

	$effect(() => {
		return () => {
			cancelSearch();
			abortController?.abort();
		};
	});

	$effect(() => {
		if (searchInputElement) {
			searchInputElement.focus();
		}
	});
</script>

<div class="page-container">
	<div class="search-header">
		<Search
			bind:value={searchQuery}
			bind:inputElement={searchInputElement}
			placeholder="Search markets, topics, people..."
			oninput={handleSearchInput}
			showShortcut={false}
			inputSize="large"
		/>
	</div>

	<div class="search-content">
		{#if isLoading}
			<div class="loading-state">
				<div class="spinner"></div>
				<p class="loading-text">Searching...</p>
			</div>
		{:else if hasResults && searchResults}
			{#if searchResults.events.length > 0}
				<section class="results-section">
					<h3 class="section-title">Markets</h3>
					<div class="events-list">
						{#each searchResults.events as event (event.id)}
							<SearchResultItem {event} />
						{/each}
					</div>
				</section>
			{/if}

			{#if searchResults.tags.length > 0}
				<section class="results-section">
					<h3 class="section-title">Topics</h3>
					<div class="tags-list">
						{#each searchResults.tags as tag (tag.id)}
							<TagChip {tag} />
						{/each}
					</div>
				</section>
			{/if}

			{#if searchResults.profiles.length > 0}
				<section class="results-section">
					<h3 class="section-title">Profiles</h3>
					<div class="profiles-list">
						{#each searchResults.profiles as profile (profile.id)}
							<ProfileListItem {profile} />
						{/each}
					</div>
				</section>
			{/if}
		{:else if showBrowse}
			<div class="browse-state">
				<section class="browse-section">
					<h3 class="section-title">Browse</h3>
					<div class="browse-filters">
						{#each browseFilters as filter (filter.name)}
							{@const Icon = filter.icon}
							<a href={filter.href} class="browse-filter">
								{#if Icon}
									<span class="filter-icon">
										<Icon size={20} color="currentColor" />
									</span>
								{/if}
								<span class="filter-label">{filter.name}</span>
							</a>
						{/each}
					</div>
				</section>

				<section class="browse-section">
					<h3 class="section-title">Popular Topics</h3>
					<div class="topics-grid">
						{#each popularTopics as topic (topic.name)}
							{@const Icon = topic.icon}
							<a href={topic.href} class="topic-card">
								{#if Icon}
									<span class="topic-icon">
										<Icon size={24} color="currentColor" />
									</span>
								{/if}
								<span class="topic-label">{topic.name}</span>
							</a>
						{/each}
					</div>
				</section>
			</div>
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
		max-width: 600px;
		margin: 0 auto;
		padding: var(--space-md) 12px;
		padding-bottom: 100px;
	}

	@media (min-width: 768px) {
		.page-container {
			padding: var(--space-lg) 24px;
		}
	}

	.search-header {
		margin-bottom: var(--space-lg);
	}

	.search-content {
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
		margin-bottom: 24px;
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

	/* Profiles List */
	.profiles-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	/* Browse State */
	.browse-state {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.browse-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.browse-filters {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.browse-filter {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 18px;
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-md);
		text-decoration: none;
		font-size: 15px;
		font-weight: 500;
		color: var(--text-0);
		transition: all 0.15s ease;
	}

	.browse-filter:hover {
		background-color: var(--primary-hover-bg);
		border-color: var(--primary);
		transform: translateY(-1px);
	}

	.browse-filter:active {
		transform: translateY(0);
	}

	.filter-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-1);
	}

	.filter-label {
		font-weight: 600;
	}

	.topics-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10px;
	}

	@media (min-width: 400px) {
		.topics-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.topic-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 16px 12px;
		background: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: var(--text-0);
		transition: all 0.15s ease;
	}

	.topic-card:hover {
		background-color: var(--primary-hover-bg);
		border-color: var(--primary);
		transform: translateY(-2px);
	}

	.topic-card:active {
		transform: translateY(0);
	}

	.topic-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-1);
	}

	.topic-label {
		font-size: 13px;
		font-weight: 600;
	}
</style>
