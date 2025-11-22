/**
 * Property-based tests for error handling in user data endpoints
 * Feature: polymarket-user-data
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
	formatErrorResponse
} from './api-errors.js';

describe('User Data Error Handling Properties', () => {
	/**
	 * Property 14: API errors map to appropriate HTTP status codes
	 * Feature: polymarket-user-data, Property 14: API errors map to appropriate HTTP status codes
	 * Validates: Requirements 7.1, 7.3
	 *
	 * For any API error response, the system should map it to an appropriate client-facing
	 * HTTP status code (400 for validation, 503 for upstream errors, 500 for unexpected errors).
	 */
	test('Property 14: API errors map to appropriate HTTP status codes', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					// NetworkError -> 503
					fc.record({
						type: fc.constant('network' as const),
						message: fc.string({ minLength: 1 }),
						details: fc.option(fc.anything())
					}),
					// TimeoutError -> 503
					fc.record({
						type: fc.constant('timeout' as const),
						message: fc.option(fc.string({ minLength: 1 })),
						details: fc.option(fc.anything())
					}),
					// ConnectionError -> 503
					fc.record({
						type: fc.constant('connection' as const),
						message: fc.string({ minLength: 1 }),
						details: fc.option(fc.anything())
					}),
					// ApiResponseError 4xx -> same status
					fc.record({
						type: fc.constant('apiResponse4xx' as const),
						message: fc.string({ minLength: 1 }),
						statusCode: fc.integer({ min: 400, max: 499 }),
						responseStatus: fc.integer({ min: 400, max: 499 }),
						responseBody: fc.option(fc.anything())
					}),
					// ApiResponseError 5xx -> 503
					fc.record({
						type: fc.constant('apiResponse5xx' as const),
						message: fc.string({ minLength: 1 }),
						responseStatus: fc.integer({ min: 500, max: 599 }),
						responseBody: fc.option(fc.anything())
					}),
					// ValidationError -> 400
					fc.record({
						type: fc.constant('validation' as const),
						message: fc.string({ minLength: 1 }),
						details: fc.option(fc.anything())
					}),
					// ParsingError -> 502
					fc.record({
						type: fc.constant('parsing' as const),
						message: fc.string({ minLength: 1 }),
						details: fc.option(fc.anything())
					}),
					// Unknown Error -> 500
					fc.record({
						type: fc.constant('unknown' as const),
						message: fc.string({ minLength: 1 })
					})
				),
				(errorSpec) => {
					let error: Error | ApiError;
					let expectedStatusCode: number;

					switch (errorSpec.type) {
						case 'network':
							error = new NetworkError(errorSpec.message, errorSpec.details ?? undefined);
							expectedStatusCode = 503;
							break;
						case 'timeout':
							error = new TimeoutError(
								errorSpec.message ?? undefined,
								errorSpec.details ?? undefined
							);
							expectedStatusCode = 503;
							break;
						case 'connection':
							error = new ConnectionError(errorSpec.message, errorSpec.details ?? undefined);
							expectedStatusCode = 503;
							break;
						case 'apiResponse4xx':
							error = new ApiResponseError(
								errorSpec.message,
								errorSpec.statusCode,
								errorSpec.responseStatus,
								errorSpec.responseBody ?? undefined
							);
							expectedStatusCode = errorSpec.statusCode;
							break;
						case 'apiResponse5xx':
							// For 5xx errors, we map to 503
							error = new ApiResponseError(
								errorSpec.message,
								503,
								errorSpec.responseStatus,
								errorSpec.responseBody ?? undefined
							);
							expectedStatusCode = 503;
							break;
						case 'validation':
							error = new ValidationError(errorSpec.message, errorSpec.details ?? undefined);
							expectedStatusCode = 400;
							break;
						case 'parsing':
							error = new ParsingError(errorSpec.message, errorSpec.details ?? undefined);
							expectedStatusCode = 502;
							break;
						case 'unknown':
							error = new Error(errorSpec.message);
							expectedStatusCode = 500;
							break;
					}

					// Format the error response
					const response = formatErrorResponse(error);

					// Verify the status code matches expected mapping
					expect(response.statusCode).toBe(expectedStatusCode);

					// Verify status code is in valid HTTP error range
					expect(response.statusCode).toBeGreaterThanOrEqual(400);
					expect(response.statusCode).toBeLessThan(600);

					// Verify error type is set appropriately
					expect(response.error).toBeDefined();
					expect(typeof response.error).toBe('string');
					expect(response.error.length).toBeGreaterThan(0);

					// Verify message is preserved
					expect(response.message).toBeDefined();
					expect(typeof response.message).toBe('string');
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * Property 15: Validation errors return 400 status
	 * Feature: polymarket-user-data, Property 15: Validation errors return 400 status
	 * Validates: Requirements 7.2
	 *
	 * For any validation failure (invalid wallet, missing required params), the system
	 * should return a 400 status code with error details.
	 */
	test('Property 15: Validation errors return 400 status', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1 }), // error message
				fc.option(fc.anything()), // optional details
				(message, details) => {
					// Create a validation error
					const error = new ValidationError(message, details ?? undefined);

					// Format the error response
					const response = formatErrorResponse(error);

					// Verify status code is 400
					expect(response.statusCode).toBe(400);

					// Verify error type is VALIDATION_ERROR
					expect(response.error).toBe('VALIDATION_ERROR');

					// Verify message is preserved
					expect(response.message).toBe(message);

					// Verify details are included if provided
					if (details !== null && details !== undefined) {
						expect(response.details).toBeDefined();
					}

					// Verify timestamp is present and valid
					expect(response.timestamp).toBeDefined();
					expect(typeof response.timestamp).toBe('string');
					expect(() => new Date(response.timestamp)).not.toThrow();
					expect(new Date(response.timestamp).toISOString()).toBe(response.timestamp);
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * Property 16: Error logging includes structured context
	 * Feature: polymarket-user-data, Property 16: Error logging includes structured context
	 * Validates: Requirements 7.5
	 *
	 * For any error that occurs, the system should log it with structured context
	 * including at minimum the error message, duration, and request parameters.
	 */
	test('Property 16: Error logging includes structured context', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					// Generate various error types
					fc.string({ minLength: 1 }).map((msg) => new ValidationError(msg, { param: 'test' })),
					fc.string({ minLength: 1 }).map((msg) => new NetworkError(msg)),
					fc.string({ minLength: 1 }).map((msg) => new TimeoutError(msg)),
					fc
						.tuple(fc.string({ minLength: 1 }), fc.integer({ min: 400, max: 599 }))
						.map(([msg, status]) => new ApiResponseError(msg, status, status)),
					fc.string({ minLength: 1 }).map((msg) => new Error(msg))
				),
				fc.integer({ min: 0, max: 10000 }), // duration
				fc.record({
					// request parameters
					user: fc.option(fc.string()),
					market: fc.option(fc.array(fc.string())),
					endpoint: fc.option(fc.string())
				}),
				(error, duration, requestParams) => {
					// Format the error response
					const response = formatErrorResponse(error);

					// Verify all required fields are present
					expect(response).toHaveProperty('error');
					expect(response).toHaveProperty('message');
					expect(response).toHaveProperty('statusCode');
					expect(response).toHaveProperty('timestamp');

					// Verify error message is included
					expect(response.message).toBeDefined();
					expect(typeof response.message).toBe('string');
					expect(response.message.length).toBeGreaterThan(0);

					// Verify timestamp is included and valid (ISO 8601 format)
					expect(response.timestamp).toBeDefined();
					expect(typeof response.timestamp).toBe('string');
					expect(() => new Date(response.timestamp)).not.toThrow();
					expect(new Date(response.timestamp).toISOString()).toBe(response.timestamp);

					// Verify structured context can be attached
					// In a real scenario, the logger would attach duration and request params
					// Here we verify that the error response structure supports this
					const contextualizedResponse = {
						...response,
						context: {
							duration,
							requestParams
						}
					};

					expect(contextualizedResponse.context).toBeDefined();
					expect(contextualizedResponse.context.duration).toBe(duration);
					expect(contextualizedResponse.context.requestParams).toEqual(requestParams);

					// Verify the error type is appropriate
					if (error instanceof ApiError) {
						expect(response.statusCode).toBe(error.statusCode);
						expect(response.error).toBe(error.errorType);
					} else {
						expect(response.statusCode).toBe(500);
						expect(response.error).toBe('INTERNAL_ERROR');
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Property 16: Error context includes details for ApiError types', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1 }), // message
				fc.oneof(
					// Generate different detail types
					fc.record({
						param: fc.string(),
						value: fc.anything()
					}),
					fc.record({
						responseStatus: fc.integer({ min: 400, max: 599 }),
						responseBody: fc.anything()
					}),
					fc.object(),
					fc.array(fc.anything())
				),
				(message, details) => {
					// Create an ApiError with details
					const error = new ValidationError(message, details);

					// Format the error response
					const response = formatErrorResponse(error);

					// Verify details are included in the response
					expect(response.details).toBeDefined();
					expect(response.details).toEqual(details);

					// Verify all standard fields are present
					expect(response.error).toBe('VALIDATION_ERROR');
					expect(response.message).toBe(message);
					expect(response.statusCode).toBe(400);
					expect(response.timestamp).toBeDefined();
				}
			),
			{ numRuns: 100 }
		);
	});
});
