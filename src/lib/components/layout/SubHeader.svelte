<script lang="ts">
	import { page } from '$app/state';
	import type { Component } from 'svelte';
	import {
		RocketIcon,
		FlashIcon,
		StarsIcon,
		CourthouseIcon,
		CupIcon,
		DollarCircleIcon,
		BitcoinCardIcon,
		GlobalIcon,
		DollarSquareIcon,
		DocumentTextIcon,
		TicketIcon,
		GlobalEditIcon,
		DollarChangeIcon,
		SpeakerIcon,
		MessageTextIcon
	} from '$lib/components/icons';

	interface Category {
		name: string;
		href: string;
		icon?: Component;
		dropdown?: boolean;
	}

	const categories: Category[] = [
		{ name: 'Trending', href: '/?category=trending', icon: RocketIcon },
		{ name: 'Breaking', href: '/?category=breaking', icon: FlashIcon },
		{ name: 'New', href: '/?category=new', icon: StarsIcon },
		{ name: 'Politics', href: '/?category=politics', icon: CourthouseIcon },
		{ name: 'Sports', href: '/?category=sports', icon: CupIcon },
		{ name: 'Finance', href: '/?category=finance', icon: DollarCircleIcon },
		{ name: 'Crypto', href: '/?category=crypto', icon: BitcoinCardIcon },
		{ name: 'Tech', href: '/?category=tech', icon: DocumentTextIcon },
		{ name: 'Culture', href: '/?category=culture', icon: TicketIcon },
		{ name: 'World', href: '/?category=world', icon: GlobalEditIcon },
		{ name: 'Economy', href: '/?category=economy', icon: DollarChangeIcon },
		{ name: 'Elections', href: '/?category=elections', icon: SpeakerIcon },
		{ name: 'Earnings', href: '/?category=earnings', icon: DollarSquareIcon },
		{ name: 'Geopolitics', href: '/?category=geopolitics', icon: GlobalIcon },
		{ name: 'Mentions', href: '/?category=mentions', icon: MessageTextIcon }
	];

	let activeCategory = $derived(page.url.searchParams.get('category') || 'trending');
	let scrollContainer = $state<HTMLDivElement>();
	let showSwipeHint = $state(false);
	let hasOverflow = $state(false);

	function handleScroll() {
		if (!scrollContainer) return;

		const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
		hasOverflow = scrollWidth > clientWidth;

		// Hide swipe hint after user scrolls
		if (scrollLeft > 5) {
			showSwipeHint = false;
		}
	}

	$effect(() => {
		if (scrollContainer) {
			handleScroll();
			// Show swipe hint only if there's overflow
			if (hasOverflow) {
				showSwipeHint = true;
				// Auto-hide swipe hint after 3 seconds
				const timeout = setTimeout(() => {
					showSwipeHint = false;
				}, 3000);
				return () => clearTimeout(timeout);
			}
		}
	});
</script>

<div class="sub-header">
	<nav class="nav-container">
		<div class="nav-scroll" bind:this={scrollContainer} onscroll={handleScroll}>
			<ul class="nav-list">
				{#each categories as category (category.name)}
					<li class="nav-item">
						<a
							href={category.href}
							class="nav-link"
							class:active={activeCategory === category.name.toLowerCase()}
						>
							{#if category.icon}
								{@const Icon = category.icon}
								<Icon size={16} />
							{/if}
							{category.name}
						</a>
					</li>
				{/each}
			</ul>

			{#if showSwipeHint}
				<div class="swipe-hint">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
						<path
							d="M9 18L15 12L9 6"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
			{/if}
		</div>
	</nav>
</div>

<style>
	.sub-header {
		background-color: var(--bg-0);
		border-bottom: 1px solid var(--bg-3);
	}

	.nav-container {
		position: relative;
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		align-items: center;
	}

	.nav-scroll {
		position: relative;
		overflow-x: auto;
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE/Edge */
		-webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
		flex: 1;
		padding: 0 12px;
	}

	.nav-scroll::-webkit-scrollbar {
		display: none;
	}

	.nav-list {
		display: flex;
		align-items: center;
		gap: 16px;
		list-style: none;
		margin: 0;
		padding: 0;
		min-height: 48px;
	}

	.nav-link {
		position: relative;
		display: flex;
		align-items: center;
		gap: 4px;
		text-decoration: none;
		color: var(--text-2);
		font-size: 14px;
		font-weight: 600;
		white-space: nowrap;
		min-height: 48px;
		padding-bottom: 2px;
		transition: color 0.2s ease;
	}

	.nav-link:hover {
		color: var(--text-1);
	}

	.nav-link:hover :global(svg) {
		transform: scale(1.1);
		transition: transform 0.2s ease;
	}

	.nav-link.active {
		color: var(--text-0);
	}

	.nav-link.active::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--text-0);
		animation: slideIn 0.3s ease;
		transform-origin: left;
	}

	@keyframes slideIn {
		from {
			transform: scaleX(0);
		}
		to {
			transform: scaleX(1);
		}
	}

	.nav-link :global(svg) {
		flex-shrink: 0;
		transition: transform 0.2s ease;
	}

	/* Swipe Hint - Mobile only */
	.swipe-hint {
		display: flex;
		align-items: center;
		justify-content: center;
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		width: 48px;
		background: linear-gradient(to left, var(--bg-0) 60%, transparent);
		color: var(--text-1);
		animation: swipeAnimation 1.5s ease-in-out infinite;
		pointer-events: none;
		z-index: 5;
	}

	@keyframes swipeAnimation {
		0%,
		100% {
			opacity: 0.8;
		}
		50% {
			opacity: 0.4;
		}
	}

	.swipe-hint svg {
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
	}

	/* Desktop styles */
	@media (min-width: 768px) {
		.nav-scroll {
			padding: 0 24px;
		}

		.nav-list {
			gap: 24px;
			min-height: 44px;
		}

		.nav-link {
			min-height: 44px;
		}

		/* Hide swipe hint on desktop */
		.swipe-hint {
			display: none;
		}
	}

	@media (min-width: 1024px) {
		.nav-list {
			gap: 20px;
		}
	}
</style>
