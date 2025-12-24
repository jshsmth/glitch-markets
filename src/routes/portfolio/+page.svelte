<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { createQuery } from '@tanstack/svelte-query';
	import type { Position, Trade } from '$lib/server/api/polymarket-client';
	import type { Order } from '$lib/types/user';
	import { queryKeys } from '$lib/query/client';
	import Button from '$lib/components/ui/Button.svelte';
	import Search from '$lib/components/ui/Search.svelte';
	import ArrowDownIcon from '$lib/components/icons/ArrowDownIcon.svelte';
	import ArrowUpIcon from '$lib/components/icons/ArrowUpIcon.svelte';
	import ChevronRightIcon from '$lib/components/icons/ChevronRightIcon.svelte';
	import MoneyIcon from '$lib/components/icons/MoneyIcon.svelte';
	import ChevronDownIcon from '$lib/components/icons/ChevronDownIcon.svelte';
	import DocumentTextIcon from '$lib/components/icons/DocumentTextIcon.svelte';
	import { openDepositModal, openWithdrawModal } from '$lib/stores/modal.svelte';
	import { authState } from '$lib/stores/auth.svelte';
	import { useBalance } from '$lib/composables/use-balance.svelte';
	import { walletState } from '$lib/stores/wallet.svelte';
	import ProfitLossChart from '$lib/components/portfolio/ProfitLossChart.svelte';
	import {
		formatCurrency,
		formatPrice,
		formatPercent,
		formatDateTime
	} from '$lib/utils/formatters';

	const balanceQuery = useBalance();

	const formattedBalance = $derived.by(() => {
		if (!balanceQuery.hasProxyWallet) return '$0.00';
		if (balanceQuery.balance === null) return '$0.00';

		const numBalance = parseFloat(balanceQuery.balance);
		return formatCurrency(numBalance);
	});

	function handleDeposit() {
		openDepositModal();
	}

	function handleWithdraw() {
		openWithdrawModal();
	}

	$effect(() => {
		if (!authState.isInitializing && !authState.user) {
			goto('/');
		}
	});

	let activeTab = $state<'positions' | 'orders' | 'history'>('positions');
	let searchQuery = $state('');

	const positionsQuery = createQuery<Position[]>(() => ({
		queryKey: queryKeys.users.positions(walletState.proxyWalletAddress),
		queryFn: async () => {
			const res = await fetch(`/api/users/positions?user=${walletState.proxyWalletAddress}`);
			if (!res.ok) throw new Error('Failed to fetch positions');
			return res.json();
		},
		enabled: browser && !!walletState.proxyWalletAddress
	}));

	const ordersQuery = createQuery<Order[]>(() => ({
		queryKey: queryKeys.users.orders(walletState.proxyWalletAddress),
		queryFn: async () => {
			const res = await fetch(`/api/users/orders?user=${walletState.proxyWalletAddress}`);
			if (!res.ok) throw new Error('Failed to fetch orders');
			return res.json();
		},
		enabled: browser && !!walletState.proxyWalletAddress && activeTab === 'orders'
	}));

	const tradesQuery = createQuery<Trade[]>(() => ({
		queryKey: queryKeys.users.trades(walletState.proxyWalletAddress),
		queryFn: async () => {
			const res = await fetch(`/api/users/trades?user=${walletState.proxyWalletAddress}`);
			if (!res.ok) throw new Error('Failed to fetch trades');
			return res.json();
		},
		enabled: browser && !!walletState.proxyWalletAddress && activeTab === 'history'
	}));

	const positions = $derived(positionsQuery.data ?? []);
	const orders = $derived(ordersQuery.data ?? []);
	const trades = $derived(tradesQuery.data ?? []);
	const isLoading = $derived(
		activeTab === 'positions'
			? positionsQuery.isPending
			: activeTab === 'orders'
				? ordersQuery.isPending
				: tradesQuery.isPending
	);

	const filteredPositions = $derived(
		positions.filter(
			(p: Position) =>
				searchQuery === '' ||
				p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.outcome.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const filteredOrders = $derived(
		orders.filter(
			(o: Order) =>
				searchQuery === '' ||
				o.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
				o.outcome.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const filteredTrades = $derived(
		trades.filter(
			(t: Trade) =>
				searchQuery === '' ||
				(t.title && t.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
				(t.outcome && t.outcome.toLowerCase().includes(searchQuery.toLowerCase()))
		)
	);
</script>

<svelte:head>
	<title>Portfolio - Glitch Markets</title>
	<meta name="description" content="View your portfolio, positions, and trading history" />
</svelte:head>

<div class="page-container">
	<div class="cards-grid">
		<div class="portfolio-card">
			<div class="card-header">
				<span class="card-label">Portfolio</span>
				<div class="cash-badge">
					<MoneyIcon size={14} color="var(--success)" />
					<span>{formattedBalance}</span>
				</div>
			</div>

			<span class="value">{formattedBalance}</span>

			<div class="card-actions">
				<Button variant="primary" fullWidth onclick={handleDeposit}>
					{#snippet iconBefore()}
						<ArrowDownIcon size={18} color="currentColor" />
					{/snippet}
					Deposit
				</Button>
				<Button variant="secondary" fullWidth onclick={handleWithdraw}>
					{#snippet iconBefore()}
						<ArrowUpIcon size={18} color="currentColor" />
					{/snippet}
					Withdraw
				</Button>
			</div>
		</div>

		<ProfitLossChart />
	</div>

	<div class="portfolio-content">
		<div class="tabs-header">
			<button
				class="tab"
				class:active={activeTab === 'positions'}
				onclick={() => (activeTab = 'positions')}
			>
				Positions
			</button>
			<button
				class="tab"
				class:active={activeTab === 'orders'}
				onclick={() => (activeTab = 'orders')}
			>
				Open orders
			</button>
			<button
				class="tab"
				class:active={activeTab === 'history'}
				onclick={() => (activeTab = 'history')}
			>
				History
			</button>
		</div>

		<div class="tab-content">
			{#if activeTab === 'positions'}
				{#if !walletState.proxyWalletAddress}
					<div class="empty-state">
						<DocumentTextIcon size={48} color="var(--text-3)" />
						<p class="empty-title">No wallet connected</p>
						<p class="empty-text">Connect your wallet to view your positions</p>
					</div>
				{:else if isLoading}
					<div class="loading-state">
						<div class="spinner"></div>
						<p>Loading positions...</p>
					</div>
				{:else if positionsQuery.error}
					<div class="error-state">
						<p class="error-title">Failed to load positions</p>
						<p class="error-text">{positionsQuery.error.message}</p>
						<Button onclick={() => positionsQuery.refetch()}>Try Again</Button>
					</div>
				{:else if filteredPositions.length === 0 && positions.length === 0}
					<div class="empty-state">
						<DocumentTextIcon size={48} color="var(--text-3)" />
						<p class="empty-title">No positions found.</p>
					</div>
				{:else}
					<div class="positions-table desktop-only">
						<div class="table-controls">
							<Search
								bind:value={searchQuery}
								placeholder="Search positions..."
								inputSize="medium"
							/>
							<button class="sort-button" disabled>
								Current value
								<ChevronDownIcon size={14} />
							</button>
						</div>

						{#if filteredPositions.length === 0}
							<div class="empty-state">
								<DocumentTextIcon size={48} color="var(--text-3)" />
								<p class="empty-title">No positions found.</p>
								<Button onclick={() => (searchQuery = '')}>Clear search</Button>
							</div>
						{:else}
							<div class="table-header">
								<div>MARKET</div>
								<div>AVG → NOW</div>
								<div class="col-bet">BET</div>
								<div>TO WIN</div>
								<div>VALUE</div>
							</div>

							{#each filteredPositions as position (position.asset)}
								<a href="/event/{position.eventSlug}" class="table-row">
									<div class="col-market">
										<img src={position.icon} alt="" class="market-icon" loading="lazy" />
										<div class="market-info">
											<span class="market-title">{position.title}</span>
											<span class="market-outcome" class:yes={position.outcome === 'Yes'}
												>{position.outcome}</span
											>
										</div>
									</div>

									<div class="col-price-change">
										<span class="price-label">{formatPrice(position.avgPrice)}</span>
										<ChevronRightIcon size={12} />
										<span class="price-label">{formatPrice(position.curPrice)}</span>
									</div>

									<div class="col-bet">
										{formatCurrency(position.initialValue)}
									</div>

									<div class="col-to-win">
										{formatCurrency(position.size)}
									</div>

									<div class="col-value">
										<div class="value-content">
											<span
												class="value-amount"
												class:profit={position.cashPnl >= 0}
												class:loss={position.cashPnl < 0}
											>
												{formatCurrency(position.currentValue)}
											</span>
											<span
												class="pnl-badge"
												class:profit={position.percentPnl >= 0}
												class:loss={position.percentPnl < 0}
											>
												{formatPercent(position.percentPnl)}
											</span>
										</div>
									</div>
								</a>
							{/each}
						{/if}
					</div>

					<div class="positions-cards mobile-only">
						<div class="mobile-search">
							<Search
								bind:value={searchQuery}
								placeholder="Search positions..."
								inputSize="medium"
							/>
						</div>

						{#if filteredPositions.length === 0}
							<div class="empty-state">
								<DocumentTextIcon size={48} color="var(--text-3)" />
								<p class="empty-title">No positions found.</p>
								<Button onclick={() => (searchQuery = '')}>Clear search</Button>
							</div>
						{:else}
							{#each filteredPositions as position (position.asset)}
								<a href="/event/{position.eventSlug}" class="position-card">
									<div class="card-header">
										<img src={position.icon} alt="" class="market-icon" loading="lazy" />
										<div class="card-title-section">
											<span class="market-title">{position.title}</span>
											<span class="market-outcome" class:yes={position.outcome === 'Yes'}
												>{position.outcome}</span
											>
										</div>
									</div>

									<div class="card-stats">
										<div class="stat-item">
											<span class="stat-label">Avg → Now</span>
											<span class="stat-value"
												>{formatPrice(position.avgPrice)} → {formatPrice(position.curPrice)}</span
											>
										</div>

										<div class="stat-item">
											<span class="stat-label">To Win</span>
											<span class="stat-value">{formatCurrency(position.size)}</span>
										</div>

										<div class="stat-item">
											<span class="stat-label">Value</span>
											<div class="stat-value-with-pnl">
												<span
													class="value-amount"
													class:profit={position.cashPnl >= 0}
													class:loss={position.cashPnl < 0}
												>
													{formatCurrency(position.currentValue)}
												</span>
												<span
													class="pnl-badge"
													class:profit={position.percentPnl >= 0}
													class:loss={position.percentPnl < 0}
												>
													{formatPercent(position.percentPnl)}
												</span>
											</div>
										</div>
									</div>
								</a>
							{/each}
						{/if}
					</div>
				{/if}
			{:else if activeTab === 'orders'}
				{#if !walletState.proxyWalletAddress}
					<div class="empty-state">
						<DocumentTextIcon size={48} color="var(--text-3)" />
						<p class="empty-title">No wallet connected</p>
						<p class="empty-text">Connect your wallet to view your open orders</p>
					</div>
				{:else if isLoading}
					<div class="loading-state">
						<div class="spinner"></div>
						<p>Loading orders...</p>
					</div>
				{:else if ordersQuery.error}
					<div class="error-state">
						<p class="error-title">Failed to load orders</p>
						<p class="error-text">{ordersQuery.error.message}</p>
						<Button onclick={() => ordersQuery.refetch()}>Try Again</Button>
					</div>
				{:else if filteredOrders.length === 0 && orders.length === 0}
					<div class="empty-state">
						<DocumentTextIcon size={48} color="var(--text-3)" />
						<p class="empty-title">No open orders</p>
						<p class="empty-text">You don't have any active orders</p>
					</div>
				{:else}
					<div class="positions-table desktop-only">
						<div class="table-controls">
							<Search bind:value={searchQuery} placeholder="Search orders..." inputSize="medium" />
						</div>

						{#if filteredOrders.length === 0}
							<div class="empty-state">
								<DocumentTextIcon size={48} color="var(--text-3)" />
								<p class="empty-title">No orders found.</p>
								<Button onclick={() => (searchQuery = '')}>Clear search</Button>
							</div>
						{:else}
							<div class="table-header">
								<div>MARKET</div>
								<div>TYPE</div>
								<div>SIDE</div>
								<div>PRICE</div>
								<div>AMOUNT</div>
								<div>FILLED</div>
								<div>DATE</div>
							</div>

							{#each filteredOrders as order (order.id)}
								<a href="/event/{order.eventSlug}" class="table-row">
									<div class="col-market">
										<img src={order.icon} alt="" class="market-icon" loading="lazy" />
										<div class="market-info">
											<span class="market-title">{order.market}</span>
											<span class="market-outcome" class:yes={order.outcome === 'Yes'}
												>{order.outcome}</span
											>
										</div>
									</div>

									<div class="col-type">
										<span class="type-badge">{order.type}</span>
									</div>

									<div class="col-side">
										<span
											class="side-badge"
											class:buy={order.side === 'BUY'}
											class:sell={order.side === 'SELL'}
										>
											{order.side}
										</span>
									</div>

									<div>{formatPrice(order.price)}</div>

									<div>{formatCurrency(order.size)}</div>

									<div class="col-filled">
										{((order.filled / order.size) * 100).toFixed(0)}%
									</div>

									<div class="col-date">
										{formatDateTime(order.timestamp)}
									</div>
								</a>
							{/each}
						{/if}
					</div>

					<div class="positions-cards mobile-only">
						<div class="mobile-search">
							<Search bind:value={searchQuery} placeholder="Search orders..." inputSize="medium" />
						</div>

						{#if filteredOrders.length === 0}
							<div class="empty-state">
								<DocumentTextIcon size={48} color="var(--text-3)" />
								<p class="empty-title">No orders found.</p>
								<Button onclick={() => (searchQuery = '')}>Clear search</Button>
							</div>
						{:else}
							{#each filteredOrders as order (order.id)}
								<a href="/event/{order.eventSlug}" class="position-card">
									<div class="card-header">
										<img src={order.icon} alt="" class="market-icon" loading="lazy" />
										<div class="card-title-section">
											<span class="market-title">{order.market}</span>
											<span class="market-outcome" class:yes={order.outcome === 'Yes'}
												>{order.outcome}</span
											>
										</div>
									</div>

									<div class="card-stats">
										<div class="stat-item">
											<span class="stat-label">Type</span>
											<span class="type-badge">{order.type}</span>
										</div>

										<div class="stat-item">
											<span class="stat-label">Side</span>
											<span
												class="side-badge"
												class:buy={order.side === 'BUY'}
												class:sell={order.side === 'SELL'}
											>
												{order.side}
											</span>
										</div>

										<div class="stat-item">
											<span class="stat-label">Price</span>
											<span class="stat-value">{formatPrice(order.price)}</span>
										</div>

										<div class="stat-item">
											<span class="stat-label">Amount</span>
											<span class="stat-value">{formatCurrency(order.size)}</span>
										</div>

										<div class="stat-item">
											<span class="stat-label">Filled</span>
											<span class="stat-value"
												>{((order.filled / order.size) * 100).toFixed(0)}%</span
											>
										</div>

										<div class="stat-item">
											<span class="stat-label">Date</span>
											<span class="stat-value">{formatDateTime(order.timestamp)}</span>
										</div>
									</div>
								</a>
							{/each}
						{/if}
					</div>
				{/if}
			{:else if !walletState.proxyWalletAddress}
				<div class="empty-state">
					<DocumentTextIcon size={48} color="var(--text-3)" />
					<p class="empty-title">No wallet connected</p>
					<p class="empty-text">Connect your wallet to view your trading history</p>
				</div>
			{:else if isLoading}
				<div class="loading-state">
					<div class="spinner"></div>
					<p>Loading history...</p>
				</div>
			{:else if tradesQuery.error}
				<div class="error-state">
					<p class="error-title">Failed to load history</p>
					<p class="error-text">{tradesQuery.error.message}</p>
					<Button onclick={() => tradesQuery.refetch()}>Try Again</Button>
				</div>
			{:else if filteredTrades.length === 0 && trades.length === 0}
				<div class="empty-state">
					<DocumentTextIcon size={48} color="var(--text-3)" />
					<p class="empty-title">No trading history</p>
					<p class="empty-text">You haven't made any trades yet</p>
				</div>
			{:else}
				<div class="positions-table desktop-only">
					<div class="table-controls">
						<Search bind:value={searchQuery} placeholder="Search history..." inputSize="medium" />
					</div>

					{#if filteredTrades.length === 0}
						<div class="empty-state">
							<DocumentTextIcon size={48} color="var(--text-3)" />
							<p class="empty-title">No trades found.</p>
							<Button onclick={() => (searchQuery = '')}>Clear search</Button>
						</div>
					{:else}
						<div class="table-header history-header">
							<div>MARKET</div>
							<div>SIDE</div>
							<div>PRICE</div>
							<div>AMOUNT</div>
							<div>TOTAL</div>
							<div>DATE</div>
						</div>

						{#each filteredTrades as trade (trade.transactionHash || `${trade.timestamp}-${trade.size}`)}
							<a
								href={trade.eventSlug ? `/event/${trade.eventSlug}` : '#'}
								class="table-row"
								class:no-link={!trade.eventSlug}
							>
								<div class="col-market">
									{#if trade.icon}
										<img src={trade.icon} alt="" class="market-icon" loading="lazy" />
									{/if}
									<div class="market-info">
										<span class="market-title">{trade.title || 'Unknown Market'}</span>
										{#if trade.outcome}
											<span class="market-outcome" class:yes={trade.outcome === 'Yes'}
												>{trade.outcome}</span
											>
										{/if}
									</div>
								</div>

								<div class="col-side">
									<span
										class="side-badge"
										class:buy={trade.side === 'BUY'}
										class:sell={trade.side === 'SELL'}
									>
										{trade.side}
									</span>
								</div>

								<div>{formatPrice(trade.price)}</div>

								<div>{trade.size.toFixed(2)}</div>

								<div>{formatCurrency(trade.size * trade.price)}</div>

								<div class="col-date">
									{formatDateTime(trade.timestamp)}
								</div>
							</a>
						{/each}
					{/if}
				</div>

				<div class="positions-cards mobile-only">
					<div class="mobile-search">
						<Search bind:value={searchQuery} placeholder="Search history..." inputSize="medium" />
					</div>

					{#if filteredTrades.length === 0}
						<div class="empty-state">
							<DocumentTextIcon size={48} color="var(--text-3)" />
							<p class="empty-title">No trades found.</p>
							<Button onclick={() => (searchQuery = '')}>Clear search</Button>
						</div>
					{:else}
						{#each filteredTrades as trade (trade.transactionHash || `${trade.timestamp}-${trade.size}`)}
							<a
								href={trade.eventSlug ? `/event/${trade.eventSlug}` : '#'}
								class="position-card"
								class:no-link={!trade.eventSlug}
							>
								<div class="card-header">
									{#if trade.icon}
										<img src={trade.icon} alt="" class="market-icon" loading="lazy" />
									{/if}
									<div class="card-title-section">
										<span class="market-title">{trade.title || 'Unknown Market'}</span>
										{#if trade.outcome}
											<span class="market-outcome" class:yes={trade.outcome === 'Yes'}
												>{trade.outcome}</span
											>
										{/if}
									</div>
								</div>

								<div class="card-stats">
									<div class="stat-item">
										<span class="stat-label">Side</span>
										<span
											class="side-badge"
											class:buy={trade.side === 'BUY'}
											class:sell={trade.side === 'SELL'}
										>
											{trade.side}
										</span>
									</div>

									<div class="stat-item">
										<span class="stat-label">Price</span>
										<span class="stat-value">{formatPrice(trade.price)}</span>
									</div>

									<div class="stat-item">
										<span class="stat-label">Amount</span>
										<span class="stat-value">{trade.size.toFixed(2)}</span>
									</div>

									<div class="stat-item">
										<span class="stat-label">Total</span>
										<span class="stat-value">{formatCurrency(trade.size * trade.price)}</span>
									</div>

									<div class="stat-item">
										<span class="stat-label">Date</span>
										<span class="stat-value">{formatDateTime(trade.timestamp)}</span>
									</div>
								</div>
							</a>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-lg) 12px;
	}

	@media (min-width: 768px) {
		.page-container {
			padding: var(--space-lg) 24px;
		}
	}

	.cards-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	@media (min-width: 768px) {
		.cards-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.portfolio-card {
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: var(--radius-xl);
		padding: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		min-height: 200px;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.card-label {
		font-size: 14px;
		font-weight: 500;
		color: var(--text-2);
	}

	.cash-badge {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		background: var(--bg-2);
		border-radius: var(--radius-full);
		font-size: 13px;
		font-weight: 600;
		color: var(--text-1);
	}

	.value {
		font-size: 28px;
		font-weight: 600;
		color: var(--text-0);
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.card-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-top: auto;
	}

	.portfolio-content {
		display: flex;
		flex-direction: column;
	}

	.tabs-header {
		display: flex;
		gap: var(--space-xs);
		border-bottom: 1px solid var(--bg-3);
		margin-bottom: var(--space-md);
	}

	.tab {
		padding: var(--space-sm) var(--space-md);
		font-size: 14px;
		font-weight: 500;
		color: var(--text-2);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		transition: all var(--transition-fast);
		position: relative;
		white-space: nowrap;
	}

	.tab:hover {
		color: var(--text-1);
	}

	.tab.active {
		color: var(--text-0);
		font-weight: 600;
		border-bottom-color: var(--primary);
	}

	.tab-content {
		min-height: 400px;
	}

	.empty-state,
	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-2xl) var(--space-lg);
		text-align: center;
		min-height: 400px;
	}

	.empty-title,
	.error-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--text-1);
		margin-top: var(--space-md);
		margin-bottom: var(--space-xs);
	}

	.empty-text,
	.error-text {
		font-size: 14px;
		color: var(--text-2);
		margin-bottom: var(--space-md);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--bg-3);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin-bottom: var(--space-md);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.positions-table {
		display: block;
	}

	.positions-cards {
		display: none;
	}

	@media (max-width: 639px) {
		.positions-table {
			display: none;
		}

		.positions-cards {
			display: block;
		}
	}

	.table-controls {
		display: flex;
		gap: var(--space-md);
		padding: 0 0 var(--space-md) 0;
		align-items: center;
	}

	.sort-button {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 16px;
		background: var(--bg-2);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-button);
		font-size: 14px;
		font-weight: 500;
		color: var(--text-2);
		cursor: not-allowed;
		opacity: 0.6;
		white-space: nowrap;
	}

	.table-header {
		display: grid;
		grid-template-columns: minmax(200px, 2fr) 140px 120px 120px 120px;
		gap: var(--space-md);
		padding: var(--space-sm) 0;
		font-size: 11px;
		font-weight: 600;
		color: var(--text-3);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border-bottom: 1px solid var(--bg-3);
	}

	.table-row {
		display: grid;
		grid-template-columns: minmax(200px, 2fr) 140px 120px 120px 120px;
		gap: var(--space-md);
		padding: var(--space-md) 0;
		border-bottom: 1px solid var(--bg-3);
		text-decoration: none;
		color: inherit;
		transition: background-color var(--transition-fast);
		align-items: center;
	}

	.table-row:hover {
		background: var(--bg-1);
	}

	.table-row:last-child {
		border-bottom: none;
	}

	.col-market {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
	}

	.market-icon {
		width: 40px;
		height: 40px;
		border-radius: 8px;
		object-fit: cover;
		flex-shrink: 0;
	}

	.market-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.market-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-0);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.market-outcome {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-2);
		padding: 2px 8px;
		background: var(--bg-3);
		border-radius: 4px;
		width: fit-content;
	}

	.market-outcome.yes {
		background: var(--success-bg);
		color: var(--success);
	}

	.col-price-change {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 14px;
		color: var(--text-1);
	}

	.price-label {
		font-weight: 500;
	}

	.col-bet,
	.col-to-win {
		font-size: 14px;
		font-weight: 500;
		color: var(--text-1);
	}

	.col-value {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.value-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.value-amount {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-0);
	}

	.value-amount.profit {
		color: var(--success);
	}

	.value-amount.loss {
		color: var(--danger);
	}

	.pnl-badge {
		font-size: 12px;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 4px;
		width: fit-content;
	}

	.pnl-badge.profit {
		background: var(--success-bg);
		color: var(--success);
	}

	.pnl-badge.loss {
		background: var(--danger-bg);
		color: var(--danger);
	}

	@media (max-width: 767px) {
		.table-header,
		.table-row {
			grid-template-columns: minmax(180px, 2fr) 120px 100px 100px;
		}

		.col-bet {
			display: none;
		}
	}

	.mobile-search {
		padding: 0 0 var(--space-md) 0;
	}

	.position-card {
		padding: var(--space-md) 0;
		border-bottom: 1px solid var(--bg-3);
		text-decoration: none;
		color: inherit;
		display: block;
		transition: background-color var(--transition-fast);
	}

	.position-card:hover {
		background: var(--bg-1);
	}

	.position-card:last-child {
		border-bottom: none;
	}

	.position-card .card-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: var(--space-md);
	}

	.position-card .market-icon {
		width: 48px;
		height: 48px;
		border-radius: 8px;
		object-fit: cover;
		flex-shrink: 0;
	}

	.card-title-section {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
		flex: 1;
	}

	.card-title-section .market-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--text-0);
	}

	.card-title-section .market-outcome {
		font-size: 13px;
		font-weight: 500;
		padding: 3px 10px;
		background: var(--bg-3);
		color: var(--text-2);
		border-radius: 4px;
		width: fit-content;
	}

	.card-title-section .market-outcome.yes {
		background: var(--success-bg);
		color: var(--success);
	}

	.card-stats {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.stat-label {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-2);
	}

	.stat-value {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-0);
	}

	.stat-value-with-pnl {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.stat-value-with-pnl .value-amount {
		font-size: 14px;
		font-weight: 600;
	}

	.stat-value-with-pnl .pnl-badge {
		font-size: 12px;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 4px;
	}

	.desktop-only {
		display: block;
	}

	.mobile-only {
		display: none;
	}

	@media (max-width: 639px) {
		.desktop-only {
			display: none;
		}

		.mobile-only {
			display: block;
		}
	}

	.side-badge {
		font-size: 12px;
		font-weight: 700;
		padding: 4px 10px;
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.side-badge.buy {
		background: var(--success-bg);
		color: var(--success);
	}

	.side-badge.sell {
		background: var(--danger-bg);
		color: var(--danger);
	}

	.col-side,
	.col-filled,
	.col-date {
		font-size: 14px;
		font-weight: 500;
		color: var(--text-1);
	}

	.history-header {
		grid-template-columns: minmax(200px, 2fr) 100px 100px 100px 100px 120px;
	}

	.history-header + .table-row {
		grid-template-columns: minmax(200px, 2fr) 100px 100px 100px 100px 120px;
	}

	a.table-row.no-link {
		cursor: default;
		pointer-events: none;
	}

	a.table-row.no-link:hover {
		background: transparent;
	}

	@media (max-width: 767px) {
		.history-header {
			grid-template-columns: minmax(180px, 2fr) 90px 90px 100px 120px;
		}

		.history-header + .table-row {
			grid-template-columns: minmax(180px, 2fr) 90px 90px 100px 120px;
		}

		.history-header > div:nth-child(3),
		.table-row > div:nth-child(3) {
			display: none;
		}
	}
</style>
