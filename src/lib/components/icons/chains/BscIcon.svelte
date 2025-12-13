<script lang="ts">
	interface Props {
		size?: number;
		color?: string;
	}

	let { size = 24, color = 'currentColor' }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
	<path d="M12 4L14.5 6.5L10 11L7.5 8.5L12 4Z" />
	<path d="M14.5 6.5L17 4L21.5 8.5L19 11L14.5 6.5Z" />
	<path d="M19 11L21.5 13.5L17 18L14.5 15.5L19 11Z" />
	<path d="M14.5 15.5L17 18L12 23L7 18L9.5 15.5L12 18L14.5 15.5Z" />
	<path d="M9.5 15.5L7 18L2.5 13.5L5 11L9.5 15.5Z" />
	<path d="M5 11L2.5 8.5L7 4L9.5 6.5L5 11Z" />
	<path d="M12 9L14 11L12 13L10 11L12 9Z" />
</svg>
