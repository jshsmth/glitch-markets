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

	const lastPoint = $derived(
		data.length > 0
			? {
					x: $xGet(data[data.length - 1]),
					y: $yGet(data[data.length - 1])
				}
			: null
	);
</script>

<g>
	<path class="path-line" d={path} style="stroke: {color};" />
	{#if lastPoint}
		<circle class="endpoint-dot pulse" cx={lastPoint.x} cy={lastPoint.y} r="4" style="fill: {color};" />
	{/if}
</g>

<style>
	.path-line {
		fill: none;
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}

	.endpoint-dot {
		filter: drop-shadow(0 0 4px currentColor);
	}

	.endpoint-dot.pulse {
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
			r: 4;
		}
		50% {
			opacity: 0.6;
			r: 6;
		}
	}
</style>
