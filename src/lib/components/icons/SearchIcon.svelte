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
	<path
		d="M10.75 20.5C5.37 20.5 1 16.13 1 10.75C1 5.37 5.37 1 10.75 1C16.13 1 20.5 5.37 20.5 10.75C20.5 16.13 16.13 20.5 10.75 20.5ZM10.75 2.5C6.2 2.5 2.5 6.2 2.5 10.75C2.5 15.3 6.2 19 10.75 19C15.3 19 19 15.3 19 10.75C19 6.2 15.3 2.5 10.75 2.5Z"
	/>
	<path
		d="M20.2006 17.0313L18.1658 19.0262L20.216 21.1182L21.8585 19.5083L22.2514 19.1241L20.2006 17.0313ZM20.2329 19.5631L19.7216 19.0425L20.1856 18.5873L20.6969 19.1079L20.2329 19.5631Z"
	/>
</svg>
