/**
 * Centralized constants for cache TTLs, timeouts, and delays
 * Used throughout the application for consistent timing configurations
 */

/**
 * Cache time-to-live values in milliseconds
 */
export const CACHE_TTL = {
	/** No caching - for real-time data like health checks */
	NONE: 0,
	/** 1 minute - for frequently changing data (markets, events, tags, series, comments) */
	DEFAULT: 60000,
	/** 5 minutes - for less frequently changing data (bridge assets, builder leaderboard) */
	EXTENDED: 300000,
	/** 5 minutes - for builder leaderboard (rankings change frequently) */
	BUILDERS_LEADERBOARD: 300000,
	/** 10 minutes - for builder volume time-series (historical data, less volatile) */
	BUILDERS_VOLUME: 600000
} as const;

/**
 * Debounce delays in milliseconds
 */
export const DEBOUNCE_DELAYS = {
	/** Search input debouncing */
	SEARCH: 300,
	/** General input debouncing */
	INPUT: 150
} as const;

/**
 * Network timeouts in milliseconds
 */
export const TIMEOUTS = {
	/** API request timeout */
	API_REQUEST: 5000,
	/** requestIdleCallback timeout for SDK initialization */
	IDLE_CALLBACK_LONG: 2000,
	/** requestIdleCallback timeout for route preloading */
	IDLE_CALLBACK_SHORT: 1000,
	/** Fallback setTimeout for SDK initialization when requestIdleCallback unavailable */
	SDK_INIT_FALLBACK: 100,
	/** Loading animation fade-out delay */
	LOADING_FADE: 300
} as const;

/**
 * React Query / TanStack Query cache configuration
 */
export const QUERY_CACHE = {
	/** How long data stays fresh before refetching (1 minute) */
	STALE_TIME: 60 * 1000,
	/** How long unused data stays in cache (5 minutes) */
	GC_TIME: 5 * 60 * 1000,
	/** Number of retry attempts for failed queries */
	RETRY_COUNT: 1
} as const;
