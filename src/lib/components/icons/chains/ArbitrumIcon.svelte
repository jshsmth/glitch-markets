<script lang="ts">
	interface Props {
		size?: number;
		color?: string;
	}

	let { size = 24, color = 'currentColor' }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
	<path
		d="M12.65 3.31L20.76 11.42C21.15 11.81 21.15 12.44 20.76 12.83L12.65 20.94C12.26 21.33 11.63 21.33 11.24 20.94L3.13 12.83C2.74 12.44 2.74 11.81 3.13 11.42L11.24 3.31C11.63 2.92 12.26 2.92 12.65 3.31Z"
	/>
	<path
		fill-rule="evenodd"
		clip-rule="evenodd"
		d="M9.5 9L7 14.5L9 15L10.5 11.5L12 15L14 14.5L11.5 9H9.5Z"
		fill="var(--bg-0, #0D0D0D)"
	/>
	<path d="M13.5 9L16 14.5L14 15L13.5 14L15 11L13.5 9Z" fill="var(--bg-0, #0D0D0D)" />
</svg>
