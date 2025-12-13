<script lang="ts">
	interface Props {
		size?: number;
		color?: string;
	}

	let { size = 24, color = 'currentColor' }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
	<path
		d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM8.5 15.5C6.57 15.5 5 13.93 5 12C5 10.07 6.57 8.5 8.5 8.5C10.43 8.5 12 10.07 12 12C12 13.93 10.43 15.5 8.5 15.5ZM8.5 13.5C9.33 13.5 10 12.83 10 12C10 11.17 9.33 10.5 8.5 10.5C7.67 10.5 7 11.17 7 12C7 12.83 7.67 13.5 8.5 13.5ZM17 15H15V13H14V11H15V9H17V11H19V13H17V15Z"
	/>
</svg>
