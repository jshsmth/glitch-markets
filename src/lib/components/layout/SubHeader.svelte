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

	const categories: Category[] = [
		{ name: 'Trending', href: '/?category=trending', icon: RocketIcon },
		{ name: 'Breaking', href: '/?category=breaking', icon: FlashIcon },
		{ name: 'New', href: '/?category=new', icon: StarsIcon },
		{ name: 'Politics', href: '/?category=politics', icon: CourthouseIcon },
		{ name: 'Sports', href: '/?category=sports', icon: CupIcon },
		{ name: 'Finance', href: '/?category=finance', icon: DollarCircleIcon },
		{ name: 'Crypto', href: '/?category=crypto', icon: BitcoinCardIcon },
		{ name: 'Geopolitics', href: '/?category=geopolitics', icon: GlobalIcon },
		{ name: 'Earnings', href: '/?category=earnings', icon: DollarSquareIcon },
		{ name: 'Tech', href: '/?category=tech', icon: DocumentTextIcon },
		{ name: 'Culture', href: '/?category=culture', icon: TicketIcon },
		{ name: 'World', href: '/?category=world', icon: GlobalEditIcon },
		{ name: 'Economy', href: '/?category=economy', icon: DollarChangeIcon },
		{ name: 'Elections', href: '/?category=elections', icon: SpeakerIcon },
		{ name: 'Mentions', href: '/?category=mentions', icon: MessageTextIcon },
		{ name: 'More', href: '/?category=more', dropdown: true }
	];

	let activeCategory = $derived(page.url.searchParams.get('category') || 'trending');
</script>

<div class="sub-header">
	<nav class="nav-scroll">
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
						{#if category.dropdown}
							<ChevronDownIcon size={12} />
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</div>

<style>
	.sub-header {
		background-color: var(--bg-0);
	}

	.nav-scroll {
		overflow-x: auto;
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE/Edge */
	}

	.nav-scroll::-webkit-scrollbar {
		display: none;
	}

	.nav-list {
		display: flex;
		align-items: center;
		gap: 24px;
		list-style: none;
		margin: 0;
		padding: 0 12px;
		height: 48px;
	}

	@media (min-width: 768px) {
		.nav-scroll {
			max-width: 1400px;
			margin: 0 auto;
		}

		.nav-list {
			padding: 0 24px;
		}

		.nav-list li:first-child .nav-link {
			padding-left: 0;
		}
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 6px;
		text-decoration: none;
		color: var(--text-2);
		font-size: 15px;
		font-weight: 600;
		white-space: nowrap;
		height: 48px;
		border-bottom: 2px solid transparent;
		transition: color 0.2s ease;
	}

	.nav-link:hover {
		color: var(--text-1);
	}

	.nav-link.active {
		color: var(--text-0);
		border-bottom-color: var(--text-0);
	}

	/* Icons inherit the link color automatically via currentColor */
	.nav-link :global(svg) {
		flex-shrink: 0;
	}
</style>
