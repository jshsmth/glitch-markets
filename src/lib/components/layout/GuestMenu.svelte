<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { themeState, toggleTheme } from '$lib/stores/theme.svelte';
	import MoonIcon from '$lib/components/icons/MoonIcon.svelte';
	import SunIcon from '$lib/components/icons/SunIcon.svelte';
	import DocumentTextIcon from '$lib/components/icons/DocumentTextIcon.svelte';
	import LegalIcon from '$lib/components/icons/LegalIcon.svelte';
	import ElectricityIcon from '$lib/components/icons/ElectricityIcon.svelte';
	import MenuIcon from '$lib/components/icons/MenuIcon.svelte';
	import LeaderboardIcon from '$lib/components/icons/LeaderboardIcon.svelte';

	let showDropdown = $state(false);
	let closeTimeout: ReturnType<typeof setTimeout> | null = null;
	let windowWidth = $state(1024);

	let isMobile = $derived(windowWidth <= 767);

	onMount(() => {
		windowWidth = window.innerWidth;

		const handleResize = () => {
			windowWidth = window.innerWidth;
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	onDestroy(() => {
		if (closeTimeout) {
			clearTimeout(closeTimeout);
			closeTimeout = null;
		}
	});

	function handleMenuClick() {
		if (isMobile) {
			showDropdown = !showDropdown;
		}
	}

	function handleMenuMouseEnter() {
		if (!isMobile) {
			if (closeTimeout) {
				clearTimeout(closeTimeout);
				closeTimeout = null;
			}
			showDropdown = true;
		}
	}

	function handleMenuMouseLeave() {
		if (!isMobile) {
			closeTimeout = setTimeout(() => {
				showDropdown = false;
			}, 150);
		}
	}

	function handleDropdownMouseEnter() {
		if (!isMobile && closeTimeout) {
			clearTimeout(closeTimeout);
			closeTimeout = null;
		}
	}

	function handleDropdownMouseLeave() {
		if (!isMobile) {
			closeTimeout = setTimeout(() => {
				showDropdown = false;
			}, 150);
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (isMobile) {
			const target = event.target as HTMLElement;
			if (!target.closest('.guest-menu-container')) {
				showDropdown = false;
			}
		}
	}

	function handleThemeToggle() {
		toggleTheme();
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="guest-menu-container">
	<button
		class="menu-button"
		onclick={handleMenuClick}
		onmouseenter={handleMenuMouseEnter}
		onmouseleave={handleMenuMouseLeave}
		aria-label="Menu"
		aria-expanded={showDropdown}
	>
		<MenuIcon size={24} color="var(--text-1)" />
	</button>

	{#if showDropdown}
		<div
			class="dropdown"
			role="menu"
			tabindex="-1"
			onmouseenter={handleDropdownMouseEnter}
			onmouseleave={handleDropdownMouseLeave}
		>
			<a href="/leaderboard" class="dropdown-item" onclick={() => (showDropdown = false)}>
				<span class="dropdown-item-icon">
					<LeaderboardIcon size={18} color="currentColor" />
				</span>
				<span>Leaderboard</span>
			</a>

			<a
				href="https://docs.polymarket.com/quickstart/introduction/main"
				target="_blank"
				rel="noopener noreferrer"
				class="dropdown-item"
				onclick={() => (showDropdown = false)}
			>
				<span class="dropdown-item-icon">
					<ElectricityIcon size={18} color="currentColor" />
				</span>
				<span>APIs</span>
			</a>

			<button class="dropdown-item" onclick={handleThemeToggle}>
				<span class="dropdown-item-icon">
					{#if themeState.current === 'dark'}
						<SunIcon size={18} color="currentColor" />
					{:else}
						<MoonIcon size={18} color="currentColor" />
					{/if}
				</span>
				<span>{themeState.current === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
			</button>

			<div class="dropdown-divider"></div>

			<a
				href="https://docs.polymarket.com/polymarket-learn/get-started/what-is-polymarket#introduction"
				target="_blank"
				rel="noopener noreferrer"
				class="dropdown-item"
				onclick={() => (showDropdown = false)}
			>
				<span class="dropdown-item-icon">
					<DocumentTextIcon size={18} color="currentColor" />
				</span>
				<span>Documentation</span>
			</a>

			<a
				href="https://polymarket.com/tos"
				target="_blank"
				rel="noopener noreferrer"
				class="dropdown-item"
				onclick={() => (showDropdown = false)}
			>
				<span class="dropdown-item-icon">
					<LegalIcon size={18} color="currentColor" />
				</span>
				<span>Terms of Use</span>
			</a>
		</div>
	{/if}
</div>

<style>
	.guest-menu-container {
		position: relative;
		display: inline-block;
	}

	.menu-button {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 10px;
		cursor: pointer;
		border-radius: var(--radius-md);
		min-width: 40px;
		min-height: 40px;
		transition: all 0.2s ease;
	}

	.menu-button:hover {
		background-color: var(--bg-2);
		transform: scale(1.05);
	}

	.menu-button:active {
		background-color: var(--bg-3);
		transform: scale(0.98);
	}

	.menu-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		background-color: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: 12px;
		box-shadow: var(--shadow-md);
		min-width: 220px;
		z-index: var(--z-popover);
		overflow: hidden;
		padding: 12px;
		animation: dropdown-appear 0.12s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes dropdown-appear {
		from {
			opacity: 0;
			transform: translateY(-4px) scale(0.97);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.dropdown-item {
		width: 100%;
		padding: 10px 12px;
		background: none;
		border: none;
		border-radius: 8px;
		color: var(--text-0);
		text-align: left;
		cursor: pointer;
		font-size: 14px;
		font-weight: 500;
		transition: all 0.1s ease;
		display: flex;
		align-items: center;
		gap: 12px;
		text-decoration: none;
	}

	.dropdown-item-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		color: var(--text-1);
		transition: color 0.1s ease;
	}

	.dropdown-item:hover {
		background-color: var(--primary-hover-bg);
	}

	.dropdown-item:hover .dropdown-item-icon {
		color: var(--primary);
	}

	.dropdown-item:active {
		background-color: var(--primary-hover-bg-medium);
		transform: scale(0.98);
	}

	.dropdown-item:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.dropdown-divider {
		height: 1px;
		background-color: var(--bg-4);
		margin: 8px 0;
	}
</style>
