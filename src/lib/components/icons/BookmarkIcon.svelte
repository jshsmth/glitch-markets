<script lang="ts">
	interface Props {
		size?: number;
		color?: string;
		filled?: boolean;
		class?: string;
	}

	let {
		size = 24,
		color = 'currentColor',
		filled = false,
		class: className = ''
	}: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill={filled ? color : 'none'}
	xmlns="http://www.w3.org/2000/svg"
	class={className}
>
	<path
		d="M17 3H7C5.9 3 5 3.9 5 5V21L12 18L19 21V5C19 3.9 18.1 3 17 3Z"
		stroke={color}
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
</svg>
