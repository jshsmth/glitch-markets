<script lang="ts">
	import type { ModalProps } from '$lib/types/modal';
	import { browser } from '$app/environment';
	import { focusTrap } from '$lib/actions/focusTrap';

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

	$effect(() => {
		if (!browser) return;

		if (isOpen) {
			document.body.style.overflow = 'hidden';

			return () => {
				document.body.style.overflow = '';
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
			use:focusTrap={{ enabled: isOpen }}
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
		box-shadow: var(--shadow-modal);
		position: relative;
		width: 100%;
		max-height: 90vh;
		animation: modalFadeIn var(--transition-base) cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		flex-direction: column;
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
		height: 100dvh;
		max-height: 100dvh;
		border-radius: 0;
		display: flex;
		flex-direction: column;
	}

	/* Tablet and Desktop: Centered with border radius */
	@media (min-width: 768px) {
		.modal-backdrop {
			padding: var(--spacing-6);
		}

		.modal-container {
			border-radius: var(--radius-xl);
			height: auto;
			max-height: 90vh;
		}

		.modal-container.full-screen-mobile {
			height: auto;
			max-height: 90vh;
			border-radius: var(--radius-xl);
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-5) var(--spacing-6);
		padding-top: max(var(--spacing-5), env(safe-area-inset-top, var(--spacing-5)));
		background: linear-gradient(
			180deg,
			var(--bg-1) 0%,
			color-mix(in srgb, var(--bg-1) 95%, var(--primary) 5%) 100%
		);
		flex-shrink: 0;
		border-radius: 0;
	}

	.modal-title {
		flex: 1;
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--text-0);
		margin: 0;
	}

	.close-button {
		flex-shrink: 0;
		margin-left: auto;
		background: none;
		border: 1px solid transparent;
		color: var(--text-2);
		cursor: pointer;
		padding: var(--spacing-2);
		border-radius: var(--radius-md);
		transition: var(--transition-all);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-button:hover {
		background: var(--primary-hover-bg);
		color: var(--primary);
		border-color: var(--primary-hover-border);
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
		padding: 0 var(--spacing-6) var(--spacing-6);
		padding-bottom: max(var(--spacing-6), env(safe-area-inset-bottom, var(--spacing-6)));
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
	}

	@media (min-width: 768px) {
		.modal-header {
			padding: var(--spacing-5) var(--spacing-8);
			padding-top: var(--spacing-5);
			border-radius: var(--radius-xl) var(--radius-xl) 0 0;
		}

		.modal-content {
			padding: 0 var(--spacing-8) var(--spacing-8);
			padding-bottom: var(--spacing-8);
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
