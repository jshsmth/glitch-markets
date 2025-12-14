/**
 * Error types and error response formatting for the Polymarket API integration
 */

/**
 * Base error class for all API-related errors
 */
export class ApiError extends Error {
	public readonly statusCode: number;
	public readonly errorType: string;
	public readonly details?: unknown;
	public readonly timestamp: Date;

	constructor(message: string, statusCode: number, errorType: string, details?: unknown) {
		super(message);
		this.name = 'ApiError';
		this.statusCode = statusCode;
		this.errorType = errorType;
		this.details = details;
		this.timestamp = new Date();

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

/**
 * Network-related errors (timeout, connection refused, DNS failures)
 */
export class NetworkError extends ApiError {
	constructor(message: string, details?: unknown) {
		super(message, 503, 'NETWORK_ERROR', details);
		this.name = 'NetworkError';
	}
}

/**
 * Timeout errors
 */
export class TimeoutError extends ApiError {
	constructor(message = 'Request timeout', details?: unknown) {
		super(message, 503, 'TIMEOUT_ERROR', details);
		this.name = 'TimeoutError';
	}
}

/**
 * Connection errors (connection refused, DNS failures)
 */
export class ConnectionError extends ApiError {
	constructor(message: string, details?: unknown) {
		super(message, 503, 'CONNECTION_ERROR', details);
		this.name = 'ConnectionError';
	}
}

/**
 * API response errors (4xx, 5xx status codes)
 */
export class ApiResponseError extends ApiError {
	public readonly responseStatus: number;
	public readonly responseBody?: unknown;

	constructor(message: string, statusCode: number, responseStatus: number, responseBody?: unknown) {
		super(message, statusCode, 'API_RESPONSE_ERROR', { responseStatus, responseBody });
		this.name = 'ApiResponseError';
		this.responseStatus = responseStatus;
		this.responseBody = responseBody;
	}
}

/**
 * Validation errors (invalid parameters, missing fields, type mismatches)
 */
export class ValidationError extends ApiError {
	constructor(message: string, details?: unknown) {
		super(message, 400, 'VALIDATION_ERROR', details);
		this.name = 'ValidationError';
	}
}

/**
 * Parsing errors (invalid JSON, malformed responses)
 */
export class ParsingError extends ApiError {
	constructor(message: string, details?: unknown) {
		super(message, 502, 'PARSING_ERROR', details);
		this.name = 'ParsingError';
	}
}

/**
 * Error response format for API responses
 */
export interface ErrorResponse {
	error: string;
	message: string;
	statusCode: number;
	details?: unknown;
	timestamp: string;
}

/**
 * Formats an error into a standardized error response
 */
export function formatErrorResponse(error: Error | ApiError): ErrorResponse {
	if (error instanceof ApiError) {
		return {
			error: error.errorType,
			message: error.message,
			statusCode: error.statusCode,
			details: error.details,
			timestamp: error.timestamp.toISOString()
		};
	}

	return {
		error: 'INTERNAL_ERROR',
		message: error.message || 'An unexpected error occurred',
		statusCode: 500,
		timestamp: new Date().toISOString()
	};
}

/**
 * Checks if an error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
	if (error instanceof NetworkError) {
		return true;
	}

	if (error instanceof Error) {
		const networkErrorPatterns = [
			'ECONNREFUSED',
			'ENOTFOUND',
			'ETIMEDOUT',
			'ECONNRESET',
			'ENETUNREACH',
			'EAI_AGAIN'
		];

		return networkErrorPatterns.some((pattern) => error.message.includes(pattern));
	}

	return false;
}

/**
 * Checks if an error is an abort/timeout error
 */
export function isAbortError(error: unknown): boolean {
	if (error instanceof TimeoutError) {
		return true;
	}

	if (error instanceof Error || error instanceof DOMException) {
		return error.name === 'AbortError';
	}

	return false;
}
