<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	interface Props extends HTMLAnchorAttributes {
		/**
		 * Label for the stat (e.g., "Portfolio", "Cash")
		 */
		label: string;

		/**
		 * Value to display (e.g., "$1,234.56")
		 */
		value: string;

		/**
		 * Optional color for the value
		 * - 'success' for positive/gains
		 * - 'danger' for negative/losses
		 * - 'default' for neutral
		 */
		valueColor?: 'success' | 'danger' | 'default';

		/**
		 * Link destination
		 */
		href?: string;

		/**
		 * Click handler (if not using href)
		 */
		onclick?: (event: MouseEvent) => void;
	}

	let {
		label,
		value,
		valueColor = 'default',
		href,
		onclick,
		class: className,
		...restProps
	}: Props = $props();

	const Element = href ? 'a' : 'button';
</script>

<svelte:element
	this={Element}
	class="portfolio-stat {className || ''}"
	{href}
	{onclick}
	{...restProps}
>
	<span class="stat-label">{label}</span>
	<span class="stat-value value-{valueColor}">{value}</span>
</svelte:element>

<style>
	.portfolio-stat {
		/* Reset */
		background: none;
		border: none;
		margin: 0;
		padding: 0;
		cursor: pointer;
		text-decoration: none;

		/* Layout */
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;

		/* Spacing */
		padding: 8px 12px;
		border-radius: var(--radius-md);

		/* Transition */
		transition: var(--transition-colors);
	}

	.portfolio-stat:hover {
		background-color: var(--bg-2);
	}

	.portfolio-stat:active {
		background-color: var(--bg-3);
	}

	.portfolio-stat:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.stat-label {
		font-size: 11px;
		color: var(--text-2);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		line-height: 1.2;
	}

	.stat-value {
		font-size: 16px;
		font-weight: 600;
		font-feature-settings: 'tnum';
		line-height: 1.2;
	}

	/* Value color variants */
	.stat-value.value-default {
		color: var(--text-0);
	}

	.stat-value.value-success {
		color: var(--success);
	}

	.stat-value.value-danger {
		color: var(--danger);
	}
</style>
