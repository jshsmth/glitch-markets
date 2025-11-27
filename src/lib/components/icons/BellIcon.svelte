<script lang="ts">
	interface Props {
		size?: number;
		color?: string;
		hasNotifications?: boolean;
	}

	let { size = 24, color = 'currentColor', hasNotifications = false }: Props = $props();
</script>

<div class="bell-icon-wrapper" style="--size: {size}px">
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<g clip-path="url(#clip0_2826_100350)">
			<path
				d="M14.22 20.89C13.69 21.59 12.87 22 12 22C11.13 22 10.3 21.59 9.78 20.89"
				stroke={color}
				stroke-width="1.5"
				stroke-linecap="square"
				stroke-linejoin="round"
			/>
			<path
				d="M5.29999 11.77C5.29999 12.29 5.08 12.79 4.71 13.16L3.76 14.11C3 14.87 2.87001 16.17 3.58001 17.15C4.05001 17.79 4.85 18.11 5.65 18.11H18.51C19.66 18.11 20.67 17.28 20.86 16.08C20.98 15.29 20.64 14.51 20.07 13.94L19.24 13.11C18.86 12.73 18.65 12.23 18.65 11.69V8.19C18.65 8.02 18.63 7.86 18.61 7.69C17.99 4.17 15.1 1.98999 11.98 1.98999C8.3 1.98999 5.31 4.97 5.31 8.66L5.29999 11.77Z"
				stroke={color}
				stroke-width="1.5"
				stroke-linecap="square"
				stroke-linejoin="round"
			/>
		</g>
		<defs>
			<clipPath id="clip0_2826_100350">
				<rect width="24" height="24" fill="none" />
			</clipPath>
		</defs>
	</svg>

	{#if hasNotifications}
		<div class="notification-badge"></div>
	{/if}
</div>

<style>
	.bell-icon-wrapper {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--size);
		height: var(--size);
	}

	.notification-badge {
		position: absolute;
		top: 0;
		right: 0;
		width: 8px;
		height: 8px;
		background-color: var(--danger);
		border-radius: 50%;
		border: 2px solid var(--bg-0);
	}
</style>
