import { createQueryClient } from '$lib/query/client';
import type { LayoutLoad } from './$types';

/**
 * Root layout load function.
 * Creates a QueryClient instance that can be used for SSR prefetching in child routes.
 */
export const load: LayoutLoad = async () => {
	const queryClient = createQueryClient();

	return {
		queryClient
	};
};
