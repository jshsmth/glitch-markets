// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase/database.types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient<Database>;
			user?: {
				userId: string;
				walletAddress: string;
				email: string;
			};
		}
		// interface PageData {}
		interface PageState {
			supabase: SupabaseClient<Database>;
		}
		// interface Platform {}
	}
}

export {};
