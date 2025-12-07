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
	<path
		d="M19.2104 15.19C19.2104 16.71 18.6604 18.22 17.6404 19.4C16.4104 20.82 14.5004 21.77 12.0304 21.77C10.8504 21.77 9.78041 21.59 8.85041 21.23C6.32042 20.3 4.78039 18.16 4.86039 15.19C4.98039 10.57 10.0304 9.52002 9.9304 2.27002C9.9304 2.27002 19.2104 7.78002 19.2104 15.19Z"
	/>
</svg>
