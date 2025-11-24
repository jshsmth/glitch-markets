<script lang="ts">
	import '$lib/styles/colors.css';
	import '$lib/styles/app.css';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { dev } from '$app/environment';
	import { createQueryClient } from '$lib/query/client';

	let { children, data } = $props();

	const queryClient = data?.queryClient || createQueryClient();
</script>

<QueryClientProvider client={queryClient}>
	{@render children()}
	{#if dev}
		<SvelteQueryDevtools buttonPosition="bottom-right" />
	{/if}
</QueryClientProvider>
