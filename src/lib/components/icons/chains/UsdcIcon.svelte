<script lang="ts">
	interface Props {
		size?: number;
		color?: string;
	}

	let { size = 24, color = '#2775CA' }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
>
	<circle cx="12" cy="12" r="12" fill={color} />
	<path
		d="M16.0899 17.4101H7.91992V13.5801H9.41992V15.9101H14.5899V13.5801L9.76992 12.0001C8.97992 11.7201 8.45992 11.5501 8.44992 11.5501L7.92992 11.3801V6.56006H16.0999V10.3901H14.5999V8.06006H9.42992V10.2901C9.64992 10.3601 9.92992 10.4601 10.2499 10.5701L16.0899 12.4801V17.4101Z"
		fill="white"
	/>
	<path d="M12.75 5.25H11.25V18.75H12.75V5.25Z" fill="white" />
</svg>
