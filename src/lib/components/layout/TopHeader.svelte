<script lang="ts">
	import BellIcon from '$lib/components/icons/BellIcon.svelte';
	import UserAvatar from './UserAvatar.svelte';
	import SubHeader from './SubHeader.svelte';
	import Logo from './Logo.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import PortfolioStat from '$lib/components/ui/PortfolioStat.svelte';
	import Search from '$lib/components/ui/Search.svelte';

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
</script>

<header class="site-header">
	<div class="top-bar">
		<div class="header-content">
			<div class="left-section">
				<a href="/" class="logo-link" aria-label="Go to home">
					<Logo />
				</a>

				<Search
					bind:value={searchQuery}
					placeholder="Find the Glitch"
					oninput={handleSearchInput}
					class="search-container"
				/>
			</div>

			<div class="right-section">
				<div class="portfolio-stats">
					<PortfolioStat label="Portfolio" value="$0.00" valueColor="success" href="/portfolio" />
					<PortfolioStat label="Cash" value="$0.00" valueColor="success" href="/wallet" />
				</div>

				<Button variant="primary" size="small" onclick={handleDepositClick}>Deposit</Button>

				<div class="user-actions">
					<button
						class="icon-button"
						onclick={handleNotificationsClick}
						aria-label="View notifications"
					>
						<BellIcon size={24} color="var(--text-1)" />
					</button>

					<div class="header-divider" aria-hidden="true"></div>

					<UserAvatar />
				</div>
			</div>

			<div class="mobile-actions">
				<button
					class="icon-button"
					onclick={handleNotificationsClick}
					aria-label="View notifications"
				>
					<BellIcon size={24} color="var(--text-1)" />
				</button>
				<UserAvatar hideChevron={true} />
			</div>
		</div>
	</div>

	<SubHeader />
</header>

<style>
	.site-header {
		position: sticky;
		top: 0;
		z-index: 1000;
		background-color: var(--bg-0);
		border-bottom: 1px solid var(--bg-4);
	}

	.top-bar {
		height: 64px;
		display: flex;
		align-items: center;
	}

	@media (min-width: 768px) {
		.top-bar {
			height: 72px;
		}
	}

	.header-content {
		width: 100%;
		height: 100%;
		padding: 0 var(--spacing-3); /* 12px mobile */
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	@media (min-width: 768px) {
		.header-content {
			max-width: 1400px;
			margin: 0 auto;
			padding: 0 var(--spacing-6); /* 24px desktop */
		}
	}

	.left-section {
		display: flex;
		align-items: center;
		gap: var(--spacing-6); /* 24px - related items */
		flex: 1;
	}

	.logo-link {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		text-decoration: none;
	}

	/* Search */
	:global(.search-container) {
		display: none;
	}

	@media (min-width: 768px) {
		:global(.search-container) {
			display: block;
		}
	}

	/* Right Section */
	.right-section {
		display: none;
		align-items: center;
		gap: var(--space-sm); /* Normal spacing between major groups */
	}

	@media (min-width: 768px) {
		.right-section {
			display: flex;
		}
	}

	.portfolio-stats {
		display: flex;
		gap: var(--space-xs);
		margin-right: var(--space-xs);
	}

	.user-actions {
		display: flex;
		align-items: center;
		gap: 2px; /* Very tight spacing for bell + divider + avatar group */
	}

	.icon-button {
		background: none;
		border: none;
		padding: var(--spacing-2); /* 8px */
		cursor: pointer;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: var(--target-min); /* 48px touch target */
		min-height: var(--target-min);
		transition: var(--transition-colors);
	}

	.icon-button:hover {
		background-color: var(--bg-2);
	}

	.icon-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.header-divider {
		width: 1px;
		height: var(--spacing-6); /* 24px */
		background-color: var(--bg-4);
		flex-shrink: 0;
		margin: 0 var(--spacing-2); /* 8px */
	}

	/* Mobile Actions */
	.mobile-actions {
		display: flex;
		align-items: center;
		gap: 2px; /* Very tight spacing between bell and avatar */
	}

	@media (min-width: 768px) {
		.mobile-actions {
			display: none;
		}
	}
</style>
