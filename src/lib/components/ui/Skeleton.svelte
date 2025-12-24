<script lang="ts">
	interface Props {
		width?: string;
		height?: string;
		borderRadius?: string;
		class?: string;
	}

	let { width, height, borderRadius = 'var(--radius-md)', class: className }: Props = $props();
</script>

<div class="skeleton {className}" style:width style:height style:border-radius={borderRadius}></div>

<style>
	@import '$lib/styles/skeleton.css';
</style>
