<script lang="ts">
	import { page } from '$app/stores';
	import ChevronLeftIcon from '$lib/components/icons/ChevronLeftIcon.svelte';
	import CopyIcon from '$lib/components/icons/CopyIcon.svelte';
	import CheckCircleIcon from '$lib/components/icons/CheckCircleIcon.svelte';
	import { Logger } from '$lib/utils/logger';

	const log = Logger.forComponent('EventHeader');

	interface Props {
		title: string;
		image?: string | null;
	}

	let { title, image }: Props = $props();

	let copyState = $state<'idle' | 'copied'>('idle');

	async function copyShareLink() {
		try {
			await navigator.clipboard.writeText($page.url.href);
			copyState = 'copied';
			setTimeout(() => (copyState = 'idle'), 2000);
		} catch (error) {
			log.error('Failed to copy link', error);
			copyState = 'idle';
		}
	}
</script>

<div class="event-header-wrapper">
	<!-- Back Link -->
	<a href="/" class="back-link">
		<ChevronLeftIcon size={18} />
		<span>Back</span>
	</a>

	<!-- Header -->
	<header class="event-header">
		<div class="header-row">
			{#if image}
				<img src={image} alt={title || 'Event icon'} class="event-icon" />
			{/if}
			<h1 class="event-title">{title || 'Untitled Event'}</h1>
			<button
				class="share-btn"
				class:copied={copyState === 'copied'}
				onclick={copyShareLink}
				aria-label="Copy link"
			>
				{#if copyState === 'copied'}
					<CheckCircleIcon size={18} />
				{:else}
					<CopyIcon size={18} />
				{/if}
			</button>
		</div>
	</header>
</div>

<style>
	.event-header-wrapper {
		margin-bottom: 16px;
	}

	/* Back Link */
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 8px 0;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-2);
		text-decoration: none;
	}

	.back-link:hover {
		color: var(--primary);
	}

	/* Header */
	.event-header {
		margin-top: 8px;
	}

	.header-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.event-icon {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		object-fit: cover;
		flex-shrink: 0;
		border: 1.5px solid var(--bg-3);
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.02);
	}

	.event-title {
		font-size: 18px;
		font-weight: 700;
		color: var(--text-0);
		line-height: 1.3;
		margin: 0;
		flex: 1;
		min-width: 0;
	}

	.share-btn {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-2);
		border: 1px solid var(--bg-3);
		border-radius: 8px;
		color: var(--text-2);
		cursor: pointer;
		flex-shrink: 0;
		transition: all var(--transition-fast);
	}

	.share-btn:hover {
		color: var(--primary);
		border-color: var(--bg-4);
	}

	.share-btn.copied {
		color: var(--gold-dark);
		border-color: var(--gold-base);
		background: rgba(var(--gold-rgb), 0.1);
	}

	@media (min-width: 768px) {
		.event-title {
			font-size: 20px;
		}

		.event-icon {
			width: 48px;
			height: 48px;
		}
	}

	@media (min-width: 1024px) {
		.event-title {
			font-size: 24px;
		}

		.event-icon {
			width: 56px;
			height: 56px;
		}
	}
</style>
