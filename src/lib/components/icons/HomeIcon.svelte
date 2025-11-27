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
		d="M22.75 22.7502H1.25V8.52016L12 0.160156L22.75 8.52016V22.7502ZM2.75 21.2502H21.25V9.26016L12 2.06016L2.75 9.26016V21.2502Z"
	/>
	<path d="M12.75 14.25H11.25V18.75H12.75V14.25Z" />
</svg>
