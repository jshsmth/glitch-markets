<script lang="ts">
	import { page } from '$app/stores';
	import HomeIcon from '$lib/components/icons/HomeIcon.svelte';
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte';
	import PokerChipIcon from '$lib/components/icons/PokerChipIcon.svelte';
	import MenuIcon from '$lib/components/icons/MenuIcon.svelte';

	import type { Component } from 'svelte';

	interface NavItem {
		label: string;
		href: string;
		icon: Component;
		isPlaceholder: boolean;
	}

	const navItems: NavItem[] = [
		{
			label: 'Home',
			href: '/',
			icon: HomeIcon,
			isPlaceholder: false
		},
		{
			label: 'Search',
			href: '/search',
			icon: SearchIcon,
			isPlaceholder: false
		},
		{
			label: 'Portfolio',
			href: '/portfolio',
			icon: PokerChipIcon,
			isPlaceholder: false
		},
		{
			label: 'More',
			href: '#',
			icon: MenuIcon,
			isPlaceholder: true
		}
	];

	function isActive(href: string): boolean {
		if (href === '#') return false;
		return $page.url.pathname === href;
	}

	function handleNavClick(event: MouseEvent, item: NavItem) {
		if (item.isPlaceholder) {
			event.preventDefault();
		}
	}
</script>

<nav class="bottom-nav" aria-label="Main navigation">
	{#each navItems as item (item.label)}
		{@const Icon = item.icon}
		<a
			href={item.href}
			class="nav-item"
			class:active={isActive(item.href)}
			class:placeholder={item.isPlaceholder}
			aria-current={isActive(item.href) ? 'page' : undefined}
			aria-label={item.label}
			onclick={(e) => handleNavClick(e, item)}
		>
			<span class="nav-icon">
				<Icon size={22} color="currentColor" />
			</span>
			<span class="nav-label">{item.label}</span>
		</a>
	{/each}
</nav>

<style>
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 64px;
		background-color: var(--bg-1);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border-top: 1px solid var(--bg-4);
		display: flex;
		justify-content: space-around;
		align-items: center;
		padding: 0 8px;
		z-index: 1000;
	}

	.nav-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 8px 4px;
		min-height: 48px;
		min-width: 48px;
		color: var(--text-3);
		text-decoration: none;
		border-radius: 8px;
		transition:
			color 0.2s ease,
			background-color 0.15s ease,
			transform 0.15s ease;
		cursor: pointer;
	}

	.nav-item:hover {
		background-color: var(--bg-2);
	}

	.nav-item:active {
		transform: scale(0.95);
	}

	.nav-item.active {
		color: var(--primary);
	}

	.nav-item.placeholder {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.nav-item.placeholder:hover {
		background-color: transparent;
	}

	.nav-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.nav-label {
		font-size: 11px;
		font-weight: 500;
		white-space: nowrap;
		line-height: 1;
	}

	/* Hide bottom nav on desktop */
	@media (min-width: 768px) {
		.bottom-nav {
			display: none;
		}
	}

	/* Tablet size - slightly larger */
	@media (min-width: 375px) and (max-width: 767px) {
		.bottom-nav {
			height: 68px;
		}

		.nav-icon {
			font-size: 22px;
		}

		.nav-label {
			font-size: 12px;
		}
	}
</style>
