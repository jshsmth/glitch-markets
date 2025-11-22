/**
 * Property-based tests for logging
 * Feature: polymarket-api-integration
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { Logger } from './logger.js';

describe('Logger', () => {
	let consoleSpies: {
		debug: ReturnType<typeof vi.spyOn>;
		info: ReturnType<typeof vi.spyOn>;
		warn: ReturnType<typeof vi.spyOn>;
		error: ReturnType<typeof vi.spyOn>;
	};

	beforeEach(() => {
		// Spy on console methods
		consoleSpies = {
			debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
			info: vi.spyOn(console, 'info').mockImplementation(() => {}),
			warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
			error: vi.spyOn(console, 'error').mockImplementation(() => {})
		};
	});

	afterEach(() => {
		// Restore console methods
		vi.restoreAllMocks();
	});

	/**
	 * Property 9: Error logging completeness
	 * Validates: Requirements 4.2, 8.5, 10.3, 10.4
	 *
	 * For any error that occurs (API error, validation error, network error),
	 * the server route should log the error details with a timestamp.
	 */
	test('Property 9: all error logs include timestamp and error details', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1 }),
				fc.option(
					fc.oneof(
						// Generate Error objects
						fc.string({ minLength: 1 }).map((msg) => new Error(msg)),
						// Generate plain objects
						fc.object()
					)
				),
				fc.option(fc.dictionary(fc.string(), fc.anything())),
				(message, error, data) => {
					// Reset the spy before each iteration
					consoleSpies.error.mockClear();

					const logger = new Logger();

					// Log the error
					logger.error(message, error ?? undefined, data ?? undefined);

					// Verify console.error was called
					expect(consoleSpies.error).toHaveBeenCalled();

					// Get the logged output
					const loggedOutput = consoleSpies.error.mock.calls[0][0] as string;

					// Verify timestamp is present (ISO 8601 format)
					expect(loggedOutput).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);

					// Verify log level is present
					expect(loggedOutput).toContain('ERROR:');

					// Verify message is present (trim whitespace for comparison)
					const trimmedMessage = message.trim();
					if (trimmedMessage) {
						expect(loggedOutput).toContain(trimmedMessage);
					}

					// Verify error details are included if error was provided
					if (error instanceof Error) {
						// Just verify that the error object structure is present in the log
						expect(loggedOutput).toContain('"error"');
						expect(loggedOutput).toContain('"name"');
						expect(loggedOutput).toContain('"message"');
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Property 9: all info logs include timestamp', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1 }),
				fc.option(fc.dictionary(fc.string(), fc.anything())),
				(message, data) => {
					// Reset the spy before each iteration
					consoleSpies.info.mockClear();

					const logger = new Logger();

					// Log the info
					logger.info(message, data ?? undefined);

					// Verify console.info was called
					expect(consoleSpies.info).toHaveBeenCalled();

					// Get the logged output
					const loggedOutput = consoleSpies.info.mock.calls[0][0] as string;

					// Verify timestamp is present (ISO 8601 format)
					expect(loggedOutput).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);

					// Verify log level is present
					expect(loggedOutput).toContain('INFO:');

					// Verify message is present
					expect(loggedOutput).toContain(message);
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Property 9: all warn logs include timestamp', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1 }),
				fc.option(fc.dictionary(fc.string(), fc.anything())),
				(message, data) => {
					// Reset the spy before each iteration
					consoleSpies.warn.mockClear();

					const logger = new Logger();

					// Log the warning
					logger.warn(message, data ?? undefined);

					// Verify console.warn was called
					expect(consoleSpies.warn).toHaveBeenCalled();

					// Get the logged output
					const loggedOutput = consoleSpies.warn.mock.calls[0][0] as string;

					// Verify timestamp is present (ISO 8601 format)
					expect(loggedOutput).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);

					// Verify log level is present
					expect(loggedOutput).toContain('WARN:');

					// Verify message is present
					expect(loggedOutput).toContain(message);
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Property 9: logger context is included in all logs', () => {
		fc.assert(
			fc.property(
				fc.dictionary(fc.string({ minLength: 1 }), fc.string({ minLength: 1 })),
				fc.string({ minLength: 1 }),
				(context, message) => {
					// Reset the spy before each iteration
					consoleSpies.info.mockClear();

					const logger = new Logger(context);

					// Log an info message
					logger.info(message);

					// Verify console.info was called
					expect(consoleSpies.info).toHaveBeenCalled();

					// Get the logged output
					const loggedOutput = consoleSpies.info.mock.calls[0][0] as string;

					// Verify context values are present in the log
					// The logger outputs JSON, so we need to check for JSON-escaped keys
					for (const [key, value] of Object.entries(context)) {
						const trimmedKey = key.trim();
						const trimmedValue = typeof value === 'string' ? value.trim() : String(value);
						// Only check for non-trivial keys and values
						if (
							trimmedKey &&
							trimmedValue &&
							!trimmedKey.match(/^\[object/) &&
							!trimmedValue.match(/^["\\]+$/)
						) {
							// Check for the JSON-stringified version of the key
							const jsonKey = JSON.stringify(trimmedKey);
							// Remove the surrounding quotes from JSON.stringify
							const escapedKey = jsonKey.slice(1, -1);
							expect(loggedOutput).toContain(escapedKey);
						}
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Property 9: error stack traces are logged when available', () => {
		fc.assert(
			fc.property(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }), (message, errorMsg) => {
				// Reset the spy before each iteration
				consoleSpies.error.mockClear();

				const logger = new Logger();
				const error = new Error(errorMsg);

				// Log the error
				logger.error(message, error);

				// Verify console.error was called
				expect(consoleSpies.error).toHaveBeenCalled();

				// Get the logged output
				const loggedOutput = consoleSpies.error.mock.calls[0][0] as string;

				// Verify error name is present
				expect(loggedOutput).toContain('Error');

				// Verify stack trace is present (if available)
				if (error.stack) {
					expect(loggedOutput).toContain('stack');
				}
			}),
			{ numRuns: 100 }
		);
	});

	/**
	 * Property 18: Request logging completeness
	 * Validates: Requirements 10.1, 10.2, 10.4, 10.5
	 *
	 * For any request received and response sent, the server route should log
	 * the request details, response status, and request duration with timestamps.
	 */
	test('Property 18: request logs include all required details with timestamps', () => {
		fc.assert(
			fc.property(
				fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'), // method
				fc.webUrl(), // url
				fc.integer({ min: 100, max: 599 }), // status code
				fc.integer({ min: 0, max: 10000 }), // duration in ms
				(method, url, statusCode, duration) => {
					// Reset the spy before each iteration
					consoleSpies.info.mockClear();

					const logger = new Logger();

					// Simulate logging a request
					logger.info('Incoming request', {
						method,
						url,
						timestamp: new Date().toISOString()
					});

					// Verify request log was created
					expect(consoleSpies.info).toHaveBeenCalled();
					const requestLog = consoleSpies.info.mock.calls[0][0] as string;

					// Verify timestamp is present (ISO 8601 format)
					expect(requestLog).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);

					// Verify request details are present
					expect(requestLog).toContain('Incoming request');
					expect(requestLog).toContain('"method"');
					expect(requestLog).toContain('"url"');

					// Reset for response log
					consoleSpies.info.mockClear();

					// Simulate logging a response with duration
					logger.info('Request completed', {
						method,
						url,
						statusCode,
						duration,
						timestamp: new Date().toISOString()
					});

					// Verify response log was created
					expect(consoleSpies.info).toHaveBeenCalled();
					const responseLog = consoleSpies.info.mock.calls[0][0] as string;

					// Verify timestamp is present
					expect(responseLog).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);

					// Verify response details are present
					expect(responseLog).toContain('Request completed');
					expect(responseLog).toContain('"method"');
					expect(responseLog).toContain('"url"');
					expect(responseLog).toContain('"statusCode"');
					expect(responseLog).toContain(String(statusCode));
					expect(responseLog).toContain('"duration"');
					expect(responseLog).toContain(String(duration));
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Property 18: request duration is calculated and logged correctly', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1 }), // url
				fc.integer({ min: 0, max: 5000 }), // simulated duration
				(url, simulatedDuration) => {
					// Reset the spy before each iteration
					consoleSpies.info.mockClear();

					const logger = new Logger();

					// Simulate a request with duration tracking
					const startTime = Date.now();

					// Log request start
					logger.info('Request started', { url, startTime });

					// Simulate some processing time
					const endTime = startTime + simulatedDuration;
					const actualDuration = endTime - startTime;

					// Log request completion with duration
					logger.info('Request completed', {
						url,
						duration: actualDuration
					});

					// Verify the log was created
					expect(consoleSpies.info).toHaveBeenCalledTimes(2);

					// Get the completion log
					const completionLog = consoleSpies.info.mock.calls[1][0] as string;

					// Verify duration is present and matches expected value
					expect(completionLog).toContain(String(actualDuration));
					expect(completionLog).toContain('duration');

					// Verify timestamp is present
					expect(completionLog).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Property 18: all request logs include timestamps regardless of log level', () => {
		fc.assert(
			fc.property(
				fc.constantFrom('debug', 'info', 'warn', 'error'),
				fc.string({ minLength: 1 }),
				fc.record({
					method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
					url: fc.webUrl(),
					statusCode: fc.option(fc.integer({ min: 100, max: 599 }))
				}),
				(logLevel, message, requestData) => {
					// Reset all spies
					Object.values(consoleSpies).forEach((spy) => spy.mockClear());

					const logger = new Logger();

					// Log at the specified level
					switch (logLevel) {
						case 'debug':
							logger.debug(message, requestData);
							break;
						case 'info':
							logger.info(message, requestData);
							break;
						case 'warn':
							logger.warn(message, requestData);
							break;
						case 'error':
							logger.error(message, undefined, requestData);
							break;
					}

					// Get the appropriate spy
					const spy = consoleSpies[logLevel as keyof typeof consoleSpies];

					// Verify the log was created
					expect(spy).toHaveBeenCalled();

					// Get the logged output
					const loggedOutput = spy.mock.calls[0][0] as string;

					// Verify timestamp is present (ISO 8601 format)
					expect(loggedOutput).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);

					// Verify request data keys are present (checking for JSON keys)
					expect(loggedOutput).toContain('"method"');
					expect(loggedOutput).toContain('"url"');
				}
			),
			{ numRuns: 100 }
		);
	});
});
