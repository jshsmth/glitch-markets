<script lang="ts">
	import type { Component } from 'svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	let DepositModal: Component<{ isOpen: boolean; onClose: () => void }> | null = $state(null);
	let hasBeenOpened = $state(false);

	$effect(() => {
		if (isOpen && !hasBeenOpened) {
			hasBeenOpened = true;
			import('$lib/components/wallet/DepositModal.svelte').then((module) => {
				DepositModal = module.default;
			});
		}
	});
</script>

{#if DepositModal}
	{@const Component = DepositModal}
	<Component {isOpen} {onClose} />
{/if}
