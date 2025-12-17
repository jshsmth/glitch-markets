<script lang="ts">
	import { getContext } from 'svelte';

	interface Series {
		name: string;
		color: string;
		data: Array<{ t: number; p: number }>;
	}

	interface TooltipItem {
		name: string;
		color: string;
		value: number;
		y: number;
	}

	interface Props {
		formatDate: (val: Date | number) => string;
		formatPercent: (val: number) => string;
		series: Series[];
	}

	let { formatDate, formatPercent, series }: Props = $props();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const { xGet, yGet, xScale, width } = getContext<any>('LayerCake');

	let mouseX = $state(0);
	let isHovering = $state(false);
	let tooltipDate = $state<Date | null>(null);
	let tooltipItems = $state<TooltipItem[]>([]);

	function handleMouseMove(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const clientX = e.clientX - rect.left;
		isHovering = true;

		const xValue = $xScale.invert(clientX);
		const targetTime = xValue instanceof Date ? xValue.getTime() : xValue;

		const items: TooltipItem[] = [];
		let newDate: Date | null = null;
		let newMouseX = 0;

		for (const s of series) {
			if (s.data.length === 0) continue;

			const closestPoint = s.data.reduce((closest, point) => {
				const pointTime = point.t * 1000;
				const closestTime = closest.t * 1000;
				return Math.abs(pointTime - targetTime) < Math.abs(closestTime - targetTime)
					? point
					: closest;
			});

			const dataPoint = { x: new Date(closestPoint.t * 1000), y: closestPoint.p * 100 };
			const yPos = $yGet(dataPoint);

			items.push({
				name: s.name,
				color: s.color,
				value: closestPoint.p * 100,
				y: yPos
			});

			if (!newDate) {
				newDate = new Date(closestPoint.t * 1000);
				newMouseX = $xGet(dataPoint);
			}
		}

		tooltipDate = newDate;
		mouseX = newMouseX;
		tooltipItems = items;
	}

	function handleMouseLeave() {
		isHovering = false;
		tooltipDate = null;
		tooltipItems = [];
	}

	function handleTouchMove(e: TouchEvent) {
		e.preventDefault();
		const touch = e.touches[0];
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const clientX = touch.clientX - rect.left;
		isHovering = true;

		const xValue = $xScale.invert(clientX);
		const targetTime = xValue instanceof Date ? xValue.getTime() : xValue;

		const items: TooltipItem[] = [];
		let newDate: Date | null = null;
		let newMouseX = 0;

		for (const s of series) {
			if (s.data.length === 0) continue;

			const closestPoint = s.data.reduce((closest, point) => {
				const pointTime = point.t * 1000;
				const closestTime = closest.t * 1000;
				return Math.abs(pointTime - targetTime) < Math.abs(closestTime - targetTime)
					? point
					: closest;
			});

			const dataPoint = { x: new Date(closestPoint.t * 1000), y: closestPoint.p * 100 };
			const yPos = $yGet(dataPoint);

			items.push({
				name: s.name,
				color: s.color,
				value: closestPoint.p * 100,
				y: yPos
			});

			if (!newDate) {
				newDate = new Date(closestPoint.t * 1000);
				newMouseX = $xGet(dataPoint);
			}
		}

		tooltipDate = newDate;
		mouseX = newMouseX;
		tooltipItems = items;
	}

	function handleTouchEnd() {
		isHovering = false;
		tooltipDate = null;
		tooltipItems = [];
	}
</script>

<div
	class="tooltip-layer"
	role="img"
	aria-label="Price chart tooltip"
	onmousemove={handleMouseMove}
	onmouseleave={handleMouseLeave}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	ontouchcancel={handleTouchEnd}
>
	{#if isHovering && tooltipItems.length > 0 && tooltipDate}
		<div class="crosshair-vertical" style="left: {mouseX}px;"></div>
		{#each tooltipItems as item (item.name)}
			<div
				class="tooltip-dot"
				style="left: {mouseX}px; top: {item.y}px; background: {item.color};"
			></div>
		{/each}
		<div
			class="tooltip-box"
			style="left: {mouseX > $width / 2 ? mouseX - 140 : mouseX + 10}px; top: 10px;"
		>
			<div class="tooltip-date">{formatDate(tooltipDate)}</div>
			{#each tooltipItems as item (item.name)}
				<div class="tooltip-item">
					<div class="tooltip-dot-inline" style="background: {item.color};"></div>
					<span class="tooltip-name">{item.name}</span>
					<span class="tooltip-value">{formatPercent(item.value)}</span>
				</div>
			{/each}
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

	.crosshair-vertical {
		position: absolute;
		pointer-events: none;
		z-index: 1;
		top: 0;
		width: 1px;
		height: 100%;
		background: var(--bg-4);
	}

	.tooltip-dot {
		position: absolute;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		border: 2px solid var(--bg-1);
		transform: translate(-50%, -50%);
		pointer-events: none;
		z-index: 2;
	}

	.tooltip-box {
		position: absolute;
		padding: 10px 12px;
		background: var(--bg-1);
		border: 1px solid var(--bg-3);
		border-radius: 8px;
		pointer-events: none;
		z-index: 3;
		box-shadow: var(--shadow-md);
		min-width: 120px;
	}

	.tooltip-date {
		font-size: 11px;
		color: var(--text-3);
		margin-bottom: 8px;
		padding-bottom: 6px;
		border-bottom: 1px solid var(--bg-3);
	}

	.tooltip-item {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 4px;
	}

	.tooltip-dot-inline {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.tooltip-name {
		font-size: 12px;
		color: var(--text-2);
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tooltip-value {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-0);
		flex-shrink: 0;
	}
</style>
