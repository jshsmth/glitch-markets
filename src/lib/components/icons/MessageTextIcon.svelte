<script lang="ts">
	interface Props {
		size?: number;
		color?: string;
	}

	let { size = 24, color = 'currentColor' }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill={color}
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<path
		d="M8.742 18.9949H1.56348V1H22.4765V18.9949H15.298L12.0103 23.3721L8.742 18.9949ZM3.03226 17.5359H9.48126L12.0297 20.9403L14.5782 17.5359H21.0175V2.45905H3.02252V6.10667V17.5359H3.03226Z"
	/>
	<path d="M17.6226 6.83594H6.43652V8.29499H17.6226V6.83594Z" />
	<path d="M13.7318 11.6992H6.43652V13.1583H13.7318V11.6992Z" />
</svg>
