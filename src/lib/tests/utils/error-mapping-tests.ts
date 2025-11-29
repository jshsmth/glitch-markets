/**
 * Reusable error mapping test suite for server routes
 * Ensures consistent error handling across all API endpoints
 */

import { describe, it, vi } from 'vitest';
import * as fc from 'fast-check';
import {
	ValidationError,
	NetworkError,
	TimeoutError,
	ConnectionError,
	ApiResponseError
} from '$lib/server/errors/api-errors';
import { ERROR_TYPES, expectErrorResponse } from './test-helpers';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Creates a standard suite of error mapping tests for a server route
 *
 * @param config - Configuration for the error mapping tests
 * @param config.routeName - Name of the route (for test descriptions)
 * @param config.getHandler - Function that returns the route's GET handler
 * @param config.mockService - The mocked service instance
 * @param config.mockMethod - Name of the mocked service method
 * @param config.createMockRequest - Optional function to create a mock request (defaults to empty URL)
 *
 * @example
 * ```typescript
 * createErrorMappingTests({
 *   routeName: 'tags',
 *   getHandler: () => GET,
 *   mockService: mockService,
 *   mockMethod: 'getTags'
 * });
 * ```
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function createErrorMappingTests(config: {
	routeName: string;
	getHandler: () => (event: RequestEvent) => Promise<Response>;
	mockService: any;
	mockMethod: string;
	createMockRequest?: () => RequestEvent;
}): void {
	const {
		routeName,
		getHandler,
		mockService,
		mockMethod,
		createMockRequest = () =>
			({ url: new URL(`http://localhost/api/${routeName}`) }) as RequestEvent
	} = config;

	describe('Error Mapping', () => {
		/**
		 * Test ValidationError mapping to 400 status code
		 */
		it('should map ValidationError to 400 status code', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (errorMessage) => {
					// Reset and configure mock
					vi.mocked(mockService[mockMethod]).mockReset();
					vi.mocked(mockService[mockMethod]).mockRejectedValue(new ValidationError(errorMessage));

					// Call the GET handler
					const GET = getHandler();
					const response = await GET(createMockRequest());

					// Verify error response
					await expectErrorResponse(response, 400, ERROR_TYPES.VALIDATION_ERROR);
				}),
				{ numRuns: 100 }
			);
		});

		/**
		 * Test NetworkError mapping to 503 status code
		 */
		it('should map NetworkError to 503 status code', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (errorMessage) => {
					// Reset and configure mock
					vi.mocked(mockService[mockMethod]).mockReset();
					vi.mocked(mockService[mockMethod]).mockRejectedValue(new NetworkError(errorMessage));

					// Call the GET handler
					const GET = getHandler();
					const response = await GET(createMockRequest());

					// Verify error response
					await expectErrorResponse(response, 503, ERROR_TYPES.NETWORK_ERROR);
				}),
				{ numRuns: 100 }
			);
		});

		/**
		 * Test TimeoutError mapping to 503 status code
		 */
		it('should map TimeoutError to 503 status code', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (errorMessage) => {
					// Reset and configure mock
					vi.mocked(mockService[mockMethod]).mockReset();
					vi.mocked(mockService[mockMethod]).mockRejectedValue(new TimeoutError(errorMessage));

					// Call the GET handler
					const GET = getHandler();
					const response = await GET(createMockRequest());

					// Verify error response
					await expectErrorResponse(response, 503, ERROR_TYPES.TIMEOUT_ERROR);
				}),
				{ numRuns: 100 }
			);
		});

		/**
		 * Test ConnectionError mapping to 503 status code
		 */
		it('should map ConnectionError to 503 status code', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (errorMessage) => {
					// Reset and configure mock
					vi.mocked(mockService[mockMethod]).mockReset();
					vi.mocked(mockService[mockMethod]).mockRejectedValue(new ConnectionError(errorMessage));

					// Call the GET handler
					const GET = getHandler();
					const response = await GET(createMockRequest());

					// Verify error response
					await expectErrorResponse(response, 503, ERROR_TYPES.CONNECTION_ERROR);
				}),
				{ numRuns: 100 }
			);
		});

		/**
		 * Test ApiResponseError mapping to its status code
		 */
		it('should map ApiResponseError to its status code', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.string({ minLength: 1, maxLength: 100 }),
					fc.integer({ min: 400, max: 599 }),
					async (errorMessage, statusCode) => {
						// Reset and configure mock
						vi.mocked(mockService[mockMethod]).mockReset();
						vi.mocked(mockService[mockMethod]).mockRejectedValue(
							new ApiResponseError(errorMessage, statusCode, statusCode)
						);

						// Call the GET handler
						const GET = getHandler();
						const response = await GET(createMockRequest());

						// Verify error response
						await expectErrorResponse(response, statusCode, ERROR_TYPES.API_RESPONSE_ERROR);
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * Test generic Error mapping to 500 status code
		 */
		it('should map generic Error to 500 status code', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (errorMessage) => {
					// Reset and configure mock
					vi.mocked(mockService[mockMethod]).mockReset();
					vi.mocked(mockService[mockMethod]).mockRejectedValue(new Error(errorMessage));

					// Call the GET handler
					const GET = getHandler();
					const response = await GET(createMockRequest());

					// Verify error response
					await expectErrorResponse(response, 500, ERROR_TYPES.INTERNAL_ERROR);
				}),
				{ numRuns: 100 }
			);
		});
	});
}
