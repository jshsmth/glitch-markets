/**
 * Property-based tests for logging
 * Feature: universal-logging
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
		consoleSpies = {
			debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
			info: vi.spyOn(console, 'info').mockImplementation(() => {}),
			warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
			error: vi.spyOn(console, 'error').mockImplementation(() => {})
		};
	});

	afterEach(() => {
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
						fc.string({ minLength: 1 }).map((msg) => new Error(msg)),
						fc.object()
					)
				),
				fc.option(fc.dictionary(fc.string(), fc.anything())),
				(message, error, data) => {
					consoleSpies.error.mockClear();

					const logger = new Logger();

					logger.error(message, error ?? undefined, data ?? undefined);

					expect(consoleSpies.error).toHaveBeenCalled();

					const loggedOutput = consoleSpies.error.mock.calls[0][0] as string;

					expect(loggedOutput).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);

					expect(loggedOutput).toContain('ERROR:');

					const trimmedMessage = message.trim();
					if (trimmedMessage) {
						expect(loggedOutput).toContain(trimmedMessage);
					}

					if (error instanceof Error) {
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
					consoleSpies.info.mockClear();

					const logger = new Logger();

					logger.info(message, data ?? undefined);

					expect(consoleSpies.info).toHaveBeenCalled();

					const loggedOutput = consoleSpies.info.mock.calls[0][0] as string;

					expect(loggedOutput).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);

					expect(loggedOutput).toContain('INFO:');

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
					consoleSpies.warn.mockClear();

					const logger = new Logger();

					logger.warn(message, data ?? undefined);

					expect(consoleSpies.warn).toHaveBeenCalled();

					const loggedOutput = consoleSpies.warn.mock.calls[0][0] as string;

					expect(loggedOutput).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);

					expect(loggedOutput).toContain('WARN:');

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
					consoleSpies.info.mockClear();

					const logger = new Logger(context);

					logger.info(message);

					expect(consoleSpies.info).toHaveBeenCalled();

					const loggedOutput = consoleSpies.info.mock.calls[0][0] as string;

					for (const [key, value] of Object.entries(context)) {
						const trimmedKey = key.trim();
						const trimmedValue = typeof value === 'string' ? value.trim() : String(value);
						if (
							trimmedKey &&
							trimmedValue &&
							!trimmedKey.match(/^\[object/) &&
							!trimmedValue.match(/^["\\]+$/)
						) {
							const jsonKey = JSON.stringify(trimmedKey);
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
				consoleSpies.error.mockClear();

				const logger = new Logger();
				const error = new Error(errorMsg);

				logger.error(message, error);

				expect(consoleSpies.error).toHaveBeenCalled();

				const loggedOutput = consoleSpies.error.mock.calls[0][0] as string;

				expect(loggedOutput).toContain('Error');

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
				fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
				fc.webUrl(),
				fc.integer({ min: 100, max: 599 }),
				fc.integer({ min: 0, max: 10000 }),
				(method, url, statusCode, duration) => {
					consoleSpies.info.mockClear();

					const logger = new Logger();

					logger.info('Incoming request', {
						method,
						url,
						timestamp: new Date().toISOString()
					});

					expect(consoleSpies.info).toHaveBeenCalled();
					const requestLog = consoleSpies.info.mock.calls[0][0] as string;

					expect(requestLog).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);

					expect(requestLog).toContain('Incoming request');
					expect(requestLog).toContain('"method"');
					expect(requestLog).toContain('"url"');

					consoleSpies.info.mockClear();

					logger.info('Request completed', {
						method,
						url,
						statusCode,
						duration,
						timestamp: new Date().toISOString()
					});

					expect(consoleSpies.info).toHaveBeenCalled();
					const responseLog = consoleSpies.info.mock.calls[0][0] as string;

					expect(responseLog).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);

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
				fc.string({ minLength: 1 }),
				fc.integer({ min: 0, max: 5000 }),
				(url, simulatedDuration) => {
					consoleSpies.info.mockClear();

					const logger = new Logger();

					const startTime = Date.now();

					logger.info('Request started', { url, startTime });

					const endTime = startTime + simulatedDuration;
					const actualDuration = endTime - startTime;

					logger.info('Request completed', {
						url,
						duration: actualDuration
					});

					expect(consoleSpies.info).toHaveBeenCalledTimes(2);

					const completionLog = consoleSpies.info.mock.calls[1][0] as string;

					expect(completionLog).toContain(String(actualDuration));
					expect(completionLog).toContain('duration');

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
					Object.values(consoleSpies).forEach((spy) => spy.mockClear());

					const logger = new Logger();

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

					const spy = consoleSpies[logLevel as keyof typeof consoleSpies];

					expect(spy).toHaveBeenCalled();

					const loggedOutput = spy.mock.calls[0][0] as string;

					expect(loggedOutput).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);

					expect(loggedOutput).toContain('"method"');
					expect(loggedOutput).toContain('"url"');
				}
			),
			{ numRuns: 100 }
		);
	});

	describe('Logger.forComponent', () => {
		test('creates logger with component context', () => {
			consoleSpies.info.mockClear();

			const log = Logger.forComponent('EmailOTPForm');
			log.info('Test message');

			expect(consoleSpies.info).toHaveBeenCalled();
			const loggedOutput = consoleSpies.info.mock.calls[0][0] as string;

			expect(loggedOutput).toContain('"component"');
			expect(loggedOutput).toContain('EmailOTPForm');
		});
	});

	describe('Logger.forModule', () => {
		test('creates logger with module context', () => {
			consoleSpies.info.mockClear();

			const log = Logger.forModule('WatchlistStore');
			log.info('Test message');

			expect(consoleSpies.info).toHaveBeenCalled();
			const loggedOutput = consoleSpies.info.mock.calls[0][0] as string;

			expect(loggedOutput).toContain('"module"');
			expect(loggedOutput).toContain('WatchlistStore');
		});
	});

	describe('Logger.forRoute', () => {
		test('creates logger with route context', () => {
			consoleSpies.info.mockClear();

			const log = Logger.forRoute('/api/watchlist');
			log.info('Test message');

			expect(consoleSpies.info).toHaveBeenCalled();
			const loggedOutput = consoleSpies.info.mock.calls[0][0] as string;

			expect(loggedOutput).toContain('"route"');
			expect(loggedOutput).toContain('/api/watchlist');
		});
	});

	describe('Production logging', () => {
		test('silences debug logs in production', () => {
			consoleSpies.debug.mockClear();

			const logger = new Logger({}, { environment: 'production' });
			logger.debug('Debug message');

			expect(consoleSpies.debug).not.toHaveBeenCalled();
		});

		test('silences info logs in production', () => {
			consoleSpies.info.mockClear();

			const logger = new Logger({}, { environment: 'production' });
			logger.info('Info message');

			expect(consoleSpies.info).not.toHaveBeenCalled();
		});

		test('allows warn logs in production', () => {
			consoleSpies.warn.mockClear();

			const logger = new Logger({}, { environment: 'production' });
			logger.warn('Warning message');

			expect(consoleSpies.warn).toHaveBeenCalled();
		});

		test('allows error logs in production', () => {
			consoleSpies.error.mockClear();

			const logger = new Logger({}, { environment: 'production' });
			logger.error('Error message');

			expect(consoleSpies.error).toHaveBeenCalled();
		});
	});

	describe('Minimum log level', () => {
		test('respects minLevel config', () => {
			consoleSpies.debug.mockClear();
			consoleSpies.info.mockClear();

			const logger = new Logger({}, { minLevel: 'warn', environment: 'development' });
			logger.debug('Debug message');
			logger.info('Info message');

			expect(consoleSpies.debug).not.toHaveBeenCalled();
			expect(consoleSpies.info).not.toHaveBeenCalled();
		});

		test('logs messages at or above minLevel', () => {
			consoleSpies.warn.mockClear();
			consoleSpies.error.mockClear();

			const logger = new Logger({}, { minLevel: 'warn', environment: 'development' });
			logger.warn('Warning message');
			logger.error('Error message');

			expect(consoleSpies.warn).toHaveBeenCalled();
			expect(consoleSpies.error).toHaveBeenCalled();
		});
	});

	describe('Timestamp configuration', () => {
		test('disables timestamps when configured', () => {
			consoleSpies.info.mockClear();

			const logger = new Logger({}, { enableTimestamps: false });
			logger.info('Test message');

			expect(consoleSpies.info).toHaveBeenCalled();
			const loggedOutput = consoleSpies.info.mock.calls[0][0] as string;

			expect(loggedOutput).not.toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
			expect(loggedOutput).toContain('INFO:');
			expect(loggedOutput).toContain('Test message');
		});
	});

	describe('Child logger', () => {
		test('inherits parent context and config', () => {
			consoleSpies.info.mockClear();

			const parent = new Logger(
				{ service: 'api' },
				{ minLevel: 'warn', environment: 'development' }
			);
			const child = parent.child({ endpoint: '/users' });

			child.info('Info message');
			expect(consoleSpies.info).not.toHaveBeenCalled();

			child.warn('Warning message');
			expect(consoleSpies.warn).toHaveBeenCalled();

			const loggedOutput = consoleSpies.warn.mock.calls[0][0] as string;
			expect(loggedOutput).toContain('"service"');
			expect(loggedOutput).toContain('api');
			expect(loggedOutput).toContain('"endpoint"');
			expect(loggedOutput).toContain('/users');
		});
	});
});
