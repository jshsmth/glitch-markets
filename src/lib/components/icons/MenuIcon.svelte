<script lang="ts">
	interface Props {
		size?: number;
		color?: string;
		class?: string;
	}

	let { size = 24, color = 'currentColor', class: className = '' }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill={color}
	xmlns="http://www.w3.org/2000/svg"
	class={className}
>
	<path d="M21.5 6H2V7.5H21.5V6Z" />
	<path d="M21.5 11H2V12.5H21.5V11Z" />
	<path d="M21.5 16H2V17.5H21.5V16Z" />
</svg>
