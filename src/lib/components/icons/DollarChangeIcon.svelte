<script lang="ts">
	interface Props {
		size?: number;
		color?: string;
		class?: string;
	}

	let { size = 24, color = 'currentColor', class: className = '' }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill={color}
	xmlns="http://www.w3.org/2000/svg"
	class={className}
>
	<g clip-path="url(#clip0_dollar_change)">
		<path
			d="M15.0002 22.7502H13.6802L15.8002 19.2202L17.0902 19.9902L16.4302 21.0802C19.1902 20.4302 21.2602 17.9502 21.2602 14.9902V14.2402H22.7602V14.9902C22.7602 19.2602 19.2802 22.7402 15.0102 22.7402L15.0002 22.7502Z"
		/>
		<path
			d="M2.75 9.75H1.25V9C1.25 4.73 4.73 1.25 9 1.25H10.32L8.2 4.78L6.91 4.00999L7.57 2.92C4.81 3.57 2.74 6.04999 2.74 9.00999V9.75999L2.75 9.75Z"
		/>
		<path d="M12.75 6.25H11.25V9H12.75V6.25Z" />
		<path d="M12.75 15H11.25V17.75H12.75V15Z" />
		<path
			d="M14.75 15.75H9.25V13.51H10.75V14.25H13.25V13.11L10.87 12.49C10.27 12.34 9.85 12.24 9.84 12.24L9.25 12.11V8.25H14.75V10.46H13.25V9.75H10.75V10.91C10.9 10.95 11.06 10.99 11.24 11.03L14.74 11.94V15.73L14.75 15.75Z"
		/>
	</g>
	<defs>
		<clipPath id="clip0_dollar_change">
			<rect width="24" height="24" fill="white" />
		</clipPath>
	</defs>
</svg>
