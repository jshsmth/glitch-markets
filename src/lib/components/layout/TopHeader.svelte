<script lang="ts">
	import BellIcon from '$lib/components/icons/BellIcon.svelte';
	import UserAvatar from './UserAvatar.svelte';
	import SubHeader from './SubHeader.svelte';
	import Logo from './Logo.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import PortfolioStat from '$lib/components/ui/PortfolioStat.svelte';
	import SearchWithResults from '$lib/components/ui/SearchWithResults.svelte';
	import { authState } from '$lib/stores/auth.svelte';
	import { useBalance } from '$lib/composables/use-balance.svelte';
	import { openDepositModal } from '$lib/stores/modal.svelte';
	import { formatCurrency } from '$lib/utils/formatters';

	const balanceQuery = useBalance();

	const formattedBalance = $derived.by(() => {
		if (!balanceQuery.hasProxyWallet) return '$0.00';
		if (balanceQuery.balance === null) return '$0.00';

		const numBalance = parseFloat(balanceQuery.balance);
		return formatCurrency(numBalance);
	});

	function handleDepositClick() {
		openDepositModal();
	}

	// TODO: Implement notifications dropdown or page navigation
	function handleNotificationsClick() {}
</script>

<header class="site-header">
	<div class="top-bar">
		<div class="header-content">
			<div class="left-section">
				<a href="/" class="logo-link" aria-label="Go to home">
					<Logo />
				</a>

				<SearchWithResults class="search-container" />
			</div>

			<div class="right-section">
				{#if !authState.isInitializing && authState.user}
					<div class="portfolio-stats">
						<PortfolioStat
							label="Portfolio"
							value={formattedBalance}
							valueColor="success"
							href="/portfolio"
						/>
						<PortfolioStat
							label="Cash"
							value={formattedBalance}
							valueColor="success"
							href="/portfolio"
						/>
					</div>

					<Button variant="primary" size="small" onclick={handleDepositClick}>Deposit</Button>
				{/if}

				<div class="user-actions">
					{#if !authState.isInitializing && authState.user}
						<button
							class="icon-button"
							onclick={handleNotificationsClick}
							aria-label="View notifications"
						>
							<BellIcon size={24} color="var(--text-1)" />
						</button>

						<div class="header-divider" aria-hidden="true"></div>
					{/if}

					<UserAvatar />
				</div>
			</div>

			<div class="mobile-actions">
				{#if !authState.isInitializing && authState.user}
					<button
						class="icon-button"
						onclick={handleNotificationsClick}
						aria-label="View notifications"
					>
						<BellIcon size={24} color="var(--text-1)" />
					</button>
				{/if}
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
		z-index: var(--z-sticky);
		background-color: rgba(var(--bg-0-rgb), 0.95);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-bottom: 1px solid var(--bg-2);
	}

	:global([data-theme='dark']) .site-header {
		background-color: rgba(var(--bg-0-rgb), 0.9);
	}

	.top-bar {
		height: 60px;
		display: flex;
		align-items: center;
	}

	@media (min-width: 768px) {
		.top-bar {
			height: 68px;
		}
	}

	.header-content {
		width: 100%;
		height: 100%;
		padding: 0 20px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	@media (min-width: 768px) {
		.header-content {
			max-width: 1400px;
			margin: 0 auto;
			padding: 0 28px;
			gap: 20px;
		}
	}

	.left-section {
		display: flex;
		align-items: center;
		gap: 20px;
		flex: 1;
		min-width: 0;
	}

	.logo-link {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		text-decoration: none;
		border-radius: var(--radius-md);
		transition: opacity 0.2s ease;
	}

	.logo-link:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	/* Search */
	:global(.search-container) {
		display: none;
	}

	@media (min-width: 768px) {
		:global(.search-container) {
			display: block;
			flex: 1;
			max-width: 480px;
		}
	}

	/* Right Section */
	.right-section {
		display: none;
		align-items: center;
		gap: 16px;
	}

	@media (min-width: 768px) {
		.right-section {
			display: flex;
		}
	}

	.portfolio-stats {
		display: flex;
		gap: 8px;
		margin-right: 4px;
	}

	.user-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.icon-button {
		background: none;
		border: none;
		padding: 10px;
		cursor: pointer;
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 40px;
		min-height: 40px;
		transition: all 0.2s ease;
		position: relative;
	}

	.icon-button:hover {
		background-color: var(--bg-2);
		transform: scale(1.05);
	}

	.icon-button:active {
		background-color: var(--bg-3);
		transform: scale(0.98);
	}

	.icon-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.header-divider {
		width: 1px;
		height: 24px;
		background-color: var(--bg-3);
		flex-shrink: 0;
	}

	/* Mobile Actions */
	.mobile-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	@media (min-width: 768px) {
		.mobile-actions {
			display: none;
		}
	}
</style>
