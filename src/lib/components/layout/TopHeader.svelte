<script lang="ts">
	import BellIcon from '$lib/components/icons/BellIcon.svelte';
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte';
	import DollarCircleIcon from '$lib/components/icons/DollarCircleIcon.svelte';
	import UserAvatar from './UserAvatar.svelte';
	import { themeState } from '$lib/stores/theme.svelte';

	let searchQuery = $state('');

	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchQuery = target.value;
		// Future: trigger search endpoint
	}

	function handleDepositClick() {
		// Future: open deposit modal
	}

	function handleNotificationsClick() {
		// Future: navigate to /notifications or open dropdown
	}

	let logoSrc = $derived(themeState.current === 'dark' ? '/logo-light.svg' : '/logo-dark.svg');
</script>

<header class="top-header">
	<div class="header-content">
		<!-- Logo -->
		<a href="/" class="logo-link" aria-label="Go to home">
			<img src={logoSrc} alt="Glitch Markets" class="logo" />
		</a>

		<!-- Search Input -->
		<div class="search-container">
			<span class="search-icon" aria-hidden="true">
				<SearchIcon size={18} color="var(--text-3)" />
			</span>
			<input
				type="search"
				class="search-input"
				placeholder="Search markets..."
				bind:value={searchQuery}
				oninput={handleSearchInput}
				aria-label="Search markets"
			/>
		</div>

		<!-- Action Buttons -->
		<div class="actions">
			<!-- Deposit Button -->
			<button class="action-button primary" onclick={handleDepositClick} aria-label="Deposit funds">
				<span class="button-icon">
					<DollarCircleIcon size={18} color="currentColor" />
				</span>
				<span class="button-label">Deposit</span>
			</button>

			<!-- Notifications -->
			<button
				class="icon-button"
				onclick={handleNotificationsClick}
				aria-label="View notifications"
			>
				<BellIcon size={24} color="var(--text-2)" />
			</button>

			<!-- User Avatar / Sign In -->
			<UserAvatar />
		</div>
	</div>
</header>

<style>
	.top-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 60px;
		background-color: var(--bg-0);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border-bottom: 1px solid var(--bg-4);
		z-index: 1000;
	}

	.header-content {
		max-width: 100%;
		height: 100%;
		padding: 0 12px;
		display: flex;
		align-items: center;
		gap: 12px;
		justify-content: space-between;
	}

	/* Desktop: Max width with left alignment */
	@media (min-width: 768px) {
		.header-content {
			max-width: 1400px;
			margin: 0 auto;
			padding: 0 24px;
			justify-content: flex-start;
		}
	}

	.logo-link {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		text-decoration: none;
	}

	.logo {
		height: 32px;
		width: auto;
		transition: transform 0.2s ease;
	}

	.logo-link:hover .logo {
		transform: scale(1.05);
	}

	.search-container {
		position: relative;
		flex: 1;
		min-width: 120px;
		max-width: 400px;
		display: none;
	}

	/* Show search on desktop only */
	@media (min-width: 768px) {
		.search-container {
			display: block;
			margin-right: auto;
		}
	}

	.search-icon {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.search-input {
		width: 100%;
		height: 38px;
		padding: 8px 12px 8px 36px;
		background-color: var(--bg-2);
		border: 1px solid var(--bg-4);
		border-radius: 8px;
		color: var(--text-0);
		font-size: 14px;
		transition:
			border-color 0.2s ease,
			background-color 0.2s ease;
	}

	.search-input::placeholder {
		color: var(--text-3);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--primary);
		background-color: var(--bg-1);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
		margin-left: auto;
	}

	/* On desktop, remove auto margin since search already pushes to right */
	@media (min-width: 768px) {
		.actions {
			margin-left: 0;
		}
	}

	.action-button {
		display: none;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		border: none;
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease,
			transform 0.15s ease;
		white-space: nowrap;
	}

	/* Show deposit button on desktop */
	@media (min-width: 768px) {
		.action-button {
			display: flex;
		}
	}

	.action-button:active {
		transform: scale(0.98);
	}

	.action-button.primary {
		background-color: var(--primary);
		color: #111111;
		border: 1px solid transparent;
	}

	.action-button.primary:hover {
		background-color: var(--primary-hover);
	}

	.button-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.button-label {
		line-height: 1;
	}

	.icon-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		padding: 0;
		background: none;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			transform 0.15s ease;
	}

	.icon-button:hover {
		background-color: var(--bg-2);
	}

	.icon-button:active {
		transform: scale(0.95);
	}

	/* Responsive Styles */

	/* Very small mobile - hide labels */
	@media (max-width: 374px) {
		.button-label {
			display: none;
		}

		.action-button {
			padding: 8px;
			min-width: 40px;
			justify-content: center;
		}

		.header-content {
			padding: 0 8px;
			gap: 6px;
		}

		.actions {
			gap: 6px;
		}

		.search-container {
			min-width: 100px;
		}
	}

	/* Mobile - compact labels */
	@media (min-width: 375px) and (max-width: 767px) {
		.header-content {
			gap: 10px;
		}

		.search-container {
			max-width: 300px;
		}
	}

	/* Desktop - full layout */
	@media (min-width: 768px) {
		.top-header {
			height: 64px;
		}

		.header-content {
			padding: 0 24px;
			gap: 12px;
			max-width: 1400px;
		}

		.logo {
			height: 40px;
		}

		.search-container {
			max-width: 500px;
		}

		.actions {
			gap: 12px;
		}

		.action-button {
			padding: 8px 16px;
		}

		.icon-button {
			width: 44px;
			height: 44px;
		}
	}

	/* Large desktop */
	@media (min-width: 1024px) {
		.search-container {
			max-width: 600px;
		}
	}
</style>
