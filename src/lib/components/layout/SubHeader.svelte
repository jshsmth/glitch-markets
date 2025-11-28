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
	import ChevronDownIcon from '$lib/components/icons/ChevronDownIcon.svelte';

	interface Category {
		name: string;
		href: string;
		icon?: Component;
		dropdown?: boolean;
	}

	// Primary filters - most important/frequently used
	const primaryCategories: Category[] = [
		{ name: 'Trending', href: '/?category=trending', icon: RocketIcon },
		{ name: 'Breaking', href: '/?category=breaking', icon: FlashIcon },
		{ name: 'New', href: '/?category=new', icon: StarsIcon },
		{ name: 'Politics', href: '/?category=politics', icon: CourthouseIcon },
		{ name: 'Sports', href: '/?category=sports', icon: CupIcon },
		{ name: 'Finance', href: '/?category=finance', icon: DollarCircleIcon },
		{ name: 'Crypto', href: '/?category=crypto', icon: BitcoinCardIcon },
		{ name: 'Tech', href: '/?category=tech', icon: DocumentTextIcon }
	];

	// Secondary filters - additional categories
	const secondaryCategories: Category[] = [
		{ name: 'Culture', href: '/?category=culture', icon: TicketIcon },
		{ name: 'World', href: '/?category=world', icon: GlobalEditIcon },
		{ name: 'Economy', href: '/?category=economy', icon: DollarChangeIcon },
		{ name: 'Elections', href: '/?category=elections', icon: SpeakerIcon },
		{ name: 'Earnings', href: '/?category=earnings', icon: DollarSquareIcon },
		{ name: 'Geopolitics', href: '/?category=geopolitics', icon: GlobalIcon },
		{ name: 'Mentions', href: '/?category=mentions', icon: MessageTextIcon }
	];

	let activeCategory = $derived(page.url.searchParams.get('category') || 'trending');
</script>

<div class="sub-header">
	<nav class="nav-container">
		<!-- Primary Row -->
		<div class="nav-scroll">
			<ul class="nav-list">
				{#each primaryCategories as category (category.name)}
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
		</div>

		<!-- Secondary Row -->
		<div class="nav-scroll secondary">
			<ul class="nav-list">
				{#each secondaryCategories as category (category.name)}
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
		</div>
	</nav>
</div>

<style>
	.sub-header {
		background-color: var(--bg-0);
		border-bottom: 1px solid var(--bg-3);
	}

	.nav-container {
		max-width: 1400px;
		margin: 0 auto;
	}

	.nav-scroll {
		overflow-x: auto;
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE/Edge */
		-webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
	}

	.nav-scroll::-webkit-scrollbar {
		display: none;
	}

	.nav-scroll.secondary {
		border-top: 1px solid var(--bg-2);
	}

	.nav-list {
		display: flex;
		align-items: center;
		gap: 16px;
		list-style: none;
		margin: 0;
		padding: 0 12px;
		min-height: 44px;
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
		min-height: 44px;
		border-bottom: 2px solid transparent;
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

	/* Icons inherit the link color automatically via currentColor */
	.nav-link :global(svg) {
		flex-shrink: 0;
		transition: transform 0.2s ease;
	}

	/* Secondary row styling - slightly less emphasis */
	.nav-scroll.secondary .nav-link {
		font-size: 13px;
		color: var(--text-3);
	}

	.nav-scroll.secondary .nav-link:hover {
		color: var(--text-2);
	}

	.nav-scroll.secondary .nav-link.active {
		color: var(--text-0);
	}

	/* Desktop: Polished two-row layout */
	@media (min-width: 768px) {
		.nav-list {
			padding: 0 24px;
			gap: 24px;
		}

		.nav-list li:first-child .nav-link {
			padding-left: 0;
		}

		/* Add subtle fade indicators on edges */
		.nav-scroll {
			position: relative;
		}

		.nav-scroll::after {
			content: '';
			position: absolute;
			top: 0;
			right: 0;
			width: 40px;
			height: 100%;
			background: linear-gradient(to left, var(--bg-0), transparent);
			pointer-events: none;
		}

		.nav-scroll::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			width: 40px;
			height: 100%;
			background: linear-gradient(to right, var(--bg-0), transparent);
			pointer-events: none;
			opacity: 0;
			transition: opacity 0.2s;
		}
	}

	@media (min-width: 1024px) {
		/* More compact on desktop */
		.nav-list {
			min-height: 40px;
			gap: 20px;
		}

		.nav-link {
			min-height: 40px;
		}

		/* Make secondary categories same size on desktop */
		.nav-scroll.secondary .nav-link {
			font-size: 14px;
			color: var(--text-2);
		}
	}
</style>
