/**
 * Tests for POST /api/bridge/deposit server route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { RequestEvent } from '@sveltejs/kit';
import { ethereumArbitraries } from '$lib/tests/arbitraries/common-arbitraries.js';
import { createMockDepositAddresses } from '$lib/tests/utils/test-helpers.js';

// Mock the BridgeService
const mockCreateDeposit = vi.fn();

vi.mock('$lib/server/services/bridge-service', () => ({
	BridgeService: class {
		createDeposit = mockCreateDeposit;
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

const { POST } = await import('../../routes/api/bridge/deposit/+server');

describe('POST /api/bridge/deposit', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockCreateDeposit.mockReset();
	});

	/**
	 * Feature: bridge-deposit
	 * Property: Successful deposit address creation
	 */
	describe('Property: Successful deposit creation', () => {
		it('should create deposit addresses for valid Ethereum addresses', async () => {
			await fc.assert(
				fc.asyncProperty(ethereumArbitraries.validAddress(), async (address) => {
					const depositResult = createMockDepositAddresses();
					mockCreateDeposit.mockResolvedValue(depositResult);

					const mockRequest = {
						request: {
							json: async () => ({ address })
						}
					} as unknown as RequestEvent;

					const response = await POST(mockRequest);
					expect(response.status).toBe(201);

					const body = await response.json();
					expect(body).toHaveProperty('address');
					expect(body.address).toHaveProperty('evm');
					expect(body.address).toHaveProperty('svm');
					expect(body.address).toHaveProperty('btc');

					// Verify service was called with the address
					expect(mockCreateDeposit).toHaveBeenCalledWith(address);
				}),
				{ numRuns: 10 }
			);
		});

		it('should return 201 status code for successful creation', async () => {
			const depositResult = createMockDepositAddresses();
			mockCreateDeposit.mockResolvedValue(depositResult);

			const mockRequest = {
				request: {
					json: async () => ({ address: '0x1234567890abcdef1234567890abcdef12345678' })
				}
			} as unknown as RequestEvent;

			const response = await POST(mockRequest);
			expect(response.status).toBe(201);
		});
	});

	/**
	 * Feature: bridge-deposit
	 * Property: Input validation
	 */
	describe('Property: Input validation', () => {
		it('should return 400 when address field is missing', async () => {
			const mockRequest = {
				request: {
					json: async () => ({})
				}
			} as unknown as RequestEvent;

			const response = await POST(mockRequest);
			expect(response.status).toBe(400);

			const body = await response.json();
			expect(body).toHaveProperty('error');
			expect(body).toHaveProperty('message');
			expect(body.message).toContain('address');
		});

		it('should return 400 for invalid JSON body', async () => {
			const mockRequest = {
				request: {
					json: async () => {
						throw new Error('Invalid JSON');
					}
				}
			} as unknown as RequestEvent;

			const response = await POST(mockRequest);
			expect(response.status).toBe(400);

			const body = await response.json();
			expect(body).toHaveProperty('error');
			expect(body.message).toContain('JSON');
		});

		it('should return 400 when body is not an object', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
					async (invalidBody) => {
						const mockRequest = {
							request: {
								json: async () => invalidBody
							}
						} as unknown as RequestEvent;

						const response = await POST(mockRequest);
						expect(response.status).toBe(400);

						const body = await response.json();
						expect(body).toHaveProperty('error');
					}
				),
				{ numRuns: 10 }
			);
		});
	});

	/**
	 * Feature: bridge-deposit
	 * Property: Cache headers
	 */
	describe('Property: Cache behavior', () => {
		it('should set no-store cache headers', async () => {
			const depositResult = createMockDepositAddresses();
			mockCreateDeposit.mockResolvedValue(depositResult);

			const mockRequest = {
				request: {
					json: async () => ({ address: '0x1234567890abcdef1234567890abcdef12345678' })
				}
			} as unknown as RequestEvent;

			const response = await POST(mockRequest);

			const cacheControl = response.headers.get('Cache-Control');
			expect(cacheControl).toBe('no-store');
		});
	});

	/**
	 * Feature: bridge-deposit
	 * Property: Error handling
	 */
	describe('Property: Error handling', () => {
		it('should return 500 when service throws error', async () => {
			await fc.assert(
				fc.asyncProperty(
					ethereumArbitraries.validAddress(),
					fc.string({ minLength: 10, maxLength: 100 }),
					async (address, errorMessage) => {
						mockCreateDeposit.mockRejectedValue(new Error(errorMessage));

						const mockRequest = {
							request: {
								json: async () => ({ address })
							}
						} as unknown as RequestEvent;

						const response = await POST(mockRequest);
						expect(response.status).toBe(500);

						const body = await response.json();
						expect(body).toHaveProperty('error');
						expect(body).toHaveProperty('statusCode', 500);
					}
				),
				{ numRuns: 10 }
			);
		});

		it('should include timestamp in error response', async () => {
			mockCreateDeposit.mockRejectedValue(new Error('Service failure'));

			const mockRequest = {
				request: {
					json: async () => ({ address: '0x1234567890abcdef1234567890abcdef12345678' })
				}
			} as unknown as RequestEvent;

			const response = await POST(mockRequest);
			const body = await response.json();

			expect(body).toHaveProperty('timestamp');
			expect(typeof body.timestamp).toBe('string');

			// Verify timestamp is valid ISO string
			const date = new Date(body.timestamp);
			expect(date.toISOString()).toBe(body.timestamp);
		});
	});

	/**
	 * Feature: bridge-deposit
	 * Property: Response structure consistency
	 */
	describe('Property: Response structure', () => {
		it('should return consistent structure for all successful requests', async () => {
			await fc.assert(
				fc.asyncProperty(ethereumArbitraries.validAddress(), async (address) => {
					const depositResult = createMockDepositAddresses({
						address: {
							evm: '0xabc123',
							svm: 'SolanaAddr123',
							btc: 'BitcoinAddr123'
						}
					});
					mockCreateDeposit.mockResolvedValue(depositResult);

					const mockRequest = {
						request: {
							json: async () => ({ address })
						}
					} as unknown as RequestEvent;

					const response = await POST(mockRequest);
					const body = await response.json();

					// Verify required fields
					expect(body).toHaveProperty('address');
					expect(typeof body.address).toBe('object');

					// Verify address map structure
					expect(body.address).toHaveProperty('evm');
					expect(body.address).toHaveProperty('svm');
					expect(body.address).toHaveProperty('btc');
					expect(typeof body.address.evm).toBe('string');
					expect(typeof body.address.svm).toBe('string');
					expect(typeof body.address.btc).toBe('string');

					// Optional note field
					if (body.note !== undefined) {
						expect(typeof body.note).toBe('string');
					}
				}),
				{ numRuns: 10 }
			);
		});
	});
});
