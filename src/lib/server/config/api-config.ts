export interface ApiConfig {
	baseUrl: string;
	dataApiUrl: string;
	bridgeApiUrl: string;
	clobApiUrl: string;
	timeout: number;
	cacheTtl: number;
	enableCache: boolean;
}

const DEFAULT_CONFIG: ApiConfig = {
	baseUrl: 'https://gamma-api.polymarket.com',
	dataApiUrl: 'https://data-api.polymarket.com',
	bridgeApiUrl: 'https://bridge.polymarket.com',
	clobApiUrl: 'https://clob.polymarket.com',
	timeout: 10000,
	cacheTtl: 60,
	enableCache: true
};

/**
 * Error thrown when invalid configuration is provided
 * Thrown during application startup when environment variables are invalid
 */
export class ConfigurationError extends Error {
	/**
	 * Creates a new ConfigurationError
	 * @param message - Description of the configuration error
	 */
	constructor(message: string) {
		super(message);
		this.name = 'ConfigurationError';
	}
}

function isValidUrl(url: string): boolean {
	try {
		const parsedUrl = new URL(url);
		return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
	} catch {
		return false;
	}
}

/**
 * Validates configuration values
 * Ensures all required fields are present and have valid values
 *
 * @param config - The configuration object to validate
 * @throws {ConfigurationError} When any configuration value is invalid
 *
 * @example
 * ```typescript
 * const config = { baseUrl: 'https://api.example.com', dataApiUrl: 'https://data-api.example.com', timeout: 10000, cacheTtl: 60, enableCache: true };
 * validateConfig(config); // Throws if invalid
 * ```
 */
export function validateConfig(config: ApiConfig): void {
	if (!config.baseUrl || typeof config.baseUrl !== 'string') {
		throw new ConfigurationError('baseUrl must be a non-empty string');
	}

	if (!isValidUrl(config.baseUrl)) {
		throw new ConfigurationError('baseUrl must be a valid URL');
	}

	if (!config.dataApiUrl || typeof config.dataApiUrl !== 'string') {
		throw new ConfigurationError('dataApiUrl must be a non-empty string');
	}

	if (!isValidUrl(config.dataApiUrl)) {
		throw new ConfigurationError('dataApiUrl must be a valid URL');
	}

	if (!config.bridgeApiUrl || typeof config.bridgeApiUrl !== 'string') {
		throw new ConfigurationError('bridgeApiUrl must be a non-empty string');
	}

	if (!isValidUrl(config.bridgeApiUrl)) {
		throw new ConfigurationError('bridgeApiUrl must be a valid URL');
	}

	if (!config.clobApiUrl || typeof config.clobApiUrl !== 'string') {
		throw new ConfigurationError('clobApiUrl must be a non-empty string');
	}

	if (!isValidUrl(config.clobApiUrl)) {
		throw new ConfigurationError('clobApiUrl must be a valid URL');
	}

	if (typeof config.timeout !== 'number' || config.timeout <= 0) {
		throw new ConfigurationError('timeout must be a positive number');
	}

	if (typeof config.cacheTtl !== 'number' || config.cacheTtl < 0) {
		throw new ConfigurationError('cacheTtl must be a non-negative number');
	}

	if (typeof config.enableCache !== 'boolean') {
		throw new ConfigurationError('enableCache must be a boolean');
	}
}

/**
 * Loads configuration from environment variables with fallback to defaults
 * Reads from process.env and validates the resulting configuration
 *
 * Environment variables:
 * - POLYMARKET_API_URL: Base URL for the Gamma API
 * - POLYMARKET_DATA_API_URL: Base URL for the Data API
 * - POLYMARKET_BRIDGE_API_URL: Base URL for the Bridge API
 * - POLYMARKET_CLOB_API_URL: Base URL for the CLOB API
 * - POLYMARKET_API_TIMEOUT: Request timeout in milliseconds
 * - POLYMARKET_CACHE_TTL: Cache TTL in seconds
 * - POLYMARKET_CACHE_ENABLED: Enable/disable caching ("true" or "false")
 *
 * @returns Validated API configuration
 * @throws {ConfigurationError} When environment variables contain invalid values
 *
 * @example
 * ```typescript
 * const config = loadConfig();
 * console.log(config.baseUrl); // https://gamma-api.polymarket.com
 * console.log(config.dataApiUrl); // https://data-api.polymarket.com
 * console.log(config.bridgeApiUrl); // https://bridge.polymarket.com
 * console.log(config.clobApiUrl); // https://clob.polymarket.com
 * ```
 */
export function loadConfig(): ApiConfig {
	const config: ApiConfig = {
		baseUrl: process.env.POLYMARKET_API_URL || DEFAULT_CONFIG.baseUrl,
		dataApiUrl: process.env.POLYMARKET_DATA_API_URL || DEFAULT_CONFIG.dataApiUrl,
		bridgeApiUrl: process.env.POLYMARKET_BRIDGE_API_URL || DEFAULT_CONFIG.bridgeApiUrl,
		clobApiUrl: process.env.POLYMARKET_CLOB_API_URL || DEFAULT_CONFIG.clobApiUrl,
		timeout: process.env.POLYMARKET_API_TIMEOUT
			? parseInt(process.env.POLYMARKET_API_TIMEOUT, 10)
			: DEFAULT_CONFIG.timeout,
		cacheTtl: process.env.POLYMARKET_CACHE_TTL
			? parseInt(process.env.POLYMARKET_CACHE_TTL, 10)
			: DEFAULT_CONFIG.cacheTtl,
		enableCache:
			process.env.POLYMARKET_CACHE_ENABLED !== undefined
				? process.env.POLYMARKET_CACHE_ENABLED === 'true'
				: DEFAULT_CONFIG.enableCache
	};

	validateConfig(config);
	return config;
}

/**
 * Returns a copy of the default configuration
 * Useful for testing or when you need to know the default values
 *
 * @returns A copy of the default API configuration
 *
 * @example
 * ```typescript
 * const defaults = getDefaultConfig();
 * console.log(defaults.timeout); // 10000
 * ```
 */
export function getDefaultConfig(): ApiConfig {
	return { ...DEFAULT_CONFIG };
}
