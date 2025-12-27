/**
 * Shared Mock Setup Utilities
 *
 * This file contains reusable mock setup functions to avoid
 * duplication across test files.
 */

import { vi } from 'vitest';

/**
 * Creates a mock API config object with sensible defaults
 */
export function mockApiConfig() {
	return {
		baseUrl: 'https://gamma-api.polymarket.com',
		dataApiUrl: 'https://data-api.polymarket.com',
		bridgeApiUrl: 'https://bridge.polymarket.com',
		clobApiUrl: 'https://clob.polymarket.com',
		timeout: 5000,
		cacheTtl: 60,
		enableCache: true
	};
}

/**
 * Creates a mock Logger with all required methods
 */
export function mockLogger() {
	return {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn()
	};
}

/**
 * Sets up common service test mocks (config and logger)
 * Call this in beforeEach for service tests
 */
export async function setupServiceMocks() {
	const { loadConfig } = await import('$lib/server/config/api-config');
	const { Logger } = await import('$lib/server/utils/logger');

	vi.mocked(loadConfig).mockReturnValue(mockApiConfig());
	vi.mocked(Logger).mockImplementation(function (this: unknown) {
		return mockLogger() as never;
	} as never);
}

/**
 * Helper to build test request event with URL
 */
export function createMockRequestEvent(url: URL) {
	return {
		url,
		request: new Request(url.toString()),
		params: {},
		locals: {},
		cookies: {} as never,
		fetch: globalThis.fetch,
		getClientAddress: () => '127.0.0.1',
		platform: undefined,
		setHeaders: vi.fn(),
		isDataRequest: false,
		isSubRequest: false,
		route: { id: '/test' }
	};
}

/**
 * Creates a mock Market object with sensible defaults
 */
export function createMockMarket(overrides = {}) {
	return {
		id: '123',
		question: 'Test question?',
		conditionId: 'cond123',
		slug: 'test-question',
		endDate: '2024-12-31T00:00:00Z',
		category: 'crypto',
		liquidity: '1000',
		image: 'https://example.com/image.png',
		icon: 'https://example.com/icon.png',
		description: 'Test description',
		outcomes: ['Yes', 'No'],
		outcomePrices: ['0.5', '0.5'],
		volume: '5000',
		active: true,
		marketType: 'normal' as const,
		closed: false,
		volumeNum: 5000,
		liquidityNum: 1000,
		volume24hr: 100,
		volume1wk: 500,
		volume1mo: 2000,
		lastTradePrice: 0.5,
		bestBid: 0.49,
		bestAsk: 0.51,
		...overrides
	};
}
