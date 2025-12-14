<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { categories } from '$lib/config/categories';

	interface Props {
		open?: boolean;
		onClose?: () => void;
	}

	let { open = false, onClose }: Props = $props();

	const featuredCategories = $derived(categories.filter((c) => c.href === '/' || c.href === '/new'));
	const regularCategories = $derived(categories.filter((c) => c.href !== '/' && c.href !== '/new'));

	function handleCategoryClick(href: string) {
		goto(href);
		onClose?.();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose?.();
		}
	}

	function isActive(href: string): boolean {
		const pathname = $page.url.pathname;
		if (href === '/') return pathname === '/';
		return pathname === href || pathname.startsWith(href + '/');
	}

	$effect(() => {
		if (!open) return;
		document.body.style.overflow = 'hidden';
		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.body.style.overflow = '';
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

{#if open}
	<div class="category-picker-overlay" role="dialog" aria-modal="true" aria-label="Categories">
		<div
			class="backdrop"
			role="presentation"
			aria-hidden="true"
			onclick={() => onClose?.()}
			onkeydown={(e) => e.key === 'Enter' && onClose?.()}
		></div>

		<div class="picker-sheet">
			<div class="sheet-header">
				<h2>Categories</h2>
				<button class="close-button" onclick={() => onClose?.()} aria-label="Close">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
						<path
							d="M18 6L6 18M6 6l12 12"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					</svg>
				</button>
			</div>

			<div class="sheet-content">
				<div class="featured-section">
					{#each featuredCategories as category (category.name)}
						{@const Icon = category.icon}
						<button
							class="category-card featured"
							class:active={isActive(category.href)}
							onclick={() => handleCategoryClick(category.href)}
						>
							{#if Icon}
								<span class="category-icon">
									<Icon size={24} color="currentColor" />
								</span>
							{/if}
							<span class="category-name">{category.name}</span>
						</button>
					{/each}
				</div>

				<div class="divider"></div>

				<div class="categories-grid">
					{#each regularCategories as category (category.name)}
						{@const Icon = category.icon}
						<button
							class="category-card"
							class:active={isActive(category.href)}
							onclick={() => handleCategoryClick(category.href)}
						>
							{#if Icon}
								<span class="category-icon">
									<Icon size={22} color="currentColor" />
								</span>
							{/if}
							<span class="category-name">{category.name}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.category-picker-overlay {
		position: fixed;
		inset: 0;
		z-index: calc(var(--z-bottom-nav) + 10);
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}

	.backdrop {
		position: absolute;
		inset: 0;
		background: var(--overlay-backdrop-light);
		animation: fadeIn var(--transition-base);
	}

	.picker-sheet {
		position: relative;
		background: var(--bg-1);
		border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
		max-height: 75vh;
		display: flex;
		flex-direction: column;
		animation: slideUp var(--transition-slow);
		padding-bottom: env(safe-area-inset-bottom, 0);
	}

	.picker-sheet::before {
		content: '';
		position: absolute;
		top: var(--spacing-2);
		left: 50%;
		transform: translateX(-50%);
		width: 36px;
		height: 4px;
		background: var(--bg-3);
		border-radius: 2px;
	}

	.sheet-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-6) var(--spacing-4) var(--spacing-4);
		border-bottom: 1px solid var(--bg-3);
		flex-shrink: 0;
	}

	.sheet-header h2 {
		font-size: var(--text-xl);
		font-weight: var(--font-bold);
		color: var(--text-0);
		margin: 0;
		letter-spacing: var(--tracking-snug);
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		color: var(--text-2);
		cursor: pointer;
		transition: var(--transition-all);
	}

	.close-button:hover {
		background: var(--bg-2);
		color: var(--text-0);
	}

	.close-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.close-button:active {
		transform: scale(0.95);
	}

	.sheet-content {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-4);
		-webkit-overflow-scrolling: touch;
	}

	.featured-section {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-3);
		margin-bottom: var(--spacing-4);
	}

	.divider {
		height: 1px;
		background: var(--bg-3);
		margin-bottom: var(--spacing-4);
	}

	.categories-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--spacing-3);
	}

	.category-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-2);
		padding: var(--spacing-4) var(--spacing-2);
		background: var(--bg-2);
		border: 1px solid var(--bg-3);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: var(--transition-all);
		min-height: 80px;
	}

	.category-card:hover {
		background: var(--bg-3);
		border-color: var(--bg-4);
	}

	.category-card:active {
		transform: scale(0.97);
	}

	.category-card:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.category-card.active {
		background: var(--primary-hover-bg);
		border-color: var(--primary);
		color: var(--primary);
	}

	.category-card.featured {
		min-height: 90px;
	}

	.category-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-1);
	}

	.category-card.active .category-icon {
		color: var(--primary);
	}

	.category-name {
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		color: var(--text-0);
		text-align: center;
	}

	.category-card.active .category-name {
		color: var(--primary);
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
