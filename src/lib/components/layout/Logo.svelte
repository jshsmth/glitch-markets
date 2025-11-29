<script lang="ts">
	import { browser } from '$app/environment';

	// Read theme directly from DOM on client
	let theme = $state<'light' | 'dark'>('dark');

	// Only run on client
	if (browser) {
		const currentTheme = document.documentElement.getAttribute('data-theme');
		theme = currentTheme === 'light' ? 'light' : 'dark';

		// Watch for theme changes
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
					const newTheme = document.documentElement.getAttribute('data-theme');
					theme = newTheme === 'light' ? 'light' : 'dark';
				}
			});
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});
	}

	let logoSrc = $derived(theme === 'dark' ? '/logo-light.svg' : '/logo-dark.svg');
</script>

{#if browser}
	<img src={logoSrc} alt="Glitch Markets" class="logo" width="147" height="28" />
{:else}
	<!-- SSR fallback - exact dimensions to prevent layout shift (CLS) -->
	<div class="logo-skeleton" role="img" aria-label="Glitch Markets"></div>
{/if}

<style>
	.logo {
		height: 36px;
		width: auto;
		display: block;
	}

	.logo-skeleton {
		height: 36px;
		width: 190px; /* 36px height * 5.27 aspect ratio */
		background: transparent;
	}
</style>
