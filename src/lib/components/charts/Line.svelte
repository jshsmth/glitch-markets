<script lang="ts">
	import { getContext } from 'svelte';

	interface Props {
		color: string;
		data: Array<{ x: Date; y: number }>;
	}

	let { color, data }: Props = $props();

	const { xGet, yGet } = getContext<any>('LayerCake');

	const path = $derived(
		data
			.map((d: any, i: number) => {
				const x = $xGet(d);
				const y = $yGet(d);
				return `${i === 0 ? 'M' : 'L'}${x},${y}`;
			})
			.join(' ')
	);
</script>

<path class="path-line" d={path} style="stroke: {color};" />

<style>
	.path-line {
		fill: none;
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
</style>
