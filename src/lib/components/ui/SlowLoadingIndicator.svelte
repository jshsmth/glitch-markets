<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { TIMEOUTS } from '$lib/config/constants';
	import { fade } from 'svelte/transition';

	let { isNavigating }: { isNavigating: boolean } = $props();

	let showSlowMessage = $state(false);
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (isNavigating) {
			timeoutId = setTimeout(() => {
				showSlowMessage = true;
			}, TIMEOUTS.SLOW_LOADING_THRESHOLD);
		} else {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
			showSlowMessage = false;
		}
	});

	onDestroy(() => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	});
</script>

{#if isNavigating && showSlowMessage}
	<div class="slow-loading" transition:fade={{ duration: 200 }} role="status" aria-live="polite">
		<div class="slow-loading-content">
			<div class="spinner"></div>
			<p>Taking longer than usual...</p>
		</div>
	</div>
{/if}

<style>
	.slow-loading {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: var(--z-modal);
		background: var(--bg-2);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-6);
		box-shadow: var(--shadow-lg);
		pointer-events: none;
	}

	.slow-loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-3);
	}

	.slow-loading-content p {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		margin: 0;
		text-align: center;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--bg-3);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
