<script lang="ts">
	import type { ParsedSegment } from '$lib/utils/text-parser';
	import { formatNumber } from '$lib/utils/format';
	import { formatDate } from '$lib/utils/event-helpers';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
	import MoneyIcon from '$lib/components/icons/MoneyIcon.svelte';
	import GlobalIcon from '$lib/components/icons/GlobalIcon.svelte';
	import XIcon from '$lib/components/icons/XIcon.svelte';
	import GitHubIcon from '$lib/components/icons/GitHubIcon.svelte';
	import LinkedInIcon from '$lib/components/icons/LinkedInIcon.svelte';
	import DiscordIcon from '$lib/components/icons/DiscordIcon.svelte';

	interface Props {
		description: string | null;
		parsedDescription: ParsedSegment[];
		endDate: string | null;
		volume: number | null;
	}

	let { description, parsedDescription, endDate, volume }: Props = $props();
</script>

{#if description}
	<div class="about-content">
		<p class="about-text">
			{#each parsedDescription as segment, i (i)}{#if segment.type === 'text'}{segment.content}{:else}<a
						href={segment.content}
						target="_blank"
						rel="noopener noreferrer"
						class="rules-link"
						>{#if segment.iconType === 'x'}<XIcon
								size={12}
							/>{:else if segment.iconType === 'github'}<GitHubIcon
								size={12}
							/>{:else if segment.iconType === 'linkedin'}<LinkedInIcon
								size={12}
							/>{:else if segment.iconType === 'discord'}<DiscordIcon size={12} />{:else}<GlobalIcon
								size={12}
							/>{/if}<span>{segment.domain}</span></a
					>{/if}{/each}
		</p>
		{#if endDate}
			<div class="about-meta">
				<div class="meta-row">
					<CalendarIcon size={14} />
					<span>Ends {formatDate(endDate)}</span>
				</div>
			</div>
		{/if}
		{#if volume}
			<div class="about-meta">
				<div class="meta-row">
					<MoneyIcon size={14} />
					<span>{formatNumber(volume)} Volume</span>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<div class="tab-empty">No description available</div>
{/if}

<style>
	.about-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4);
	}

	.about-text {
		font-size: 14px;
		line-height: 1.6;
		color: var(--text-1);
		margin: 0;
		white-space: pre-wrap;
	}

	.rules-link {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
		padding: 2px 6px;
		background: var(--bg-2);
		border-radius: var(--radius-sm);
		color: var(--primary);
		text-decoration: none;
		font-size: 12px;
	}

	.rules-link span {
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.about-meta {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
		padding-top: var(--spacing-3);
		border-top: 1px solid var(--bg-3);
	}

	.meta-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		font-size: 13px;
		color: var(--text-2);
	}

	.tab-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100px;
		color: var(--text-3);
		font-size: 14px;
	}
</style>
