<script lang="ts">
	import { useRegisterSW } from 'virtual:pwa-register/svelte';
	import { onMount } from 'svelte';

	const { offlineReady, updateServiceWorker } = useRegisterSW({
		immediate: true,
		onRegisteredSW(swScriptUrl, registration) {
			if (registration) {
				setInterval(
					() => {
						registration.update();
					},
					60 * 60 * 1000
				);
			}
		}
	});

	let showToast = $state(false);
	let timeoutId: number | undefined;

	$effect(() => {
		if ($offlineReady && !showToast) {
			showToast = true;
			if (timeoutId) clearTimeout(timeoutId);
			timeoutId = window.setTimeout(() => {
				showToast = false;
			}, 4000);
		}
	});

	onMount(() => {
		return () => {
			if (timeoutId) clearTimeout(timeoutId);
		};
	});

	function handleClose() {
		showToast = false;
		if (timeoutId) clearTimeout(timeoutId);
	}
</script>

{#if showToast}
	<div class="toast-container" role="status" aria-live="polite">
		<div class="toast">
			<div class="toast-content">
				<div class="toast-icon">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z" />
						<path d="m9 12 2 2 4-4" />
					</svg>
				</div>
				<div class="toast-message">
					<p class="toast-title">App Ready</p>
					<p class="toast-description">Cached and ready for offline use</p>
				</div>
				<div class="toast-actions">
					<button class="btn-close" onclick={handleClose} aria-label="Close notification">
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M18 6 6 18M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.toast-container {
		position: fixed;
		bottom: var(--spacing-6);
		right: var(--spacing-6);
		z-index: var(--z-toast);
		pointer-events: none;
	}

	.toast {
		pointer-events: auto;
		background: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: 12px;
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
		max-width: 420px;
		animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateY(20px) translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0) translateX(0);
		}
	}

	.toast-content {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		padding: 20px;
	}

	.toast-icon {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		background: color-mix(in srgb, var(--primary) 10%, transparent);
		color: var(--primary);
	}

	.toast-message {
		flex: 1;
		min-width: 0;
	}

	.toast-title {
		margin: 0 0 4px 0;
		font-size: 15px;
		font-weight: 600;
		color: var(--text-0);
		line-height: 1.4;
	}

	.toast-description {
		margin: 0;
		font-size: 14px;
		color: var(--text-2);
		line-height: 1.5;
	}

	.toast-actions {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.btn-close {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-2);
		color: var(--text-2);
		border: 1px solid var(--bg-4);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.btn-close:hover {
		background: var(--bg-3);
		color: var(--text-0);
		border-color: var(--bg-5);
	}

	.btn-close:active {
		transform: scale(0.95);
	}

	.btn-close:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	@media (max-width: 768px) {
		.toast-container {
			bottom: calc(var(--spacing-6) + env(safe-area-inset-bottom, 0px));
			right: var(--spacing-4);
			left: var(--spacing-4);
		}

		.toast {
			max-width: none;
		}

		.toast-content {
			gap: 12px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.toast {
			animation: none;
		}

		.btn-close {
			transition: none;
		}
	}
</style>
