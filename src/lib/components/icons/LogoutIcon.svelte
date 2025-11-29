<script lang="ts">
	interface Props {
		size?: number;
		color?: string;
	}

	let { size = 24, color = 'currentColor' }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path
		d="M17.1889 15.3005L16.1289 14.2405L18.6889 11.6805L16.1289 9.12054L17.1889 8.06055L20.8089 11.6805L17.1889 15.3005Z"
		fill={color}
	/>
	<path d="M19.4598 10.9297H8.75977V12.4297H19.4598V10.9297Z" fill={color} />
	<path
		d="M12.2598 20.3701H2.75977V2.87012H12.2598V4.37012H4.25977V18.8701H12.2598V20.3701Z"
		fill={color}
	/>
</svg>
