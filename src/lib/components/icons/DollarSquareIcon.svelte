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
		d="M7.91992 17.4101V13.5801H9.41992V15.9101H14.5899V13.6201L9.75992 12.0001C8.99992 11.7301 8.49992 11.6001 8.48992 11.5901L7.92992 11.4401V6.57007H16.0999V10.4001H14.5999V8.07007H9.42992V10.3001C9.64992 10.3701 9.92992 10.4601 10.2499 10.5701L16.0899 12.5301V17.4001L7.91992 17.4101Z"
	/>
	<path d="M12.75 5.25H11.25V18.75H12.75V5.25Z" />
	<path
		d="M22.75 22.75H1.25V1.25H22.75V22.75ZM2.75 21.25H21.25V2.75H2.75V21.25Z"
	/>
</svg>
