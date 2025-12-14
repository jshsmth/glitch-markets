<script lang="ts">
	import type { SearchTag } from '$lib/server/api/polymarket-client';

	interface Props {
		tag: SearchTag;
		onclick?: () => void;
	}

	let { tag, onclick }: Props = $props();

	const mainCategories = [
		'tech',
		'politics',
		'crypto',
		'sports',
		'pop-culture',
		'finance',
		'economy',
		'world',
		'geopolitics',
		'ai',
		'middle-east'
	];

	const slug = $derived(tag.slug || '');
	const isMainCategory = $derived(mainCategories.includes(slug.toLowerCase()));
	const href = $derived(isMainCategory ? `/${slug}` : `/search?q=${encodeURIComponent(slug)}`);
</script>

<a {href} class="tag-chip" {onclick} role="button" tabindex="0">
	<span class="tag-label">{tag.label || 'Unknown'}</span>
	{#if tag.eventCount !== null && tag.eventCount !== undefined}
		<span class="tag-count">{tag.eventCount}</span>
	{/if}
</a>

<style>
	.tag-chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background-color: var(--bg-2);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-button);
		font-size: 13px;
		font-weight: 500;
		color: var(--text-0);
		text-decoration: none;
		cursor: pointer;
		transition: all 0.15s ease;
		user-select: none;
	}

	.tag-chip:hover {
		background-color: var(--primary-hover-bg);
		border-color: rgba(var(--primary-rgb), 0.3);
	}

	.tag-chip:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.tag-chip:active {
		transform: scale(0.98);
	}

	.tag-label {
		color: var(--text-0);
	}

	.tag-count {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-2);
		padding: 2px 6px;
		background-color: var(--bg-3);
		border-radius: 4px;
	}

	.tag-chip:hover .tag-count {
		background-color: var(--bg-4);
	}
</style>
