<script lang="ts">
	import type { Component } from 'svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	let WithdrawModal: Component<{ isOpen: boolean; onClose: () => void }> | null = $state(null);
	let hasBeenOpened = $state(false);

	$effect(() => {
		if (isOpen && !hasBeenOpened) {
			hasBeenOpened = true;
			import('$lib/components/wallet/WithdrawModal.svelte').then((module) => {
				WithdrawModal = module.default;
			});
		}
	});
</script>

{#if WithdrawModal}
	{@const Component = WithdrawModal}
	<Component {isOpen} {onClose} />
{/if}
