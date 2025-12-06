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
		if (open) {
			document.addEventListener('keydown', handleKeydown);
			return () => document.removeEventListener('keydown', handleKeydown);
		}
	});
</script>

{#if open}
	<div
		class="backdrop"
		role="button"
		tabindex="-1"
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
		background: rgba(0, 0, 0, 0.5);
		z-index: var(--z-overlay);
		animation: fadeIn 0.2s ease-out;
	}

	.bottom-sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--bg-1);
		border-radius: 20px 20px 0 0;
		box-shadow:
			0 -4px 20px rgba(0, 0, 0, 0.15),
			0 -1px 3px rgba(0, 0, 0, 0.1);
		z-index: var(--z-modal);
		display: flex;
		flex-direction: column;
		animation: slideUp 0.25s ease-out;
		max-height: 80vh;
	}

	.bottom-sheet::before {
		content: '';
		position: absolute;
		top: 8px;
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
		padding: 24px 16px 16px;
		border-bottom: 1px solid var(--bg-3);
		flex-shrink: 0;
	}

	.sheet-header h3 {
		font-size: 20px;
		font-weight: 700;
		color: var(--text-0);
		margin: 0;
		letter-spacing: -0.3px;
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: transparent;
		border: none;
		border-radius: 8px;
		color: var(--text-2);
		cursor: pointer;
		transition: all 0.15s;
	}

	.close-button:hover {
		background: var(--bg-2);
		color: var(--text-0);
	}

	.sheet-content {
		flex: 1;
		overflow-y: auto;
		padding: 16px;
		padding-bottom: 8px;
		-webkit-overflow-scrolling: touch;
	}

	.sheet-footer {
		padding: 16px;
		padding-bottom: max(24px, env(safe-area-inset-bottom, 24px));
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
