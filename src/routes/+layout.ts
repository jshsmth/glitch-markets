import { createQueryClient } from '$lib/query/client';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	const queryClient = createQueryClient();

	return {
		queryClient
	};
};
