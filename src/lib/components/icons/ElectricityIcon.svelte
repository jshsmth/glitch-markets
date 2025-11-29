<script lang="ts">
	interface Props {
		size?: number;
		color?: string;
	}

	let { size = 24, color = 'currentColor' }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path d="M18.25 16.75H5.75V4.25H18.25V16.75ZM7.25 15.25H16.75V5.75H7.25V15.25Z" fill={color} />
	<path d="M10.25 1.25H8.75V5.75H10.25V1.25Z" fill={color} />
	<path d="M15.25 1.25H13.75V5.75H15.25V1.25Z" fill={color} />
	<path d="M12.75 15.25H11.25V22.75H12.75V15.25Z" fill={color} />
</svg>
