<script lang="ts">
	interface Props {
		currentStatus?: string;
		currentSort?: string;
		onStatusChange?: (status: 'active' | 'closed' | 'all') => void;
		onSortChange?: (sort: string) => void;
	}

	let {
		currentStatus = 'active',
		currentSort = 'volume24hr',
		onStatusChange,
		onSortChange
	}: Props = $props();

	let isOpen = $state(false);
	let buttonElement: HTMLButtonElement | undefined = $state();
	let panelElement: HTMLDivElement | undefined = $state();
	let wrapperElement: HTMLDivElement | undefined = $state();
	let hoverTimeout: ReturnType<typeof setTimeout> | undefined = $state();

	const statusOptions = [
		{ value: 'active', label: 'Active' },
		{ value: 'closed', label: 'Resolved' }
	];

	const sortOptions = [
		{ value: 'volume24hr', label: '24h Vol' },
		{ value: 'volume', label: '7d Vol' },
		{ value: 'liquidity', label: 'Liquidity' },
		{ value: 'createdAt', label: 'Newest' }
	];

	function handleMouseEnter() {
		if (hoverTimeout) clearTimeout(hoverTimeout);
		hoverTimeout = setTimeout(() => {
			isOpen = true;
		}, 50);
	}

	function handleMouseLeave() {
		if (hoverTimeout) clearTimeout(hoverTimeout);
		hoverTimeout = setTimeout(() => {
			isOpen = false;
		}, 150);
	}

	function handleClickOutside(event: MouseEvent) {
		if (
			isOpen &&
			wrapperElement &&
			panelElement &&
			!wrapperElement.contains(event.target as Node) &&
			!panelElement.contains(event.target as Node)
		) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div
	class="filter-wrapper"
	bind:this={wrapperElement}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	role="group"
>
	<button class="filter-button" bind:this={buttonElement}>
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
			<path
				d="M2 4h12M4 8h8M6 12h4"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
			/>
		</svg>
		Filters
	</button>

	{#if isOpen && buttonElement}
		<!-- Mobile backdrop -->
		<div
			class="backdrop"
			role="button"
			tabindex="-1"
			onclick={() => (isOpen = false)}
			onkeydown={(e) => e.key === 'Escape' && (isOpen = false)}
		></div>

		<div
			class="filter-panel"
			bind:this={panelElement}
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
			role="menu"
			tabindex="-1"
		>
			<div class="filter-group">
				<span class="group-label">Status</span>
				<div class="options">
					{#each statusOptions as option (option.value)}
						<button
							class="option-chip"
							class:active={currentStatus === option.value}
							onclick={() => onStatusChange?.(option.value as 'active' | 'closed')}
						>
							{option.label}
						</button>
					{/each}
				</div>
			</div>

			<div class="filter-group">
				<span class="group-label">Sort by</span>
				<div class="options">
					{#each sortOptions as option (option.value)}
						<button
							class="option-chip"
							class:active={currentSort === option.value}
							onclick={() => onSortChange?.(option.value)}
						>
							{option.label}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.filter-wrapper {
		position: relative;
	}

	.filter-button {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		background: var(--bg-1);
		color: var(--text-0);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-button);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		min-height: 36px;
		transition: all 0.15s;
	}

	.filter-button:hover {
		background: var(--bg-2);
	}

	.filter-button svg {
		color: var(--text-2);
	}

	.backdrop {
		display: none;
	}

	.filter-panel {
		position: fixed;
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-md);
		padding: var(--spacing-4);
		box-shadow: var(--shadow-dropdown);
		z-index: var(--z-popover);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4);
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.group-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-3);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.options {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.option-chip {
		padding: 6px 12px;
		background: var(--bg-2);
		color: var(--text-2);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-button);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
		min-height: 32px;
		flex-shrink: 0;
	}

	.option-chip:hover {
		background: var(--bg-3);
	}

	.option-chip.active {
		background: var(--primary);
		color: var(--bg-0);
		border-color: var(--primary);
		font-weight: 600;
	}

	/* Desktop */
	@media (min-width: 769px) {
		.filter-panel {
			position: absolute;
			top: calc(100% + 8px);
			right: 0;
			min-width: 280px;
			max-width: 320px;
		}
	}

	/* Mobile */
	@media (max-width: 768px) {
		.filter-button {
			min-height: 44px;
		}

		.backdrop {
			display: block;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.5);
			z-index: var(--z-overlay);
			animation: fadeIn 0.2s ease-out;
		}

		.filter-panel {
			bottom: 0;
			left: 0;
			right: 0;
			border-radius: var(--radius-xl) var(--radius-xl) 0 0;
			padding: var(--spacing-5) var(--spacing-4) var(--spacing-6);
			box-shadow: var(--shadow-sheet);
			animation: slideUp 0.2s ease-out;
			z-index: var(--z-popover);
		}

		.filter-group {
			gap: 12px;
		}

		.group-label {
			font-size: 12px;
		}

		.option-chip {
			min-height: 40px;
			padding: 8px 14px;
			font-size: 14px;
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
