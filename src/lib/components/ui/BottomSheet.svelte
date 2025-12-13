<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open?: boolean;
		title?: string;
		showHeader?: boolean;
		showCloseButton?: boolean;
		maxHeight?: string;
		onClose?: () => void;
		children?: Snippet;
		footer?: Snippet;
	}

	let {
		open = false,
		title = '',
		showHeader = true,
		showCloseButton = true,
		maxHeight = '85vh',
		onClose,
		children,
		footer
	}: Props = $props();

	function handleBackdropClick() {
		onClose?.();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose?.();
		}
	}

	$effect(() => {
		if (!open) return;
		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="backdrop"
		role="presentation"
		aria-hidden="true"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Enter' && handleBackdropClick()}
	></div>

	<div class="bottom-sheet" style="max-height: {maxHeight}">
		{#if showHeader}
			<div class="sheet-header">
				{#if title}
					<h3>{title}</h3>
				{/if}
				{#if showCloseButton}
					<button class="close-button" aria-label="Close" onclick={onClose}>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
							<path
								d="M18 6L6 18M6 6l12 12"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</svg>
					</button>
				{/if}
			</div>
		{/if}

		<div class="sheet-content">
			{@render children?.()}
		</div>

		{#if footer}
			<div class="sheet-footer">
				{@render footer()}
			</div>
		{/if}
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--overlay-backdrop-light);
		z-index: var(--z-bottom-sheet-backdrop);
		animation: fadeIn var(--transition-base);
	}

	.bottom-sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--bg-1);
		border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
		box-shadow: var(--shadow-sheet);
		z-index: var(--z-bottom-sheet);
		display: flex;
		flex-direction: column;
		animation: slideUp var(--transition-slow);
		max-height: 80vh;
	}

	.bottom-sheet::before {
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

	.sheet-header h3 {
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
		background: var(--primary-hover-bg);
		color: var(--primary);
		border-color: rgba(var(--primary-rgb), 0.2);
	}

	.close-button:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.close-button:active {
		transform: scale(0.95);
		background: var(--primary-hover-bg-medium);
	}

	.sheet-content {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-4);
		padding-bottom: var(--spacing-2);
		-webkit-overflow-scrolling: touch;
	}

	.sheet-footer {
		padding: var(--spacing-4);
		padding-bottom: max(var(--spacing-6), env(safe-area-inset-bottom, var(--spacing-6)));
		border-top: 1px solid var(--bg-3);
		flex-shrink: 0;
		background: var(--bg-1);
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
