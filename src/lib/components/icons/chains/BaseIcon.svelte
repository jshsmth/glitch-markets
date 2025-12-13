<script lang="ts">
	interface Props {
		size?: number;
		color?: string;
	}

	let { size = 24, color = 'currentColor' }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
	<path
		fill-rule="evenodd"
		clip-rule="evenodd"
		d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM11.9 18C15.2137 18 17.9 15.3137 17.9 12C17.9 8.68629 15.2137 6 11.9 6C8.77342 6 6.20656 8.39529 5.92822 11.45H14V12.55H5.92822C6.20656 15.6047 8.77342 18 11.9 18Z"
	/>
</svg>
