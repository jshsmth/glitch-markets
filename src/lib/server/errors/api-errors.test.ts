/**
 * Property-based tests for error handling
 * Feature: polymarket-api-integration
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	ApiError,
	NetworkError,
	TimeoutError,
	ConnectionError,
	ApiResponseError,
	ValidationError,
	ParsingError,
	formatErrorResponse,
	type ErrorResponse
} from './api-errors.js';

describe('Error Handling', () => {
	/**
	 * Property 3: Error response consistency
	 * Validates: Requirements 1.4, 4.1, 4.3, 4.5
	 *
	 * For any API failure (unreachable, timeout, or error response),
	 * the server route should return an appropriate error response with
	 * the correct status code and error message in the response body.
	 */
	test('Property 3: all API errors produce consistent error responses with required fields', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					// Generate NetworkError
					fc.record({
						type: fc.constant('network'),
						message: fc.string({ minLength: 1 }),
						details: fc.option(fc.anything())
					}),
					// Generate TimeoutError
					fc.record({
						type: fc.constant('timeout'),
						message: fc.option(fc.string({ minLength: 1 })),
						details: fc.option(fc.anything())
					}),
					// Generate ConnectionError
					fc.record({
						type: fc.constant('connection'),
						message: fc.string({ minLength: 1 }),
						details: fc.option(fc.anything())
					}),
					// Generate ApiResponseError
					fc.record({
						type: fc.constant('apiResponse'),
						message: fc.string({ minLength: 1 }),
						statusCode: fc.integer({ min: 400, max: 599 }),
						responseStatus: fc.integer({ min: 400, max: 599 }),
						responseBody: fc.option(fc.anything())
					}),
					// Generate ValidationError
					fc.record({
						type: fc.constant('validation'),
						message: fc.string({ minLength: 1 }),
						details: fc.option(fc.anything())
					}),
					// Generate ParsingError
					fc.record({
						type: fc.constant('parsing'),
						message: fc.string({ minLength: 1 }),
						details: fc.option(fc.anything())
					})
				),
				(errorSpec) => {
					// Create the appropriate error based on the spec
					let error: ApiError;

					switch (errorSpec.type) {
						case 'network':
							error = new NetworkError(errorSpec.message, errorSpec.details ?? undefined);
							break;
						case 'timeout':
							error = new TimeoutError(
								errorSpec.message ?? undefined,
								errorSpec.details ?? undefined
							);
							break;
						case 'connection':
							error = new ConnectionError(errorSpec.message, errorSpec.details ?? undefined);
							break;
						case 'apiResponse':
							error = new ApiResponseError(
								errorSpec.message,
								errorSpec.statusCode,
								errorSpec.responseStatus,
								errorSpec.responseBody ?? undefined
							);
							break;
						case 'validation':
							error = new ValidationError(errorSpec.message, errorSpec.details ?? undefined);
							break;
						case 'parsing':
							error = new ParsingError(errorSpec.message, errorSpec.details ?? undefined);
							break;
					}

					// Format the error response
					const response: ErrorResponse = formatErrorResponse(error);

					// Verify all required fields are present
					expect(response).toHaveProperty('error');
					expect(response).toHaveProperty('message');
					expect(response).toHaveProperty('statusCode');
					expect(response).toHaveProperty('timestamp');

					// Verify field types
					expect(typeof response.error).toBe('string');
					expect(typeof response.message).toBe('string');
					expect(typeof response.statusCode).toBe('number');
					expect(typeof response.timestamp).toBe('string');

					// Verify error type is not empty
					expect(response.error.length).toBeGreaterThan(0);

					// Verify message matches the original
					expect(response.message).toBe(error.message);

					// Verify status code is valid HTTP status code
					expect(response.statusCode).toBeGreaterThanOrEqual(400);
					expect(response.statusCode).toBeLessThan(600);

					// Verify timestamp is a valid ISO string
					expect(() => new Date(response.timestamp)).not.toThrow();
					expect(new Date(response.timestamp).toISOString()).toBe(response.timestamp);

					// Verify error-specific properties
					if (errorSpec.type === 'network' || errorSpec.type === 'connection') {
						expect(response.statusCode).toBe(503);
					} else if (errorSpec.type === 'timeout') {
						expect(response.statusCode).toBe(503);
						expect(response.error).toBe('TIMEOUT_ERROR');
					} else if (errorSpec.type === 'validation') {
						expect(response.statusCode).toBe(400);
						expect(response.error).toBe('VALIDATION_ERROR');
					} else if (errorSpec.type === 'parsing') {
						expect(response.statusCode).toBe(502);
						expect(response.error).toBe('PARSING_ERROR');
					} else if (errorSpec.type === 'apiResponse') {
						expect(response.statusCode).toBe(errorSpec.statusCode);
						expect(response.error).toBe('API_RESPONSE_ERROR');
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Property 3: unknown errors produce consistent error responses', () => {
		fc.assert(
			fc.property(fc.string({ minLength: 1 }), (errorMessage) => {
				const error = new Error(errorMessage);
				const response: ErrorResponse = formatErrorResponse(error);

				// Verify all required fields are present
				expect(response).toHaveProperty('error');
				expect(response).toHaveProperty('message');
				expect(response).toHaveProperty('statusCode');
				expect(response).toHaveProperty('timestamp');

				// Verify field types
				expect(typeof response.error).toBe('string');
				expect(typeof response.message).toBe('string');
				expect(typeof response.statusCode).toBe('number');
				expect(typeof response.timestamp).toBe('string');

				// Verify error type for unknown errors
				expect(response.error).toBe('INTERNAL_ERROR');
				expect(response.statusCode).toBe(500);
				expect(response.message).toBe(errorMessage);

				// Verify timestamp is valid
				expect(() => new Date(response.timestamp)).not.toThrow();
			}),
			{ numRuns: 100 }
		);
	});
});
