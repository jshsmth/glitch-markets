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
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	xmlns="http://www.w3.org/2000/svg"
	class={className}
>
	<circle cx="12" cy="12" r="10"></circle>
	<line x1="15" y1="9" x2="9" y2="15"></line>
	<line x1="9" y1="9" x2="15" y2="15"></line>
</svg>
