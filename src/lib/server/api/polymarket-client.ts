/**
 * Polymarket API Client
 * Handles HTTP communication with the Polymarket Gamma API
 */

import type { ApiConfig } from '../config/api-config.js';
import {
	NetworkError,
	TimeoutError,
	ConnectionError,
	ApiResponseError,
	ParsingError,
	isAbortError,
	isNetworkError
} from '../errors/api-errors.js';
import { Logger } from '../utils/logger.js';
import {
	validateMarketQueryParams,
	validateMarketId,
	validateMarketSlug
} from '../validation/input-validator.js';
import { validateMarket, validateMarkets } from '../validation/response-validator.js';

/**
 * Represents a prediction market from Polymarket
 */
export interface Market {
	id: string;
	question: string;
	conditionId: string;
	slug: string;
	endDate: string;
	category: string;
	liquidity: string;
	image: string;
	icon: string;
	description: string;
	outcomes: string[];
	outcomePrices: string[];
	volume: string;
	active: boolean;
	marketType: 'normal' | 'scalar';
	closed: boolean;
	volumeNum: number;
	liquidityNum: number;
	volume24hr: number;
	volume1wk: number;
	volume1mo: number;
	lastTradePrice: number;
	bestBid: number;
	bestAsk: number;
}

export interface FetchOptions {
	params?: Record<string, string | number | boolean>;
	signal?: AbortSignal;
}

/**
 * HTTP client for the Polymarket Gamma API
 * Handles request/response lifecycle, error handling, and validation
 *
 * @example
 * ```typescript
 * const config = loadConfig();
 * const client = new PolymarketClient(config);
 *
 * // Fetch markets
 * const markets = await client.fetchMarkets({ params: { limit: 10 } });
 * ```
 */
export class PolymarketClient {
	private baseUrl: string;
	private timeout: number;
	private logger: Logger;

	/**
	 * Creates a new PolymarketClient instance
	 * @param config - API configuration including base URL and timeout
	 */
	constructor(config: ApiConfig) {
		this.baseUrl = config.baseUrl;
		this.timeout = config.timeout;
		this.logger = new Logger({ component: 'PolymarketClient' });
	}

	private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
		const url = new URL(endpoint, this.baseUrl);

		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				url.searchParams.append(key, String(value));
			});
		}

		return url.toString();
	}

	private async request<T>(url: string, options?: FetchOptions): Promise<T> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);
		const startTime = Date.now();

		this.logger.info('Making API request', { url });

		try {
			const response = await fetch(url, {
				signal: options?.signal || controller.signal,
				headers: {
					'Content-Type': 'application/json'
				}
			});

			clearTimeout(timeoutId);
			const duration = Date.now() - startTime;

			// Handle non-OK responses
			if (!response.ok) {
				let responseBody: unknown;
				try {
					const text = await response.text();
					try {
						responseBody = JSON.parse(text);
					} catch {
						responseBody = text;
					}
				} catch {
					responseBody = undefined;
				}

				const errorMessage = `API request failed with status ${response.status}`;
				this.logger.error(errorMessage, undefined, {
					url,
					status: response.status,
					statusText: response.statusText,
					responseBody,
					duration
				});

				// Map status codes to appropriate error types
				if (response.status >= 500) {
					throw new ApiResponseError(
						`Upstream API error: ${response.statusText}`,
						503,
						response.status,
						responseBody
					);
				} else if (response.status >= 400) {
					throw new ApiResponseError(errorMessage, response.status, response.status, responseBody);
				}
			}

			// Parse response
			let data: T;
			try {
				data = await response.json();
			} catch (parseError) {
				const errorMessage = 'Failed to parse API response';
				this.logger.error(errorMessage, parseError, { url, duration });
				throw new ParsingError(errorMessage, { url, parseError });
			}

			this.logger.info('API request successful', { url, duration });
			return data;
		} catch (error) {
			clearTimeout(timeoutId);
			const duration = Date.now() - startTime;

			// Re-throw if already an ApiError
			if (
				error instanceof TimeoutError ||
				error instanceof NetworkError ||
				error instanceof ApiResponseError ||
				error instanceof ParsingError
			) {
				throw error;
			}

			// Handle timeout/abort errors
			if (isAbortError(error)) {
				const errorMessage = 'Request timeout';
				this.logger.error(errorMessage, error, { url, timeout: this.timeout, duration });
				throw new TimeoutError(errorMessage, { url, timeout: this.timeout });
			}

			// Handle network errors
			if (isNetworkError(error)) {
				const errorMessage = error instanceof Error ? error.message : 'Network connection failed';
				this.logger.error('Network error', error, { url, duration });
				throw new ConnectionError(errorMessage, { url, originalError: error });
			}

			// Handle unknown errors
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			this.logger.error('Unexpected error', error, { url, duration });
			throw new NetworkError(errorMessage, { url, originalError: error });
		}
	}

	/**
	 * Fetches a list of markets from the Gamma API
	 * Validates query parameters and response structure
	 *
	 * @param options - Optional fetch options including query parameters
	 * @returns Promise resolving to an array of markets
	 * @throws {ValidationError} When query parameters are invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error response
	 *
	 * @example
	 * ```typescript
	 * const markets = await client.fetchMarkets({
	 *   params: { limit: 50, category: 'crypto', active: true }
	 * });
	 * ```
	 */
	async fetchMarkets(options?: FetchOptions): Promise<Market[]> {
		const validatedParams = options?.params ? validateMarketQueryParams(options.params) : undefined;
		const url = this.buildUrl('/markets', validatedParams);
		const data = await this.request<unknown>(url, { ...options, params: validatedParams });
		return validateMarkets(data);
	}

	/**
	 * Fetches a specific market by its unique identifier
	 * Validates the ID and response structure
	 *
	 * @param id - The unique market ID
	 * @returns Promise resolving to the market
	 * @throws {ValidationError} When the ID is invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error (including 404 for not found)
	 *
	 * @example
	 * ```typescript
	 * const market = await client.fetchMarketById('0x123...');
	 * console.log(market.question);
	 * ```
	 */
	async fetchMarketById(id: string): Promise<Market> {
		const validatedId = validateMarketId(id);
		const url = this.buildUrl(`/markets/${validatedId}`);
		const data = await this.request<unknown>(url);
		return validateMarket(data);
	}

	/**
	 * Fetches a specific market by its URL-friendly slug
	 * Validates the slug and response structure
	 *
	 * @param slug - The URL-friendly market identifier
	 * @returns Promise resolving to the market
	 * @throws {ValidationError} When the slug is invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error (including 404 for not found)
	 *
	 * @example
	 * ```typescript
	 * const market = await client.fetchMarketBySlug('bitcoin-100k-2024');
	 * console.log(market.question);
	 * ```
	 */
	async fetchMarketBySlug(slug: string): Promise<Market> {
		const validatedSlug = validateMarketSlug(slug);
		const url = this.buildUrl(`/markets/slug/${validatedSlug}`);
		const data = await this.request<unknown>(url);
		return validateMarket(data);
	}
}
