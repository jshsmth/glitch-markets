<script lang="ts">
	import { getContext } from 'svelte';

	interface Props {
		formatDate: (val: Date | number) => string;
		formatPercent: (val: number) => string;
	}

	let { formatDate, formatPercent }: Props = $props();

	const { data, xGet, yGet, xScale, width, height } = getContext<any>('LayerCake');

	let mouseX = $state(0);
	let mouseY = $state(0);
	let isHovering = $state(false);
	let tooltipData = $state<{ x: Date; y: number } | null>(null);

	function handleMouseMove(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const clientX = e.clientX - rect.left;
		const clientY = e.clientY - rect.top;
		isHovering = true;

		const xValue = $xScale.invert(clientX);
		const closestPoint = $data.reduce((closest: any, point: any) => {
			const pointX = point.x instanceof Date ? point.x.getTime() : point.x;
			const targetX = xValue instanceof Date ? xValue.getTime() : xValue;
			const closestX = closest?.x instanceof Date ? closest.x.getTime() : (closest?.x ?? Infinity);

			return Math.abs(pointX - targetX) < Math.abs(closestX - targetX) ? point : closest;
		}, null);

		if (closestPoint) {
			tooltipData = closestPoint;
			mouseX = $xGet(closestPoint);
			mouseY = $yGet(closestPoint);
		}
	}

	function handleMouseLeave() {
		isHovering = false;
		tooltipData = null;
	}
</script>

<div
	class="tooltip-layer"
	role="img"
	aria-label="Price chart tooltip"
	onmousemove={handleMouseMove}
	onmouseleave={handleMouseLeave}
>
	{#if isHovering && tooltipData}
		<div class="crosshair-vertical" style="left: {mouseX}px;"></div>
		<div class="crosshair-horizontal" style="top: {mouseY}px;"></div>
		<div class="tooltip-dot" style="left: {mouseX}px; top: {mouseY}px;"></div>
		<div
			class="tooltip-box"
			style="left: {mouseX > $width / 2 ? mouseX - 110 : mouseX + 10}px; top: {mouseY - 50}px;"
		>
			<div class="tooltip-value">{formatPercent(tooltipData.y)}</div>
			<div class="tooltip-date">{formatDate(tooltipData.x)}</div>
		</div>
	{/if}
</div>

<style>
	.tooltip-layer {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: all;
	}

	.crosshair-vertical,
	.crosshair-horizontal {
		position: absolute;
		pointer-events: none;
		z-index: 1;
	}

	.crosshair-vertical {
		top: 0;
		width: 1px;
		height: 100%;
		background: var(--bg-4);
	}

	.crosshair-horizontal {
		left: 0;
		width: 100%;
		height: 1px;
		background: var(--bg-4);
	}

	.tooltip-dot {
		position: absolute;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--primary);
		border: 2px solid var(--bg-1);
		transform: translate(-50%, -50%);
		pointer-events: none;
		z-index: 2;
	}

	.tooltip-box {
		position: absolute;
		padding: 8px 12px;
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: 8px;
		pointer-events: none;
		z-index: 3;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.tooltip-value {
		font-size: 16px;
		font-weight: 700;
		color: var(--text-0);
		margin-bottom: 2px;
	}

	.tooltip-date {
		font-size: 11px;
		color: var(--text-3);
	}
</style>
