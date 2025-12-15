<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';

	interface Props {
		color?: 'success' | 'danger' | 'primary';
	}

	interface DataPoint {
		x: number;
		y: number;
	}

	interface LayerCakeContext {
		data: Writable<DataPoint[]>;
		xGet: Writable<(d: DataPoint) => number>;
		yGet: Writable<(d: DataPoint) => number>;
		xScale: Writable<(val: number) => number>;
		yScale: Writable<(val: number) => number>;
	}

	const COLOR_MAP = {
		success: 'rgb(34, 197, 94)', // green
		danger: 'rgb(239, 68, 68)', // red
		primary: 'rgb(139, 92, 246)' // purple
	} as const;

	let { color = 'primary' }: Props = $props();

	const { data, xGet, yGet, xScale, yScale } = getContext<LayerCakeContext>('LayerCake');

	const path = $derived('M' + $data.map((d) => `${$xGet(d)},${$yGet(d)}`).join('L'));

	const area = $derived(
		path +
			`L${$xScale($data[$data.length - 1].x)},${$yScale(0)}L${$xScale($data[0].x)},${$yScale(0)}Z`
	);

	const gradientColor = $derived(COLOR_MAP[color]);
</script>

<defs>
	<linearGradient id="area-gradient-{color}" x1="0%" y1="0%" x2="0%" y2="100%">
		<stop offset="0%" style="stop-color:{gradientColor};stop-opacity:0.3" />
		<stop offset="100%" style="stop-color:{gradientColor};stop-opacity:0.05" />
	</linearGradient>
</defs>

<path class="area-path" d={area} fill="url(#area-gradient-{color})" />

<style>
	.area-path {
		stroke: none;
	}
</style>
