import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
	loadConfig,
	validateConfig,
	getDefaultConfig,
	ConfigurationError,
	type ApiConfig
} from './api-config';

describe('API Configuration', () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		// Save original environment
		originalEnv = { ...process.env };
	});

	afterEach(() => {
		// Restore original environment
		process.env = originalEnv;
	});

	describe('validateConfig', () => {
		it('should accept valid configuration', () => {
			const validConfig: ApiConfig = {
				baseUrl: 'https://api.example.com',
				dataApiUrl: 'https://data-api.example.com',
				timeout: 5000,
				cacheTtl: 60,
				enableCache: true
			};

			expect(() => validateConfig(validConfig)).not.toThrow();
		});

		it('should reject empty baseUrl', () => {
			const invalidConfig: ApiConfig = {
				baseUrl: '',
				dataApiUrl: 'https://data-api.example.com',
				timeout: 5000,
				cacheTtl: 60,
				enableCache: true
			};

			expect(() => validateConfig(invalidConfig)).toThrow(ConfigurationError);
			expect(() => validateConfig(invalidConfig)).toThrow('baseUrl must be a non-empty string');
		});

		it('should reject invalid URL', () => {
			const invalidConfig: ApiConfig = {
				baseUrl: 'not-a-valid-url',
				dataApiUrl: 'https://data-api.example.com',
				timeout: 5000,
				cacheTtl: 60,
				enableCache: true
			};

			expect(() => validateConfig(invalidConfig)).toThrow(ConfigurationError);
			expect(() => validateConfig(invalidConfig)).toThrow('baseUrl must be a valid URL');
		});

		it('should reject negative timeout', () => {
			const invalidConfig: ApiConfig = {
				baseUrl: 'https://api.example.com',
				dataApiUrl: 'https://data-api.example.com',
				timeout: -1,
				cacheTtl: 60,
				enableCache: true
			};

			expect(() => validateConfig(invalidConfig)).toThrow(ConfigurationError);
			expect(() => validateConfig(invalidConfig)).toThrow('timeout must be a positive number');
		});

		it('should reject zero timeout', () => {
			const invalidConfig: ApiConfig = {
				baseUrl: 'https://api.example.com',
				dataApiUrl: 'https://data-api.example.com',
				timeout: 0,
				cacheTtl: 60,
				enableCache: true
			};

			expect(() => validateConfig(invalidConfig)).toThrow(ConfigurationError);
		});

		it('should reject negative cacheTtl', () => {
			const invalidConfig: ApiConfig = {
				baseUrl: 'https://api.example.com',
				dataApiUrl: 'https://data-api.example.com',
				timeout: 5000,
				cacheTtl: -1,
				enableCache: true
			};

			expect(() => validateConfig(invalidConfig)).toThrow(ConfigurationError);
			expect(() => validateConfig(invalidConfig)).toThrow('cacheTtl must be a non-negative number');
		});
	});

	describe('loadConfig', () => {
		it('should use default values when environment variables are not set', () => {
			// Clear all Polymarket env vars
			delete process.env.POLYMARKET_API_URL;
			delete process.env.POLYMARKET_API_TIMEOUT;
			delete process.env.POLYMARKET_CACHE_TTL;
			delete process.env.POLYMARKET_CACHE_ENABLED;

			const config = loadConfig();
			const defaults = getDefaultConfig();

			expect(config).toEqual(defaults);
		});

		it('should use environment variables when set', () => {
			process.env.POLYMARKET_API_URL = 'https://custom-api.example.com';
			process.env.POLYMARKET_DATA_API_URL = 'https://custom-data-api.example.com';
			process.env.POLYMARKET_API_TIMEOUT = '15000';
			process.env.POLYMARKET_CACHE_TTL = '120';
			process.env.POLYMARKET_CACHE_ENABLED = 'false';

			const config = loadConfig();

			expect(config.baseUrl).toBe('https://custom-api.example.com');
			expect(config.dataApiUrl).toBe('https://custom-data-api.example.com');
			expect(config.timeout).toBe(15000);
			expect(config.cacheTtl).toBe(120);
			expect(config.enableCache).toBe(false);
		});

		it('should throw ConfigurationError for invalid environment variables', () => {
			process.env.POLYMARKET_API_URL = 'invalid-url';

			expect(() => loadConfig()).toThrow(ConfigurationError);
		});
	});

	/**
	 * Feature: polymarket-api-integration, Property 17: Configuration validation
	 * Validates: Requirements 9.4, 9.5
	 *
	 * For any invalid environment variable value, the server route should throw
	 * a configuration error during initialization.
	 */
	describe('Property 17: Configuration validation', () => {
		it('should throw ConfigurationError for any invalid configuration', () => {
			fc.assert(
				fc.property(
					fc.record({
						baseUrl: fc.oneof(
							fc.constant(''), // empty string
							fc.constant('not-a-url'), // invalid URL
							fc.constant('ftp://invalid-protocol.com'), // non-http protocol
							fc.string().filter((s) => s.length > 0 && !s.startsWith('http')) // random invalid URLs
						),
						timeout: fc.oneof(
							fc.constant(0), // zero
							fc.integer({ max: -1 }), // negative
							fc.constant(NaN) // NaN
						),
						cacheTtl: fc.integer({ max: -1 }), // negative
						enableCache: fc.boolean()
					}),
					(invalidConfig) => {
						// Any configuration with invalid values should throw ConfigurationError
						expect(() => validateConfig(invalidConfig as ApiConfig)).toThrow(ConfigurationError);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should accept any valid configuration', () => {
			fc.assert(
				fc.property(
					fc.record({
						baseUrl: fc.webUrl(), // valid URLs
						dataApiUrl: fc.webUrl(), // valid URLs
						timeout: fc.integer({ min: 1, max: 60000 }), // positive timeout
						cacheTtl: fc.integer({ min: 0, max: 3600 }), // non-negative TTL
						enableCache: fc.boolean()
					}),
					(validConfig) => {
						// Any configuration with valid values should not throw
						expect(() => validateConfig(validConfig)).not.toThrow();
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should throw ConfigurationError when loading invalid environment variables', () => {
			fc.assert(
				fc.property(
					fc.oneof(
						fc.constant('not-a-url'), // invalid URL
						fc.constant('ftp://invalid-protocol.com'), // non-http protocol
						fc.string().filter((s) => s.length > 0 && !s.startsWith('http')) // non-empty invalid URLs
					),
					(invalidUrl) => {
						process.env.POLYMARKET_API_URL = invalidUrl;
						delete process.env.POLYMARKET_API_TIMEOUT;
						delete process.env.POLYMARKET_CACHE_TTL;
						delete process.env.POLYMARKET_CACHE_ENABLED;

						// Loading config with invalid URL should throw
						expect(() => loadConfig()).toThrow(ConfigurationError);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should use defaults for missing environment variables', () => {
			fc.assert(
				fc.property(
					fc.record({
						setUrl: fc.boolean(),
						setDataUrl: fc.boolean(),
						setTimeout: fc.boolean(),
						setTtl: fc.boolean(),
						setCache: fc.boolean()
					}),
					(envFlags) => {
						// Clear all env vars first
						delete process.env.POLYMARKET_API_URL;
						delete process.env.POLYMARKET_DATA_API_URL;
						delete process.env.POLYMARKET_API_TIMEOUT;
						delete process.env.POLYMARKET_CACHE_TTL;
						delete process.env.POLYMARKET_CACHE_ENABLED;

						// Set only the ones indicated by flags
						if (envFlags.setUrl) {
							process.env.POLYMARKET_API_URL = 'https://test-api.example.com';
						}
						if (envFlags.setDataUrl) {
							process.env.POLYMARKET_DATA_API_URL = 'https://test-data-api.example.com';
						}
						if (envFlags.setTimeout) {
							process.env.POLYMARKET_API_TIMEOUT = '5000';
						}
						if (envFlags.setTtl) {
							process.env.POLYMARKET_CACHE_TTL = '30';
						}
						if (envFlags.setCache) {
							process.env.POLYMARKET_CACHE_ENABLED = 'false';
						}

						const config = loadConfig();
						const defaults = getDefaultConfig();

						// Check that unset values use defaults
						if (!envFlags.setUrl) {
							expect(config.baseUrl).toBe(defaults.baseUrl);
						}
						if (!envFlags.setDataUrl) {
							expect(config.dataApiUrl).toBe(defaults.dataApiUrl);
						}
						if (!envFlags.setTimeout) {
							expect(config.timeout).toBe(defaults.timeout);
						}
						if (!envFlags.setTtl) {
							expect(config.cacheTtl).toBe(defaults.cacheTtl);
						}
						if (!envFlags.setCache) {
							expect(config.enableCache).toBe(defaults.enableCache);
						}

						// Config should be valid
						expect(() => validateConfig(config)).not.toThrow();
					}
				),
				{ numRuns: 100 }
			);
		});
	});
});
