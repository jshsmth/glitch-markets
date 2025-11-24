<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys } from '$lib/query/client';

	const queryClient = useQueryClient();

	/**
	 * Example 1: Basic query with prefetched data
	 *
	 * CRITICAL: In v6, arguments to createQuery must be wrapped in a function for reactivity!
	 * Note: No $ prefix needed - v6 uses runes, not stores
	 * This query will use the prefetched data from +page.ts, preventing loading states.
	 */
	const marketsQuery = createQuery(() => ({
		queryKey: queryKeys.markets.list({ limit: 10 }),
		queryFn: async () => {
			const response = await fetch('/api/markets?limit=10');
			if (!response.ok) {
				throw new Error('Failed to fetch markets');
			}
			return response.json();
		}
	}));

	/**
	 * Example 2: Query with reactive parameter
	 *
	 * This demonstrates how to create a query that depends on reactive state.
	 * Uncomment to see reactive queries in action.
	 */
	// let selectedMarketId = $state('some-market-id');
	//
	// const marketDetailQuery = createQuery(() => ({
	//   queryKey: queryKeys.markets.detail(selectedMarketId),
	//   queryFn: async () => {
	//     const response = await fetch(`/api/markets/${selectedMarketId}`);
	//     if (!response.ok) throw new Error('Failed to fetch market');
	//     return response.json();
	//   },
	//   // Only run query if we have a valid ID
	//   enabled: !!selectedMarketId
	// }));

	/**
	 * Example 3: Manual cache invalidation
	 */
	function refreshMarkets() {
		queryClient.invalidateQueries({ queryKey: queryKeys.markets.all });
	}
</script>

<div class="example-page">
	<h1>TanStack Query Example</h1>

	<section class="section">
		<h2>Example 1: Basic Query with Prefetching</h2>

		{#if marketsQuery.isPending}
			<p class="loading">Loading markets...</p>
		{:else if marketsQuery.isError}
			<p class="error">Error: {marketsQuery.error.message}</p>
		{:else if marketsQuery.isSuccess}
			<div class="success">
				<p><strong>Query succeeded!</strong></p>
				<p>Data fetched at: {new Date(marketsQuery.dataUpdatedAt).toLocaleTimeString()}</p>
				<p>Is stale: {marketsQuery.isStale ? 'Yes' : 'No'}</p>
				<pre>{JSON.stringify(marketsQuery.data, null, 2)}</pre>
			</div>
		{/if}

		<button onclick={refreshMarkets} class="refresh-btn">
			Invalidate & Refetch Markets
		</button>
	</section>

	<section class="section">
		<h2>Key Concepts</h2>
		<ul class="concepts">
			<li>
				<strong>Prefetching:</strong> Data is fetched on the server in +page.ts before rendering,
				preventing loading states
			</li>
			<li>
				<strong>Cache:</strong> The QueryClient maintains a cache keyed by queryKey, preventing
				duplicate requests
			</li>
			<li>
				<strong>Reactivity:</strong> Query options must be wrapped in a function (() => ({'{ ... }'}))
				for Svelte reactivity
			</li>
			<li>
				<strong>SSR-Safe:</strong> Queries are disabled on the server (via browser check) to prevent
				async issues
			</li>
			<li>
				<strong>Invalidation:</strong> Use queryClient.invalidateQueries() to manually refetch data
			</li>
		</ul>
	</section>

	<section class="section">
		<h2>Query States</h2>
		<div class="states">
			<div class="state">
				<strong>isPending:</strong>
				<code>{marketsQuery.isPending}</code>
			</div>
			<div class="state">
				<strong>isError:</strong>
				<code>{marketsQuery.isError}</code>
			</div>
			<div class="state">
				<strong>isSuccess:</strong>
				<code>{marketsQuery.isSuccess}</code>
			</div>
			<div class="state">
				<strong>isStale:</strong>
				<code>{marketsQuery.isStale}</code>
			</div>
			<div class="state">
				<strong>isFetching:</strong>
				<code>{marketsQuery.isFetching}</code>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Open Devtools</h2>
		<p>Click the TanStack Query icon in the bottom-right corner to inspect queries in real-time.</p>
	</section>
</div>

<style>
	.example-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
	}

	h1 {
		color: var(--text-primary);
		margin-bottom: 2rem;
	}

	h2 {
		color: var(--text-primary);
		margin-bottom: 1rem;
		font-size: 1.5rem;
	}

	.section {
		margin-bottom: 3rem;
		padding: 1.5rem;
		background: var(--bg-secondary);
		border-radius: 8px;
		border: 1px solid var(--border-primary);
	}

	.loading {
		color: var(--text-secondary);
		font-style: italic;
	}

	.error {
		color: var(--red-primary);
		background: var(--red-bg);
		padding: 1rem;
		border-radius: 4px;
		border: 1px solid var(--red-primary);
	}

	.success {
		background: var(--bg-primary);
		padding: 1rem;
		border-radius: 4px;
		border: 1px solid var(--border-primary);
	}

	.success p {
		margin: 0.5rem 0;
		color: var(--text-primary);
	}

	pre {
		background: var(--bg-primary);
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
		color: var(--text-primary);
		border: 1px solid var(--border-primary);
		margin-top: 1rem;
	}

	.refresh-btn {
		margin-top: 1rem;
		padding: 0.75rem 1.5rem;
		background: var(--purple-primary);
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 600;
		transition: background 0.2s;
	}

	.refresh-btn:hover {
		background: var(--purple-hover);
	}

	.concepts {
		list-style: none;
		padding: 0;
	}

	.concepts li {
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: var(--bg-primary);
		border-radius: 4px;
		border: 1px solid var(--border-primary);
		color: var(--text-primary);
	}

	.concepts strong {
		color: var(--purple-primary);
	}

	.states {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.state {
		padding: 1rem;
		background: var(--bg-primary);
		border-radius: 4px;
		border: 1px solid var(--border-primary);
	}

	.state strong {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
	}

	.state code {
		color: var(--purple-primary);
		font-weight: 600;
	}
</style>
