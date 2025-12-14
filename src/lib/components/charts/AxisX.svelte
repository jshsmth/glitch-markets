<script lang="ts">
	import { getContext } from 'svelte';

	interface Props {
		formatDate: (val: Date | number) => string;
		ticks?: number;
	}

	let { formatDate, ticks = 4 }: Props = $props();

	const { width, height, xScale } = getContext<any>('LayerCake');

	const tickVals = $derived($xScale?.ticks?.(ticks) ?? []);
</script>

<g class="axis axis-x">
	{#each tickVals as tick (tick)}
		{@const x = $xScale(tick)}
		<g class="tick" transform="translate({x},{$height})">
			<line y1="0" y2="6" stroke="var(--bg-3)" />
			<text y="18" text-anchor="middle">
				{formatDate(tick)}
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
