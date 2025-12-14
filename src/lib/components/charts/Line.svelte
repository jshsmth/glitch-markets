<script lang="ts">
	import { getContext } from 'svelte';

	const { data, xGet, yGet } = getContext<any>('LayerCake');

	const path = $derived(
		$data
			.map((d: any, i: number) => {
				const x = $xGet(d);
				const y = $yGet(d);
				return `${i === 0 ? 'M' : 'L'}${x},${y}`;
			})
			.join(' ')
	);
</script>

<path class="path-line" d={path} />

<style>
	.path-line {
		fill: none;
		stroke: var(--primary);
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
</style>
