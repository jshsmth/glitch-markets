/// <reference types="vite/client" />
/// <reference types="@vite-pwa/sveltekit" />
/// <reference types="vite-plugin-pwa/svelte" />

// SvelteKit Environment Variables Type Definitions
// This file ensures TypeScript knows about all environment variables
// used throughout the application. These must match your .env file.

declare module '$env/static/private' {
	// Polymarket API Configuration
	export const POLYMARKET_API_URL: string;
	export const POLYMARKET_API_TIMEOUT: string;
	export const POLYMARKET_CACHE_TTL: string;
	export const POLYMARKET_CACHE_ENABLED: string;

	// Encryption Keys
	export const SERVER_WALLET_ENCRYPTION_KEY: string;
	export const POLYMARKET_ENCRYPTION_KEY: string;

	// Supabase Configuration
	export const SUPABASE_SERVICE_ROLE_KEY: string;
}

declare module '$env/static/public' {
	// Supabase Configuration
	export const PUBLIC_SUPABASE_URL: string;
	export const PUBLIC_SUPABASE_ANON_KEY: string;
}

declare module '$env/dynamic/private' {
	export const env: {
		POLYMARKET_API_URL: string;
		POLYMARKET_API_TIMEOUT: string;
		POLYMARKET_CACHE_TTL: string;
		POLYMARKET_CACHE_ENABLED: string;
		SERVER_WALLET_ENCRYPTION_KEY: string;
		POLYMARKET_ENCRYPTION_KEY: string;
		SUPABASE_SERVICE_ROLE_KEY: string;
	};
}

declare module '$env/dynamic/public' {
	export const env: {
		PUBLIC_SUPABASE_URL: string;
		PUBLIC_SUPABASE_ANON_KEY: string;
	};
}
