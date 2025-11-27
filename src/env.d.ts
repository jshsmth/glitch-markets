/// <reference types="vite/client" />
/// <reference types="@vite-pwa/sveltekit" />

// SvelteKit Environment Variables Type Definitions
// This file ensures TypeScript knows about all environment variables
// used throughout the application. These must match your .env file.

declare module '$env/static/private' {
	// Database
	export const DATABASE_URL: string;

	// Polymarket API Configuration
	export const POLYMARKET_API_URL: string;
	export const POLYMARKET_API_TIMEOUT: string;
	export const POLYMARKET_CACHE_TTL: string;
	export const POLYMARKET_CACHE_ENABLED: string;

	// Dynamic Labs Configuration (Server)
	export const DYNAMIC_ENVIRONMENT_ID: string;
	export const DYNAMIC_ORGANIZATION_ID: string;
	export const DYNAMIC_API_TOKEN: string;

	// Dynamic Server Wallets Configuration
	export const DYNAMIC_SERVER_WALLET_ENCRYPTION_KEY: string;

	// Polymarket CLOB Configuration
	export const POLYMARKET_CLOB_URL: string;
	export const POLYMARKET_GAMMA_API_URL: string;

	// Encryption Keys
	export const POLYMARKET_ENCRYPTION_KEY: string;

	// JWT Configuration
	export const JWT_SECRET: string;
	export const JWT_EXPIRATION: string;

	// Porto Configuration
	export const PORTO_CHAIN_ID: string;
}

declare module '$env/static/public' {
	// Dynamic Labs Configuration (Client)
	export const PUBLIC_DYNAMIC_ENVIRONMENT_ID: string;

	// WalletConnect Configuration
	export const PUBLIC_WALLETCONNECT_PROJECT_ID: string;
}

declare module '$env/dynamic/private' {
	export const env: {
		DATABASE_URL: string;
		POLYMARKET_API_URL: string;
		POLYMARKET_API_TIMEOUT: string;
		POLYMARKET_CACHE_TTL: string;
		POLYMARKET_CACHE_ENABLED: string;
		DYNAMIC_ENVIRONMENT_ID: string;
		DYNAMIC_ORGANIZATION_ID: string;
		DYNAMIC_API_TOKEN: string;
		DYNAMIC_SERVER_WALLET_ENCRYPTION_KEY: string;
		POLYMARKET_CLOB_URL: string;
		POLYMARKET_GAMMA_API_URL: string;
		POLYMARKET_ENCRYPTION_KEY: string;
		JWT_SECRET: string;
		JWT_EXPIRATION: string;
		PORTO_CHAIN_ID: string;
	};
}

declare module '$env/dynamic/public' {
	export const env: {
		PUBLIC_DYNAMIC_ENVIRONMENT_ID: string;
		PUBLIC_WALLETCONNECT_PROJECT_ID: string;
	};
}
