/**
 * Polymarket API Client
 * Handles HTTP communication with the Polymarket Gamma API
 */

import type { ApiConfig } from '../config/api-config.js';
import {
	ApiError,
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
	validateMarketSlug,
	validateEventQueryParams,
	validateEventId,
	validateEventSlug,
	validateTagId,
	validateTagSlug,
	validateUserPositionsParams,
	validateTradesParams,
	validateUserActivityParams,
	validateTopHoldersParams,
	validatePortfolioValueParams,
	validateClosedPositionsParams,
	validateSeriesQueryParams,
	validateSeriesId,
	validateSeriesSlug,
	validateCommentId,
	validateCommentsQueryParams,
	validateUserCommentsQueryParams,
	validateProxyWallet,
	validateBoolean,
	validateSearchQueryParams
} from '../validation/input-validator.js';
import {
	validateMarket,
	validateMarkets,
	validateEvent,
	validateEvents,
	validateTag,
	validateTags,
	validatePositions,
	validateTrades,
	validateActivities,
	validateMarketHoldersList,
	validatePortfolioValues,
	validateClosedPositions,
	validateSeries,
	validateSeriesList,
	validateComments,
	validateSearchResults
} from '../validation/response-validator.js';

/**
 * Represents a prediction market from Polymarket
 */
export interface Market {
	id: string;
	question: string | null;
	conditionId: string;
	slug: string | null;
	endDate: string | null;
	category: string | null;
	liquidity: string;
	image: string;
	icon: string;
	description: string;
	outcomes: string[] | null;
	outcomePrices: string[] | null;
	volume: string;
	active: boolean | null;
	marketType: 'normal' | 'scalar' | null;
	closed: boolean | null;
	volumeNum: number | null;
	liquidityNum: number | null;
	volume24hr: number | null;
	volume1wk: number | null;
	volume1mo: number | null;
	lastTradePrice: number | null;
	bestBid: number | null;
	bestAsk: number | null;
}

/**
 * Represents a category for events and markets
 */
export interface Category {
	id: string;
	name: string;
}

/**
 * Represents a tag for events
 */
export interface Tag {
	id: string;
	label: string | null;
	slug: string | null;
	forceShow?: boolean | null;
	forceHide?: boolean | null;
	publishedAt?: string | null;
	isCarousel?: boolean | null;
	createdBy?: number | null;
	updatedBy?: number | null;
	createdAt?: string | null;
	updatedAt?: string | null;
}

/**
 * Represents an event - a collection of related prediction markets
 */
export interface Event {
	id: string;
	ticker: string;
	slug: string | null;
	title: string | null;
	subtitle?: string | null;
	description: string | null;
	resolutionSource?: string | null;
	startDate: string | null;
	creationDate: string | null;
	endDate?: string | null;
	image: string | null;
	icon: string | null;
	active: boolean | null;
	closed: boolean | null;
	archived: boolean;
	new: boolean;
	featured: boolean | null;
	restricted: boolean;
	liquidity?: number | null;
	volume?: number | null;
	openInterest: number;
	category?: string;
	subcategory?: string | null;
	volume24hr?: number | null;
	volume1wk: number;
	volume1mo: number;
	volume1yr: number;
	commentCount: number;
	markets: Market[];
	categories?: Category[] | null;
	tags: Tag[];
}

/**
 * Represents a user's current position in a market
 */
export interface Position {
	proxyWallet: string;
	asset: string;
	conditionId: string;
	size: number;
	avgPrice: number;
	initialValue: number;
	currentValue: number;
	cashPnl: number;
	percentPnl: number;
	totalBought: number;
	realizedPnl: number;
	percentRealizedPnl: number;
	curPrice: number;
	redeemable: boolean;
	mergeable: boolean;
	title: string;
	slug: string;
	icon: string;
	eventSlug: string;
	outcome: string;
	outcomeIndex: number;
	oppositeOutcome: string;
	oppositeAsset: string;
	endDate: string;
	negativeRisk: boolean;
}

/**
 * Represents a trade transaction
 */
export interface Trade {
	proxyWallet: string;
	side: 'BUY' | 'SELL';
	asset: string | null;
	conditionId: string;
	size: number;
	price: number;
	timestamp: number;
	title: string | null;
	slug: string | null;
	icon: string | null;
	eventSlug: string | null;
	outcome: string | null;
	outcomeIndex: number | null;
	name: string | null;
	pseudonym: string | null;
	bio: string | null;
	profileImage: string | null;
	profileImageOptimized: string | null;
	transactionHash: string | null;
}

/**
 * Represents a user activity record
 */
export interface Activity {
	proxyWallet: string;
	timestamp: number;
	conditionId: string;
	type: 'TRADE' | 'SPLIT' | 'MERGE' | 'REDEEM' | 'REWARD' | 'CONVERSION';
	size: number;
	usdcSize: number;
	transactionHash: string;
	// Trade-specific fields (when type === 'TRADE')
	price?: number | null;
	asset?: string | null;
	side?: ('BUY' | 'SELL') | null;
	outcomeIndex?: number | null;
	// Market metadata
	title: string | null;
	slug: string | null;
	icon: string | null;
	eventSlug: string | null;
	outcome: string | null;
	// User metadata
	name: string | null;
	pseudonym: string | null;
	bio: string | null;
	profileImage: string | null;
	profileImageOptimized: string | null;
}

/**
 * Represents information about a top holder
 */
export interface HolderInfo {
	proxyWallet: string;
	bio: string | null;
	asset: string;
	pseudonym: string | null;
	amount: number;
	displayUsernamePublic: boolean | null;
	outcomeIndex: number;
	name: string | null;
	profileImage: string | null;
	profileImageOptimized: string | null;
}

/**
 * Represents top holders for a specific market
 */
export interface MarketHolders {
	token: string;
	holders: HolderInfo[];
}

/**
 * Represents a user's total portfolio value
 */
export interface PortfolioValue {
	user: string;
	value: number;
}

/**
 * Represents a closed position
 */
export interface ClosedPosition {
	proxyWallet: string;
	asset: string;
	conditionId: string;
	avgPrice: number;
	totalBought: number;
	realizedPnl: number;
	curPrice: number;
	timestamp: number;
	title: string;
	slug: string;
	icon: string;
	eventSlug: string;
	outcome: string;
	outcomeIndex: number;
	oppositeOutcome: string;
	oppositeAsset: string;
	endDate: string;
}

/**
 * Represents optimized image metadata
 */
export interface ImageOptimized {
	id: string;
	imageUrlSource: string;
	imageUrlOptimized: string;
	imageSizeKbSource: number;
	imageSizeKbOptimized: number;
	imageOptimizedComplete: boolean;
	imageOptimizedLastUpdated: string;
	relID: number;
	field: string;
	relname: string;
}

/**
 * Represents a collection of events
 */
export interface Collection {
	id: string;
	ticker: string;
	slug: string;
	title: string;
	subtitle: string | null;
	collectionType: string;
	description: string;
	tags: string;
	image: string | null;
	icon: string | null;
	headerImage: string | null;
	layout: string;
	active: boolean;
	closed: boolean;
	archived: boolean;
	new: boolean;
	featured: boolean;
	restricted: boolean;
	isTemplate: boolean;
	templateVariables: string;
	publishedAt: string;
	createdBy: string;
	updatedBy: string;
	createdAt: string;
	updatedAt: string;
	commentsEnabled: boolean;
	imageOptimized: ImageOptimized | null;
	iconOptimized: ImageOptimized | null;
	headerImageOptimized: ImageOptimized | null;
}

/**
 * Represents a chat channel associated with a series
 */
export interface Chat {
	id: string;
	channelId: string;
	channelName: string;
	channelImage: string | null;
	live: boolean;
	startTime: string;
	endTime: string;
}

/**
 * Represents a series - a collection of related events that follow a pattern or recurrence
 */
export interface Series {
	id: string;
	ticker: string | null;
	slug: string | null;
	title: string | null;
	subtitle: string | null;
	seriesType: string | null;
	recurrence: string | null;
	description: string | null;
	image: string | null;
	icon: string | null;
	layout: string | null;
	active: boolean | null;
	closed: boolean | null;
	archived: boolean | null;
	new: boolean | null;
	featured: boolean | null;
	restricted: boolean | null;
	isTemplate: boolean | null;
	templateVariables: boolean | null;
	publishedAt: string | null;
	createdBy: string | null;
	updatedBy: string | null;
	createdAt: string | null;
	updatedAt: string | null;
	commentsEnabled: boolean | null;
	competitive: string | null;
	volume24hr: number | null;
	volume: number | null;
	liquidity: number | null;
	startDate: string | null;
	pythTokenID: string | null;
	cgAssetName: string | null;
	score: number | null;
	commentCount: number | null;
	events: Event[];
	collections: Collection[];
	categories: Category[];
	tags: Tag[];
	chats: Chat[];
}

/**
 * Represents optimized image URLs at different sizes for comments
 */
export interface CommentImageOptimized {
	original: string | null;
	small: string | null;
	medium: string | null;
	large: string | null;
}

/**
 * Represents a user's position in a market (for comment context)
 */
export interface UserPosition {
	tokenId: string | null;
	positionSize: number | null;
}

/**
 * Represents a user profile associated with a comment
 */
export interface CommentProfile {
	name: string | null;
	pseudonym: string | null;
	bio: string | null;
	isMod: boolean | null;
	isCreator: boolean | null;
	walletAddress: string | null;
	proxyWalletAddress: string | null;
	profileImage: string | null;
	profileImageOptimized: CommentImageOptimized | null;
	positions: UserPosition[] | null;
	displayUsernamePublic?: boolean | null;
}

/**
 * Represents a reaction to a comment
 */
export interface Reaction {
	id: number;
	commentID: number | null;
	reactionType: string | null;
	icon: string | null;
	userAddress: string | null;
	createdAt: string | null;
	profile: CommentProfile | null;
}

/**
 * Represents a comment on a market, event, or series
 */
export interface Comment {
	id: number;
	body: string | null;
	parentEntityType: ('Event' | 'Series' | 'market') | null;
	parentEntityID: number | null;
	parentCommentID: number | null;
	userAddress: string | null;
	replyAddress: string | null;
	createdAt: string | null;
	updatedAt: string | null;
	profile: CommentProfile | null;
	reactions: Reaction[] | null;
	reportCount: number | null;
	reactionCount: number | null;
}

/**
 * Represents a search tag result with event count
 */
export interface SearchTag {
	id: string;
	label: string | null;
	slug: string | null;
	eventCount?: number | null;
}

/**
 * Represents a user profile in search results
 */
export interface Profile {
	id?: string;
	name: string | null;
	pseudonym: string | null;
	bio: string | null;
	profileImage: string | null;
	profileImageOptimized: string | null;
	displayUsernamePublic: boolean | null;
}

/**
 * Pagination metadata for search results
 */
export interface SearchPagination {
	hasMore: boolean;
	totalResults: number;
}

/**
 * Complete search results response containing events, tags, profiles, and pagination
 */
export interface SearchResults {
	events: Event[];
	tags: SearchTag[];
	profiles: Profile[];
	pagination: SearchPagination;
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
	private dataApiBaseUrl: string;
	private timeout: number;
	private logger: Logger;

	/**
	 * Creates a new PolymarketClient instance
	 * @param config - API configuration including base URL and timeout
	 */
	constructor(config: ApiConfig) {
		this.baseUrl = config.baseUrl;
		this.dataApiBaseUrl = config.dataApiUrl;
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

	private buildDataApiUrl(endpoint: string, params?: Record<string, string | string[]>): string {
		const url = new URL(endpoint, this.dataApiBaseUrl);

		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (Array.isArray(value)) {
					value.forEach((v) => url.searchParams.append(key, v));
				} else {
					url.searchParams.append(key, value);
				}
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

			if (
				error instanceof TimeoutError ||
				error instanceof NetworkError ||
				error instanceof ApiResponseError ||
				error instanceof ParsingError
			) {
				throw error;
			}

			if (isAbortError(error)) {
				const errorMessage = 'Request timeout';
				this.logger.error(errorMessage, error, { url, timeout: this.timeout, duration });
				throw new TimeoutError(errorMessage, { url, timeout: this.timeout });
			}

			if (isNetworkError(error)) {
				const errorMessage = error instanceof Error ? error.message : 'Network connection failed';
				this.logger.error('Network error', error, { url, duration });
				throw new ConnectionError(errorMessage, { url, originalError: error });
			}

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

	/**
	 * Fetches a list of events from the Gamma API
	 * Validates query parameters and response structure
	 *
	 * @param options - Optional fetch options including query parameters
	 * @returns Promise resolving to an array of events
	 * @throws {ValidationError} When query parameters are invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error response
	 *
	 * @example
	 * ```typescript
	 * const events = await client.fetchEvents({
	 *   params: { limit: 50, category: 'crypto', active: true }
	 * });
	 * ```
	 */
	async fetchEvents(options?: FetchOptions): Promise<Event[]> {
		const validatedParams = options?.params ? validateEventQueryParams(options.params) : undefined;
		const url = this.buildUrl('/events', validatedParams);
		const data = await this.request<unknown>(url, { ...options, params: validatedParams });
		return validateEvents(data);
	}

	/**
	 * Fetches a specific event by its unique identifier
	 * Validates the ID and response structure
	 *
	 * @param id - The unique event ID
	 * @returns Promise resolving to the event
	 * @throws {ValidationError} When the ID is invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error (including 404 for not found)
	 *
	 * @example
	 * ```typescript
	 * const event = await client.fetchEventById('event-123');
	 * console.log(event.title);
	 * ```
	 */
	async fetchEventById(id: string): Promise<Event> {
		const validatedId = validateEventId(id);
		const url = this.buildUrl(`/events/${validatedId}`);
		const data = await this.request<unknown>(url);
		return validateEvent(data);
	}

	/**
	 * Fetches a specific event by its URL-friendly slug
	 * Validates the slug and response structure
	 *
	 * @param slug - The URL-friendly event identifier
	 * @returns Promise resolving to the event
	 * @throws {ValidationError} When the slug is invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error (including 404 for not found)
	 *
	 * @example
	 * ```typescript
	 * const event = await client.fetchEventBySlug('bitcoin-predictions-2024');
	 * console.log(event.title);
	 * ```
	 */
	async fetchEventBySlug(slug: string): Promise<Event> {
		const validatedSlug = validateEventSlug(slug);
		const url = this.buildUrl(`/events/slug/${validatedSlug}`);
		const data = await this.request<unknown>(url);
		return validateEvent(data);
	}

	/**
	 * Fetches a list of tags from the Gamma API
	 * Validates response structure
	 *
	 * @returns Promise resolving to an array of tags
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error response
	 *
	 * @example
	 * ```typescript
	 * const tags = await client.fetchTags();
	 * console.log(tags);
	 * ```
	 */
	async fetchTags(): Promise<Tag[]> {
		const url = this.buildUrl('/tags');
		const data = await this.request<unknown>(url);
		return validateTags(data);
	}

	/**
	 * Fetches a specific tag by its unique identifier
	 * Validates the ID and response structure
	 *
	 * @param id - The unique tag ID
	 * @returns Promise resolving to the tag
	 * @throws {ValidationError} When the ID is invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error (including 404 for not found)
	 *
	 * @example
	 * ```typescript
	 * const tag = await client.fetchTagById('tag-123');
	 * console.log(tag.label);
	 * ```
	 */
	async fetchTagById(id: string): Promise<Tag> {
		const validatedId = validateTagId(id);
		const url = this.buildUrl(`/tags/${validatedId}`);
		const data = await this.request<unknown>(url);
		return validateTag(data);
	}

	/**
	 * Fetches a specific tag by its URL-friendly slug
	 * Validates the slug and response structure
	 *
	 * @param slug - The URL-friendly tag identifier
	 * @returns Promise resolving to the tag
	 * @throws {ValidationError} When the slug is invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error (including 404 for not found)
	 *
	 * @example
	 * ```typescript
	 * const tag = await client.fetchTagBySlug('crypto');
	 * console.log(tag.label);
	 * ```
	 */
	async fetchTagBySlug(slug: string): Promise<Tag> {
		const validatedSlug = validateTagSlug(slug);
		const url = this.buildUrl(`/tags/slug/${validatedSlug}`);
		const data = await this.request<unknown>(url);
		return validateTag(data);
	}

	/**
	 * Fetches current positions for a user from the Data API
	 * Validates input parameters and response structure
	 *
	 * @param user - The user's proxy wallet address
	 * @param markets - Optional array of market token identifiers to filter by
	 * @returns Promise resolving to an array of positions
	 * @throws {ValidationError} When parameters are invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error response
	 *
	 * @example
	 * ```typescript
	 * const positions = await client.fetchCurrentPositions('0x123...', ['market1', 'market2']);
	 * ```
	 */
	async fetchCurrentPositions(user: string, markets?: string[]): Promise<Position[]> {
		const validatedParams = validateUserPositionsParams({ user, market: markets });
		const params: Record<string, string | string[]> = { user: validatedParams.user };
		if (validatedParams.market) {
			params.market = validatedParams.market;
		}
		const url = this.buildDataApiUrl('/positions', params);
		const data = await this.request<unknown>(url);
		return validatePositions(data);
	}

	/**
	 * Fetches trades from the Data API
	 * Requires at least one of user or markets parameter
	 * Validates input parameters and response structure
	 *
	 * @param user - Optional user's proxy wallet address
	 * @param markets - Optional array of market token identifiers
	 * @returns Promise resolving to an array of trades
	 * @throws {ValidationError} When parameters are invalid or both are missing
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error response
	 *
	 * @example
	 * ```typescript
	 * const trades = await client.fetchTrades('0x123...', ['market1']);
	 * ```
	 */
	async fetchTrades(user?: string, markets?: string[]): Promise<Trade[]> {
		const validatedParams = validateTradesParams({ user, market: markets });
		const params: Record<string, string | string[]> = {};
		if (validatedParams.user) {
			params.user = validatedParams.user;
		}
		if (validatedParams.market) {
			params.market = validatedParams.market;
		}
		const url = this.buildDataApiUrl('/trades', params);
		const data = await this.request<unknown>(url);
		return validateTrades(data);
	}

	/**
	 * Fetches activity history for a user from the Data API
	 * Validates input parameters and response structure
	 *
	 * @param user - The user's proxy wallet address
	 * @returns Promise resolving to an array of activity records
	 * @throws {ValidationError} When the user parameter is invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error response
	 *
	 * @example
	 * ```typescript
	 * const activity = await client.fetchUserActivity('0x123...');
	 * ```
	 */
	async fetchUserActivity(user: string): Promise<Activity[]> {
		const validatedParams = validateUserActivityParams({ user });
		const url = this.buildDataApiUrl('/activity', { user: validatedParams.user });
		const data = await this.request<unknown>(url);
		return validateActivities(data);
	}

	/**
	 * Fetches top holders for specific markets from the Data API
	 * Validates input parameters and response structure
	 *
	 * @param markets - Array of market token identifiers
	 * @returns Promise resolving to an array of market holders
	 * @throws {ValidationError} When the markets parameter is invalid or empty
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error response
	 *
	 * @example
	 * ```typescript
	 * const holders = await client.fetchTopHolders(['market1', 'market2']);
	 * ```
	 */
	async fetchTopHolders(markets: string[]): Promise<MarketHolders[]> {
		const validatedParams = validateTopHoldersParams({ market: markets });
		const url = this.buildDataApiUrl('/holders', { market: validatedParams.market });
		const data = await this.request<unknown>(url);
		return validateMarketHoldersList(data);
	}

	/**
	 * Fetches portfolio value for a user from the Data API
	 * Validates input parameters and response structure
	 *
	 * @param user - The user's proxy wallet address
	 * @param markets - Optional array of market token identifiers to filter by
	 * @returns Promise resolving to an array of portfolio values
	 * @throws {ValidationError} When parameters are invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error response
	 *
	 * @example
	 * ```typescript
	 * const value = await client.fetchPortfolioValue('0x123...', ['market1']);
	 * ```
	 */
	async fetchPortfolioValue(user: string, markets?: string[]): Promise<PortfolioValue[]> {
		const validatedParams = validatePortfolioValueParams({ user, market: markets });
		const params: Record<string, string | string[]> = { user: validatedParams.user };
		if (validatedParams.market) {
			params.market = validatedParams.market;
		}
		const url = this.buildDataApiUrl('/value', params);
		const data = await this.request<unknown>(url);
		return validatePortfolioValues(data);
	}

	/**
	 * Fetches closed positions for a user from the Data API
	 * Validates input parameters and response structure
	 *
	 * @param user - The user's proxy wallet address
	 * @returns Promise resolving to an array of closed positions
	 * @throws {ValidationError} When the user parameter is invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error response
	 *
	 * @example
	 * ```typescript
	 * const closedPositions = await client.fetchClosedPositions('0x123...');
	 * ```
	 */
	async fetchClosedPositions(user: string): Promise<ClosedPosition[]> {
		const validatedParams = validateClosedPositionsParams({ user });
		const url = this.buildDataApiUrl('/closed-positions', { user: validatedParams.user });
		const data = await this.request<unknown>(url);
		return validateClosedPositions(data);
	}

	/**
	 * Fetches a list of series from the Gamma API
	 * Validates query parameters and response structure
	 *
	 * @param options - Optional fetch options including query parameters
	 * @returns Promise resolving to an array of series
	 * @throws {ValidationError} When query parameters are invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error response
	 *
	 * @example
	 * ```typescript
	 * const series = await client.fetchSeries({
	 *   params: { limit: 50, category: 'crypto', active: true }
	 * });
	 * ```
	 */
	async fetchSeries(options?: FetchOptions): Promise<Series[]> {
		const validatedParams = options?.params ? validateSeriesQueryParams(options.params) : undefined;
		const url = this.buildUrl('/series', validatedParams);
		const data = await this.request<unknown>(url, { ...options, params: validatedParams });
		return validateSeriesList(data);
	}

	/**
	 * Fetches a specific series by its unique identifier
	 * Validates the ID and response structure
	 *
	 * @param id - The unique series ID
	 * @returns Promise resolving to the series
	 * @throws {ValidationError} When the ID is invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error (including 404 for not found)
	 *
	 * @example
	 * ```typescript
	 * const series = await client.fetchSeriesById('series-123');
	 * console.log(series.title);
	 * ```
	 */
	async fetchSeriesById(id: string): Promise<Series> {
		const validatedId = validateSeriesId(id);
		const url = this.buildUrl(`/series/${validatedId}`);
		const data = await this.request<unknown>(url);
		return validateSeries(data);
	}

	/**
	 * Fetches a specific series by its URL-friendly slug
	 * Validates the slug and response structure
	 *
	 * @param slug - The URL-friendly series identifier
	 * @returns Promise resolving to the series
	 * @throws {ValidationError} When the slug is invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error (including 404 for not found)
	 *
	 * @example
	 * ```typescript
	 * const series = await client.fetchSeriesBySlug('weekly-sports-predictions');
	 * console.log(series.title);
	 * ```
	 */
	async fetchSeriesBySlug(slug: string): Promise<Series> {
		const validatedSlug = validateSeriesSlug(slug);
		const url = this.buildUrl(`/series/slug/${validatedSlug}`);
		const data = await this.request<unknown>(url);
		return validateSeries(data);
	}

	/**
	 * Fetches a list of comments with optional filters
	 * Validates parameters and response structure
	 *
	 * @param options - Fetch options including query parameters
	 * @returns Promise resolving to an array of comments
	 * @throws {ValidationError} When parameters are invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error
	 *
	 * @example
	 * ```typescript
	 * const comments = await client.fetchComments({
	 *   params: { parent_entity_type: 'Event', parent_entity_id: 123, limit: 10 }
	 * });
	 * ```
	 */
	async fetchComments(options: FetchOptions = {}): Promise<Comment[]> {
		const { params = {} } = options;

		// Validate input parameters
		const validatedParams = validateCommentsQueryParams(params);

		const url = this.buildUrl('/comments', validatedParams);
		this.logger.info('Fetching comments', { url });

		const data = await this.request<unknown>(url);

		// Validate response
		const validated = validateComments(data);
		this.logger.info('Comments fetched successfully', { count: validated.length });

		return validated;
	}

	/**
	 * Fetches a specific comment by ID
	 * Validates the ID and response structure
	 *
	 * @param id - The unique comment ID
	 * @param options - Fetch options including query parameters
	 * @returns Promise resolving to the comment
	 * @throws {ValidationError} When the ID is invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error (including 404 for not found)
	 *
	 * @example
	 * ```typescript
	 * const comment = await client.fetchCommentById(123, { params: { get_positions: true } });
	 * console.log(comment.body);
	 * ```
	 */
	async fetchCommentById(id: number, options: FetchOptions = {}): Promise<Comment> {
		const { params = {} } = options;

		// Validate ID
		const validatedId = validateCommentId(id);

		// Build query params
		const queryParams: Record<string, string | number | boolean> = {};
		if (params.get_positions !== undefined) {
			queryParams.get_positions = validateBoolean(params.get_positions, 'get_positions');
		}

		const url = this.buildUrl(`/comments/${validatedId}`, queryParams);
		this.logger.info('Fetching comment by ID', { id: validatedId, url });

		const data = await this.request<unknown>(url);

		// API returns an array with a single comment
		const comments = validateComments(data);
		if (comments.length === 0) {
			throw new ApiError(`Comment not found: ${validatedId}`, 404, 'NOT_FOUND');
		}
		this.logger.info('Comment fetched successfully', { id: validatedId });

		return comments[0];
	}

	/**
	 * Fetches comments by user address
	 * Validates the address and response structure
	 *
	 * @param userAddress - The blockchain address of the user
	 * @param options - Fetch options including query parameters
	 * @returns Promise resolving to an array of comments
	 * @throws {ValidationError} When the address is invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error
	 *
	 * @example
	 * ```typescript
	 * const comments = await client.fetchCommentsByUser('0x1234...', {
	 *   params: { limit: 20, ascending: false }
	 * });
	 * console.log(`User has ${comments.length} comments`);
	 * ```
	 */
	async fetchCommentsByUser(userAddress: string, options: FetchOptions = {}): Promise<Comment[]> {
		const { params = {} } = options;

		// Validate user address
		const validatedAddress = validateProxyWallet(userAddress);

		// Validate query parameters
		const validatedParams = validateUserCommentsQueryParams(params);

		const url = this.buildUrl(`/comments/user_address/${validatedAddress}`, validatedParams);
		this.logger.info('Fetching comments by user', { userAddress: validatedAddress, url });

		const data = await this.request<unknown>(url);

		// Validate response
		const validated = validateComments(data);
		this.logger.info('User comments fetched successfully', {
			userAddress: validatedAddress,
			count: validated.length
		});

		return validated;
	}

	/**
	 * Helper to build URL with support for array parameters
	 */
	private buildSearchUrl(
		endpoint: string,
		params?: Record<string, string | number | boolean | string[] | number[]>
	): string {
		const url = new URL(endpoint, this.baseUrl);

		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (Array.isArray(value)) {
					// For arrays, append each value separately
					value.forEach((v) => url.searchParams.append(key, String(v)));
				} else {
					url.searchParams.append(key, String(value));
				}
			});
		}

		return url.toString();
	}

	/**
	 * Fetches search results for markets, events, and profiles
	 * Validates parameters and response structure
	 *
	 * @param options - Fetch options including query parameters
	 * @returns Promise resolving to search results
	 * @throws {ValidationError} When parameters are invalid
	 * @throws {TimeoutError} When the request times out
	 * @throws {NetworkError} When network connection fails
	 * @throws {ApiResponseError} When the API returns an error
	 *
	 * @example
	 * ```typescript
	 * const results = await client.fetchSearch({
	 *   params: {
	 *     q: 'bitcoin',
	 *     limit_per_type: 10,
	 *     search_tags: true,
	 *     search_profiles: true
	 *   }
	 * });
	 * console.log(`Found ${results.events.length} events`);
	 * ```
	 */
	async fetchSearch(options: {
		params: Record<string, string | number | boolean | string[] | number[]>;
		signal?: AbortSignal;
	}): Promise<SearchResults> {
		const { params = {}, signal } = options;

		// Validate query parameters
		const validatedParams = validateSearchQueryParams(params);

		const url = this.buildSearchUrl('/public-search', validatedParams);
		this.logger.info('Fetching search results', { params: validatedParams, url });

		const data = await this.request<unknown>(url, signal ? { signal } : undefined);

		// Validate response
		const validated = validateSearchResults(data);
		this.logger.info('Search results fetched successfully', {
			eventsCount: validated.events.length,
			tagsCount: validated.tags.length,
			profilesCount: validated.profiles.length,
			totalResults: validated.pagination.totalResults
		});

		return validated;
	}
}
