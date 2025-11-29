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
		d="M9.42999 23.23V13.77H4L15.46 0.75V10.2101H20.89L9.42999 23.23ZM7.31 12.26H10.93V19.25L17.57 11.7001H13.95V4.71008L7.31 12.26Z"
	/>
</svg>
