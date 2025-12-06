<script lang="ts">
	interface Props {
		size?: number;
		color?: string;
	}

	let { size = 20, color = 'currentColor' }: Props = $props();
</script>

<!-- Email icon from Iconsax -->
<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill={color}
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<g clip-path="url(#clip0_2826_106332)">
		<path
			d="M1.75 3.85986V20.5299H21.75V3.85986H1.75ZM17.6 9.54987L11.75 12.0799L11.45 11.9499L5.20001 9.22986L5.79999 7.84987L11.75 10.4399L17 8.16986L17.69 7.86986L18.29 9.24986L17.6 9.54987Z"
		/>
	</g>
	<defs>
		<clipPath id="clip0_2826_106332">
			<rect width="24" height="24" fill="white" />
		</clipPath>
	</defs>
</svg>
