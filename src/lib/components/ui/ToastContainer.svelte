<script lang="ts">
	import { toastState, dismissToast } from '$lib/stores/toast.svelte';
	import { fly } from 'svelte/transition';
</script>

<div class="toast-container" role="region" aria-label="Notifications">
	{#each toastState.toasts as toast (toast.id)}
		<div
			class="toast toast-{toast.type}"
			role="alert"
			aria-live="polite"
			transition:fly={{ y: -20, duration: 300 }}
		>
			<div class="toast-content">
				<span class="toast-message">{toast.message}</span>
				<button
					class="toast-close"
					onclick={() => dismissToast(toast.id)}
					aria-label="Close notification"
				>
					×
				</button>
			</div>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		top: var(--spacing-4);
		right: var(--spacing-4);
		z-index: var(--z-toast);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
		pointer-events: none;
		max-width: min(90vw, 400px);
	}

	.toast {
		background: var(--bg-2);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: var(--spacing-3) var(--spacing-4);
		box-shadow: var(--shadow-md);
		pointer-events: auto;
		min-width: 250px;
	}

	.toast-content {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		justify-content: space-between;
	}

	.toast-message {
		color: var(--text-primary);
		font-size: var(--font-size-sm);
		line-height: 1.4;
		flex: 1;
	}

	.toast-close {
		background: none;
		border: none;
		color: var(--text-secondary);
		font-size: 24px;
		line-height: 1;
		cursor: pointer;
		padding: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
		flex-shrink: 0;
	}

	.toast-close:hover {
		background: var(--bg-3);
		color: var(--text-primary);
	}

	.toast-info {
		border-left: 3px solid var(--primary);
	}

	.toast-success {
		border-left: 3px solid var(--success);
	}

	.toast-warning {
		border-left: 3px solid var(--warning);
	}

	.toast-error {
		border-left: 3px solid var(--danger);
	}

	@media (max-width: 768px) {
		.toast-container {
			top: var(--spacing-3);
			right: var(--spacing-3);
			left: var(--spacing-3);
			max-width: none;
		}

		.toast {
			min-width: auto;
		}
	}
</style>
