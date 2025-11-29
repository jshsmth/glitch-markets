<script lang="ts">
	import { generateComponentId } from '$lib/utils/id';

	interface Props {
		size?: number;
		color?: string;
	}

	let { size = 24, color = 'currentColor' }: Props = $props();
	const clipId = generateComponentId('clip-cup');
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill={color}
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<g clip-path="url(#{clipId})">
		<path
			d="M11.9999 16.0802C8.51994 16.0802 5.68994 13.2502 5.68994 9.77023V1.24023H18.2999V9.77023C18.2999 13.2502 15.4799 16.0802 11.9999 16.0802ZM7.18994 2.75023V9.78023C7.18994 12.4302 9.34994 14.5902 11.9999 14.5902C14.6499 14.5902 16.8099 12.4302 16.8099 9.78023V2.75023H7.19994H7.18994Z"
		/>
		<path
			d="M6.90977 12.7505H5.33977C3.08977 12.7505 1.25977 10.9205 1.25977 8.67047V3.48047H6.44977V4.98047H2.75977V8.67047C2.75977 10.0905 3.91977 11.2505 5.33977 11.2505H6.90977V12.7505Z"
		/>
		<path
			d="M18.6701 12.7505H17.1001V11.2505H18.6701C20.0901 11.2505 21.2501 10.0905 21.2501 8.67047V4.98047H17.5601V3.48047H22.7501V8.67047C22.7501 10.9205 20.9201 12.7505 18.6701 12.7505Z"
		/>
		<path
			d="M18.99 22.7499H5.02002L6.58002 17.9199H17.42L18.99 22.7499ZM7.08002 21.2499H16.92L16.32 19.4199H7.66002L7.07002 21.2499H7.08002Z"
		/>
		<path d="M12.75 15.3301H11.25V18.6601H12.75V15.3301Z" />
	</g>
	<defs>
		<clipPath id={clipId}>
			<rect width="24" height="24" fill="white" />
		</clipPath>
	</defs>
</svg>
