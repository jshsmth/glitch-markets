/**
 * Shared test utilities for consistent testing patterns across the codebase
 */

import { expect, vi } from 'vitest';
import type {
	Tag,
	Series,
	Market,
	Event,
	Team,
	SportsMetadata,
	Comment,
	BuilderLeaderboardEntry,
	BuilderVolumeEntry,
	SupportedAsset,
	BridgeToken,
	DepositAddresses,
	DepositAddressMap
} from '$lib/server/api/polymarket-client';

/**
 * Standard error type constants for consistent error validation
 */
export const ERROR_TYPES = {
	VALIDATION_ERROR: 'VALIDATION_ERROR',
	NETWORK_ERROR: 'NETWORK_ERROR',
	TIMEOUT_ERROR: 'TIMEOUT_ERROR',
	CONNECTION_ERROR: 'CONNECTION_ERROR',
	API_RESPONSE_ERROR: 'API_RESPONSE_ERROR',
	PARSING_ERROR: 'PARSING_ERROR',
	INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

/**
 * Parse JSON response from a Response object
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
	const text = await response.text();
	return JSON.parse(text) as T;
}

/**
 * Expect an error response with specific status code and error type
 */
export async function expectErrorResponse(
	response: Response,
	statusCode: number,
	errorType?: string
): Promise<void> {
	expect(response.status).toBe(statusCode);

	const body = await parseJsonResponse<{
		error: string;
		message: string;
		statusCode: number;
		timestamp: string;
	}>(response);

	// Verify required fields exist
	expect(body).toHaveProperty('error');
	expect(body).toHaveProperty('message');
	expect(body).toHaveProperty('statusCode');
	expect(body).toHaveProperty('timestamp');

	// Verify field types
	expect(typeof body.error).toBe('string');
	expect(typeof body.message).toBe('string');
	expect(typeof body.statusCode).toBe('number');
	expect(typeof body.timestamp).toBe('string');

	// Verify status code matches
	expect(body.statusCode).toBe(statusCode);

	// Verify error type if provided
	if (errorType) {
		expect(body.error).toBe(errorType);
	}

	// Verify timestamp is valid ISO string
	expect(() => new Date(body.timestamp)).not.toThrow();
	expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
}

/**
 * Mock a service method response
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function mockServiceResponse<T>(
	service: any,
	method: string,
	value: T
): ReturnType<typeof vi.fn> {
	const mock = vi.fn().mockResolvedValue(value);
	service[method] = mock;
	return mock;
}

/**
 * Create a mock Tag for testing
 */
export function createMockTag(overrides: Partial<Tag> = {}): Tag {
	return {
		id: '1',
		label: 'Test Tag',
		slug: 'test-tag',
		...overrides
	};
}

/**
 * Create a mock Series for testing
 */
export function createMockSeries(overrides: Partial<Series> = {}): Series {
	return {
		id: 'series-1',
		ticker: null,
		slug: 'test-series',
		title: 'Test Series',
		subtitle: null,
		seriesType: null,
		recurrence: null,
		description: null,
		image: 'https://example.com/series.jpg',
		icon: null,
		layout: null,
		active: true,
		closed: false,
		archived: false,
		new: false,
		featured: false,
		restricted: false,
		isTemplate: false,
		templateVariables: false,
		publishedAt: null,
		createdBy: null,
		updatedBy: null,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: null,
		commentsEnabled: true,
		competitive: null,
		volume24hr: null,
		volume: null,
		liquidity: null,
		startDate: null,
		pythTokenID: null,
		cgAssetName: null,
		score: null,
		commentCount: null,
		events: [],
		collections: [],
		categories: [],
		tags: [createMockTag({ id: '1', label: 'tag1', slug: 'tag1' })],
		chats: [],
		...overrides
	};
}

/**
 * Create a mock Market for testing
 */
export function createMockMarket(overrides: Partial<Market> = {}): Market {
	return {
		id: 'market-1',
		question: 'Will Bitcoin reach $100k by end of 2024?',
		conditionId: 'condition-1',
		slug: 'bitcoin-100k-2024',
		endDate: '2024-12-31T23:59:59Z',
		category: 'crypto',
		liquidity: '50000',
		image: 'https://example.com/bitcoin.jpg',
		icon: 'https://example.com/bitcoin-icon.jpg',
		description: 'A market about Bitcoin price prediction',
		outcomes: ['Yes', 'No'],
		outcomePrices: ['0.45', '0.55'],
		volume: '100000',
		active: true,
		marketType: 'normal',
		closed: false,
		volumeNum: 100000,
		liquidityNum: 50000,
		volume24hr: 5000,
		volume1wk: 25000,
		volume1mo: 80000,
		lastTradePrice: 0.45,
		bestBid: 0.44,
		bestAsk: 0.46,
		...overrides
	};
}

/**
 * Create a mock Event for testing
 */
export function createMockEvent(overrides: Partial<Event> = {}): Event {
	return {
		id: 'event-1',
		ticker: 'TEST',
		slug: 'test-event',
		title: 'Test Event',
		subtitle: null,
		description: 'Test event description',
		resolutionSource: null,
		startDate: '2024-01-01T00:00:00Z',
		creationDate: '2024-01-01T00:00:00Z',
		endDate: '2024-12-31T23:59:59Z',
		image: 'https://example.com/event.jpg',
		icon: 'https://example.com/event-icon.jpg',
		active: true,
		closed: false,
		archived: false,
		new: false,
		featured: false,
		restricted: false,
		liquidity: 100000,
		volume: 500000,
		openInterest: 0,
		category: 'test',
		subcategory: null,
		volume24hr: 10000,
		volume1wk: 50000,
		volume1mo: 200000,
		volume1yr: 800000,
		commentCount: 0,
		markets: [],
		categories: null,
		tags: [createMockTag({ id: '1', label: 'tag1', slug: 'tag1' })],
		...overrides
	};
}

/**
 * Create a mock Team for testing
 */
export function createMockTeam(overrides: Partial<Team> = {}): Team {
	return {
		id: 1,
		name: 'Test Team',
		league: 'NBA',
		logo: 'https://example.com/team.png',
		abbreviation: 'TST',
		alias: 'Test',
		record: null,
		createdAt: null,
		updatedAt: null,
		...overrides
	};
}

/**
 * Create mock SportsMetadata for testing
 */
export function createMockSportsMetadata(overrides: Partial<SportsMetadata> = {}): SportsMetadata {
	return {
		sport: 'NBA',
		image: 'https://example.com/nba.png',
		resolution: '',
		ordering: '',
		tags: '',
		series: '',
		...overrides
	};
}

/**
 * Create a mock Comment for testing
 */
export function createMockComment(overrides: Partial<Comment> = {}): Comment {
	return {
		id: 1,
		body: 'Test comment',
		userAddress: '0x1234567890123456789012345678901234567890',
		createdAt: '2024-01-01T00:00:00Z',
		parentEntityType: 'Event',
		parentEntityID: 1,
		parentCommentID: null,
		replyAddress: null,
		updatedAt: null,
		profile: null,
		reactions: null,
		reportCount: null,
		reactionCount: null,
		...overrides
	};
}

/**
 * Create a mock BuilderLeaderboardEntry for testing
 */
export function createMockBuilderLeaderboardEntry(
	overrides: Partial<BuilderLeaderboardEntry> = {}
): BuilderLeaderboardEntry {
	return {
		builder: 'Test Builder',
		volume: 10000,
		rank: '1',
		activeUsers: 50,
		verified: true,
		builderLogo: 'https://example.com/builder.png',
		...overrides
	};
}

/**
 * Create a mock BuilderVolumeEntry for testing
 */
export function createMockBuilderVolumeEntry(
	overrides: Partial<BuilderVolumeEntry> = {}
): BuilderVolumeEntry {
	return {
		dt: '2024-01-01',
		builder: 'Test Builder',
		builderLogo: 'https://example.com/builder.png',
		verified: true,
		volume: 10000,
		activeUsers: 50,
		rank: '1',
		...overrides
	};
}

/**
 * Verify cache headers are set correctly on a response
 */
export function expectCacheHeaders(response: Response, maxAge: number = 60): void {
	expect(response.headers.get('Cache-Control')).toBe(
		`public, max-age=${maxAge}, s-maxage=${maxAge}`
	);
	expect(response.headers.get('CDN-Cache-Control')).toBe(`public, max-age=${maxAge}`);
	expect(response.headers.get('Vercel-CDN-Cache-Control')).toBe(`public, max-age=${maxAge}`);
}

/**
 * Create a mock SupportedAsset for bridge testing
 */
export function createMockSupportedAsset(overrides: Partial<SupportedAsset> = {}): SupportedAsset {
	return {
		chainId: '1',
		chainName: 'Ethereum',
		token: {
			name: 'USD Coin',
			symbol: 'USDC',
			address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
			decimals: 6
		},
		minCheckoutUsd: 45,
		...overrides
	};
}

/**
 * Create a mock BridgeToken for bridge testing
 */
export function createMockBridgeToken(overrides: Partial<BridgeToken> = {}): BridgeToken {
	return {
		name: 'USD Coin',
		symbol: 'USDC',
		address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
		decimals: 6,
		...overrides
	};
}

/**
 * Create a mock DepositAddresses response for bridge deposit testing
 */
export function createMockDepositAddresses(
	overrides: Partial<DepositAddresses> = {}
): DepositAddresses {
	return {
		address: {
			evm: '0x1234567890abcdef1234567890abcdef12345678',
			svm: 'SomeBase58SolanaAddress123456789012345678',
			btc: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
		},
		note: 'Send only supported assets to these addresses',
		...overrides
	};
}

/**
 * Create a mock DepositAddressMap for bridge testing
 */
export function createMockDepositAddressMap(
	overrides: Partial<DepositAddressMap> = {}
): DepositAddressMap {
	return {
		evm: '0x1234567890abcdef1234567890abcdef12345678',
		svm: 'SomeBase58SolanaAddress123456789012345678',
		btc: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
		...overrides
	};
}
