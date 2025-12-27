/**
 * Tests for GET /api/bridge/supported-assets server route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { bridgeArbitraries } from '$lib/tests/arbitraries/common-arbitraries.js';
import { createMockSupportedAsset } from '$lib/tests/utils/test-helpers.js';
import { expectCacheHeaders } from '$lib/tests/utils/test-helpers.js';

// Mock the BridgeService
const mockGetSupportedAssets = vi.fn();

vi.mock('$lib/server/services/bridge-service', () => ({
	BridgeService: class {
		getSupportedAssets = mockGetSupportedAssets;
	}
}));

// Mock logger to avoid console noise
vi.mock('$lib/utils/logger', () => ({
	Logger: class {
		info = vi.fn();
		error = vi.fn();
		warn = vi.fn();
		debug = vi.fn();
	}
}));

const { GET } = await import('../../routes/api/bridge/supported-assets/+server');

describe('GET /api/bridge/supported-assets', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockGetSupportedAssets.mockReset();
	});

	/**
	 * Feature: bridge-supported-assets
	 * Property: Successful response with supported assets
	 */
	describe('Property: Successful asset retrieval', () => {
		it('should return supported assets with proper structure', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.array(
						fc.record({
							chainId: bridgeArbitraries.chainId(),
							chainName: bridgeArbitraries.chainName(),
							token: fc.record({
								name: fc.constantFrom('USD Coin', 'Tether USD', 'Dai Stablecoin'),
								symbol: bridgeArbitraries.tokenSymbol(),
								address: fc.constantFrom(
									'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
									'0xdAC17F958D2ee523a2206206994597C13D831ec7',
									'0x6B175474E89094C44Da98b954EedeAC495271d0F'
								),
								decimals: fc.constantFrom(6, 18)
							}),
							minCheckoutUsd: fc.integer({ min: 1, max: 100 })
						}),
						{ minLength: 1, maxLength: 10 }
					),
					async (supportedAssets) => {
						mockGetSupportedAssets.mockResolvedValue({ supportedAssets });

						const response = await GET();
						expect(response.status).toBe(200);

						const body = await response.json();
						expect(body).toHaveProperty('supportedAssets');
						expect(Array.isArray(body.supportedAssets)).toBe(true);
						expect(body.supportedAssets).toEqual(supportedAssets);
					}
				),
				{ numRuns: 10 }
			);
		});

		it('should return empty array when no assets available', async () => {
			mockGetSupportedAssets.mockResolvedValue({ supportedAssets: [] });

			const response = await GET();
			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body).toHaveProperty('supportedAssets');
			expect(body.supportedAssets).toEqual([]);
		});
	});

	/**
	 * Feature: bridge-supported-assets
	 * Property: Cache headers
	 */
	describe('Property: Cache behavior', () => {
		it('should set 5-minute cache headers', async () => {
			const assets = [createMockSupportedAsset()];
			mockGetSupportedAssets.mockResolvedValue({ supportedAssets: assets });

			const response = await GET();

			expectCacheHeaders(response, 300); // 5 minutes = 300 seconds
		});
	});

	/**
	 * Feature: bridge-supported-assets
	 * Property: Error handling
	 */
	describe('Property: Error handling', () => {
		it('should return 500 when service throws error', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 10, maxLength: 100 }), async (errorMessage) => {
					mockGetSupportedAssets.mockRejectedValue(new Error(errorMessage));

					const response = await GET();
					expect(response.status).toBe(500);

					const body = await response.json();
					expect(body).toHaveProperty('error');
					expect(body).toHaveProperty('message');
					expect(body).toHaveProperty('statusCode', 500);
				}),
				{ numRuns: 10 }
			);
		});

		it('should include timestamp in error response', async () => {
			mockGetSupportedAssets.mockRejectedValue(new Error('Service failure'));

			const response = await GET();
			const body = await response.json();

			expect(body).toHaveProperty('timestamp');
			expect(typeof body.timestamp).toBe('string');

			// Verify timestamp is valid ISO string
			const date = new Date(body.timestamp);
			expect(date.toISOString()).toBe(body.timestamp);
		});
	});

	/**
	 * Feature: bridge-supported-assets
	 * Property: Response structure consistency
	 */
	describe('Property: Response structure', () => {
		it('should always return consistent structure for successful responses', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.array(
						fc.record({
							chainId: fc.string({ minLength: 1, maxLength: 10 }),
							chainName: fc.string({ minLength: 3, maxLength: 20 }),
							token: fc.record({
								name: fc.string({ minLength: 1, maxLength: 50 }),
								symbol: fc.string({ minLength: 1, maxLength: 10 }),
								address: fc.string({ minLength: 42, maxLength: 42 }),
								decimals: fc.integer({ min: 0, max: 18 })
							}),
							minCheckoutUsd: fc.integer({ min: 0, max: 1000 })
						}),
						{ minLength: 0, maxLength: 5 }
					),
					async (assets) => {
						mockGetSupportedAssets.mockResolvedValue({ supportedAssets: assets });

						const response = await GET();
						const body = await response.json();

						// Verify required fields
						expect(body).toHaveProperty('supportedAssets');
						expect(Array.isArray(body.supportedAssets)).toBe(true);

						// Verify each asset has required structure
						body.supportedAssets.forEach((asset: unknown) => {
							expect(asset).toHaveProperty('chainId');
							expect(asset).toHaveProperty('chainName');
							expect(asset).toHaveProperty('token');
							expect(asset).toHaveProperty('minCheckoutUsd');

							const typedAsset = asset as { token: unknown };
							expect(typedAsset.token).toHaveProperty('name');
							expect(typedAsset.token).toHaveProperty('symbol');
							expect(typedAsset.token).toHaveProperty('address');
							expect(typedAsset.token).toHaveProperty('decimals');
						});
					}
				),
				{ numRuns: 10 }
			);
		});
	});
});
