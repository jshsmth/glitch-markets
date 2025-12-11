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
	fill="none"
	stroke={color}
	stroke-width="1.5"
	stroke-linecap="round"
	stroke-linejoin="round"
	xmlns="http://www.w3.org/2000/svg"
	class={className}
>
	<path d="M8.56055 5.48981L12.0005 2.0498L15.4406 5.48981" />
	<path d="M15.4406 18.1098L12.0005 21.5498L8.56055 18.1098" />
	<path d="M12 8.19V15.42" />
</svg>
