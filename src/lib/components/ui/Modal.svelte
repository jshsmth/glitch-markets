<script lang="ts">
	import type { ModalProps } from '$lib/types/modal';
	import { browser } from '$app/environment';

	let {
		isOpen,
		onClose,
		title = '',
		showCloseButton = true,
		maxWidth = '480px',
		fullScreenMobile = true,
		children
	}: ModalProps = $props();

	let modalElement = $state<HTMLDivElement | null>(null);
	let previousFocusElement = $state<HTMLElement | null>(null);

	// Focus trap and scroll lock
	$effect(() => {
		if (!browser) return;

		if (isOpen && modalElement) {
			// Store previous focus
			previousFocusElement = document.activeElement as HTMLElement;

			// Lock body scroll
			document.body.style.overflow = 'hidden';

			// Focus first focusable element
			const focusableElements = modalElement.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);

			if (focusableElements.length > 0) {
				focusableElements[0].focus();
			}

			// Trap focus within modal
			const handleTabKey = (e: KeyboardEvent) => {
				if (e.key !== 'Tab') return;

				const firstFocusable = focusableElements[0];
				const lastFocusable = focusableElements[focusableElements.length - 1];

				if (e.shiftKey) {
					// Shift + Tab
					if (document.activeElement === firstFocusable) {
						e.preventDefault();
						lastFocusable.focus();
					}
				} else {
					// Tab
					if (document.activeElement === lastFocusable) {
						e.preventDefault();
						firstFocusable.focus();
					}
				}
			};

			document.addEventListener('keydown', handleTabKey);

			return () => {
				// Restore focus
				previousFocusElement?.focus();

				// Unlock body scroll
				document.body.style.overflow = '';

				// Remove event listener
				document.removeEventListener('keydown', handleTabKey);
			};
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<div class="modal-backdrop" onclick={handleBackdropClick} role="presentation">
		<div
			bind:this={modalElement}
			class="modal-container"
			class:full-screen-mobile={fullScreenMobile}
			style="max-width: {maxWidth}"
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? 'modal-title' : undefined}
		>
			{#if title || showCloseButton}
				<div class="modal-header">
					{#if title}
						<h2 id="modal-title" class="modal-title">{title}</h2>
					{/if}
					{#if showCloseButton}
						<button class="close-button" onclick={onClose} aria-label="Close modal">
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M18 6L6 18M6 6L18 18"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</button>
					{/if}
				</div>
			{/if}

			<div class="modal-content">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: var(--overlay-backdrop);
		backdrop-filter: blur(4px);
		z-index: var(--z-overlay);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		animation: backdropFadeIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes backdropFadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-container {
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
		position: relative;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		animation: modalFadeIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes modalFadeIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* Mobile: Full screen */
	.modal-container.full-screen-mobile {
		height: 100vh;
		max-height: 100vh;
		border-radius: 0;
	}

	/* Tablet and Desktop: Centered with border radius */
	@media (min-width: 768px) {
		.modal-backdrop {
			padding: 24px;
		}

		.modal-container {
			border-radius: 16px;
			height: auto;
			max-height: 90vh;
		}

		.modal-container.full-screen-mobile {
			height: auto;
			max-height: 90vh;
			border-radius: 16px;
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px;
		padding-top: max(20px, env(safe-area-inset-top, 20px));
		background: linear-gradient(
			180deg,
			var(--bg-1) 0%,
			color-mix(in srgb, var(--bg-1) 95%, var(--primary) 5%) 100%
		);
	}

	.modal-title {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-0);
		margin: 0;
	}

	.close-button {
		background: none;
		border: 1px solid transparent;
		color: var(--text-2);
		cursor: pointer;
		padding: 8px;
		border-radius: 8px;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		align-items: center;
		justify-content: center;
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

	.modal-content {
		padding: 0 24px 24px;
		padding-bottom: max(24px, env(safe-area-inset-bottom, 24px));
	}

	@media (min-width: 768px) {
		.modal-header {
			padding: 20px 28px;
			padding-top: 20px;
		}

		.modal-content {
			padding: 0 28px 28px;
		}
	}

	/* Respect reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.modal-backdrop,
		.modal-container {
			animation: none;
		}

		.close-button {
			transition: none;
		}
	}
</style>
