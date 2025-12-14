<script lang="ts">
	import { getContext } from 'svelte';

	interface Props {
		formatPercent: (val: number) => string;
		ticks?: number;
	}

	let { formatPercent, ticks = 5 }: Props = $props();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const { width, yScale } = getContext<any>('LayerCake');

	const tickVals = $derived($yScale?.ticks?.(ticks) ?? []);
</script>

<g class="axis axis-y">
	{#each tickVals as tick (tick)}
		{@const y = $yScale(tick)}
		<g class="tick" transform="translate({$width},{y})">
			<line x1="0" x2="6" stroke="var(--bg-3)" />
			<text x="10" text-anchor="start" dominant-baseline="middle">
				{formatPercent(tick)}
			</text>
		</g>
	{/each}
</g>

<style>
	.axis text {
		font-size: 11px;
		fill: var(--text-3);
		user-select: none;
	}

	.tick line {
		stroke: var(--bg-3);
	}
</style>
