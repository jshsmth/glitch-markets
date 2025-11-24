<script lang="ts">
	import { browser } from '$app/environment';
	import { dynamicClient } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	let clientInfo = $state<any>(null);
	let error = $state<string | null>(null);

	onMount(() => {
		if (browser && $dynamicClient) {
			try {
				clientInfo = {
					exists: !!$dynamicClient,
					type: typeof $dynamicClient,
					isSignedIn: typeof $dynamicClient.isSignedIn === 'function' ? $dynamicClient.isSignedIn() : 'N/A',
					methods: Object.keys($dynamicClient).filter(key => typeof $dynamicClient[key] === 'function'),
					properties: Object.keys($dynamicClient).filter(key => typeof $dynamicClient[key] !== 'function')
				};
			} catch (err) {
				error = err instanceof Error ? err.message : String(err);
			}
		}
	});

	async function testLogin() {
		if (!$dynamicClient) {
			error = 'No client';
			return;
		}

		try {
			console.log('Client:', $dynamicClient);
			console.log('Available methods:', Object.keys($dynamicClient));

			// Try different possible API methods
			if ($dynamicClient.ui?.auth?.show) {
				await $dynamicClient.ui.auth.show();
			} else if ($dynamicClient.auth?.login) {
				await $dynamicClient.auth.login();
			} else if (typeof $dynamicClient.showAuthFlow === 'function') {
				await $dynamicClient.showAuthFlow();
			} else {
				error = 'No login method found. Available: ' + Object.keys($dynamicClient).join(', ');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			console.error('Login error:', err);
		}
	}
</script>

<div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
	<h1>Dynamic Client Debug</h1>

	{#if browser}
		<div style="margin: 2rem 0;">
			<h2>Client Status</h2>
			{#if $dynamicClient}
				<p style="color: green;">✓ Client exists</p>
				<button onclick={testLogin} style="padding: 1rem 2rem; font-size: 1rem;">
					Test Login
				</button>
			{:else}
				<p style="color: red;">✗ No client found</p>
			{/if}
		</div>

		{#if clientInfo}
			<div style="background: #f5f5f5; padding: 1rem; border-radius: 0.5rem; margin: 2rem 0;">
				<h3>Client Info</h3>
				<pre>{JSON.stringify(clientInfo, null, 2)}</pre>
			</div>
		{/if}

		{#if error}
			<div style="background: #fee; padding: 1rem; border-radius: 0.5rem; color: #c00; margin: 2rem 0;">
				<h3>Error</h3>
				<p>{error}</p>
			</div>
		{/if}
	{:else}
		<p>Loading (SSR)...</p>
	{/if}
</div>
