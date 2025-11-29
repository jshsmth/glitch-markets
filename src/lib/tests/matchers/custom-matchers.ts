/**
 * Custom Vitest matchers for common test assertions
 * Improves test readability and reduces boilerplate
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-object-type */

import { expect } from 'vitest';

interface CustomMatchers<R = unknown> {
	toHaveCacheHeaders(maxAge: number): R;
	toBeValidationError(message?: string): R;
	toBeErrorResponse(statusCode: number, errorType: string): R;
	toBeNonEmptyArray(): R;
	toBeSuccessfulResponse(): R;
}

declare module 'vitest' {
	interface Assertion<T = any> extends CustomMatchers<T> {}
	interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
	/**
	 * Verify response has proper cache headers
	 *
	 * @example
	 * expect(response).toHaveCacheHeaders(60);
	 */
	toHaveCacheHeaders(response: Response, maxAge: number) {
		const cacheControl = response.headers.get('Cache-Control');
		const cdnCache = response.headers.get('CDN-Cache-Control');
		const vercelCache = response.headers.get('Vercel-CDN-Cache-Control');

		const expectedControl = `public, max-age=${maxAge}, s-maxage=${maxAge}`;
		const expectedCdn = `public, max-age=${maxAge}`;

		const pass =
			cacheControl === expectedControl && cdnCache === expectedCdn && vercelCache === expectedCdn;

		if (pass) {
			return {
				message: () =>
					`expected response NOT to have cache headers with max-age=${maxAge}\n` +
					`But found:\n` +
					`  Cache-Control: ${cacheControl}\n` +
					`  CDN-Cache-Control: ${cdnCache}\n` +
					`  Vercel-CDN-Cache-Control: ${vercelCache}`,
				pass: true
			};
		} else {
			return {
				message: () =>
					`expected response to have cache headers with max-age=${maxAge}\n` +
					`Expected:\n` +
					`  Cache-Control: ${expectedControl}\n` +
					`  CDN-Cache-Control: ${expectedCdn}\n` +
					`  Vercel-CDN-Cache-Control: ${expectedCdn}\n` +
					`Received:\n` +
					`  Cache-Control: ${cacheControl}\n` +
					`  CDN-Cache-Control: ${cdnCache}\n` +
					`  Vercel-CDN-Cache-Control: ${vercelCache}`,
				pass: false
			};
		}
	},

	/**
	 * Verify response is a validation error (400)
	 *
	 * @example
	 * const body = await response.json();
	 * expect(body).toBeValidationError();
	 * expect(body).toBeValidationError('limit must be positive');
	 */
	toBeValidationError(received: any, expectedMessage?: string) {
		const hasCorrectStatus = received.statusCode === 400;
		const hasCorrectError = received.error === 'VALIDATION_ERROR';
		const hasMessage = typeof received.message === 'string';
		const messageMatches = expectedMessage ? received.message?.includes(expectedMessage) : true;

		const pass = hasCorrectStatus && hasCorrectError && hasMessage && messageMatches;

		if (pass) {
			return {
				message: () =>
					`expected NOT to be validation error${expectedMessage ? ` with message containing "${expectedMessage}"` : ''}\n` +
					`But received:\n` +
					`  statusCode: ${received.statusCode}\n` +
					`  error: ${received.error}\n` +
					`  message: ${received.message}`,
				pass: true
			};
		} else {
			const issues: string[] = [];
			if (!hasCorrectStatus) issues.push(`statusCode was ${received.statusCode}, expected 400`);
			if (!hasCorrectError)
				issues.push(`error was "${received.error}", expected "VALIDATION_ERROR"`);
			if (!hasMessage) issues.push('message was not a string');
			if (!messageMatches)
				issues.push(`message "${received.message}" did not contain "${expectedMessage}"`);

			return {
				message: () =>
					`expected validation error response${expectedMessage ? ` with message containing "${expectedMessage}"` : ''}\n` +
					`Issues:\n  - ${issues.join('\n  - ')}\n` +
					`Received:\n${JSON.stringify(received, null, 2)}`,
				pass: false
			};
		}
	},

	/**
	 * Verify response matches specific error type and status code
	 *
	 * @example
	 * const body = await response.json();
	 * expect(body).toBeErrorResponse(503, 'TIMEOUT_ERROR');
	 */
	toBeErrorResponse(received: any, statusCode: number, errorType: string) {
		const hasCorrectStatus = received.statusCode === statusCode;
		const hasCorrectError = received.error === errorType;
		const hasMessage = typeof received.message === 'string';
		const hasTimestamp = typeof received.timestamp === 'string';

		const pass = hasCorrectStatus && hasCorrectError && hasMessage && hasTimestamp;

		if (pass) {
			return {
				message: () =>
					`expected NOT to be ${errorType} error with status ${statusCode}\n` +
					`But received:\n` +
					`  statusCode: ${received.statusCode}\n` +
					`  error: ${received.error}`,
				pass: true
			};
		} else {
			const issues: string[] = [];
			if (!hasCorrectStatus)
				issues.push(`statusCode was ${received.statusCode}, expected ${statusCode}`);
			if (!hasCorrectError) issues.push(`error was "${received.error}", expected "${errorType}"`);
			if (!hasMessage) issues.push('message was not a string');
			if (!hasTimestamp) issues.push('timestamp was not a string');

			return {
				message: () =>
					`expected ${errorType} error with status ${statusCode}\n` +
					`Issues:\n  - ${issues.join('\n  - ')}\n` +
					`Received:\n${JSON.stringify(received, null, 2)}`,
				pass: false
			};
		}
	},

	/**
	 * Verify value is a non-empty array
	 *
	 * @example
	 * expect(data).toBeNonEmptyArray();
	 */
	toBeNonEmptyArray(received: any) {
		const isArray = Array.isArray(received);
		const hasLength = isArray && received.length > 0;

		const pass = isArray && hasLength;

		if (pass) {
			return {
				message: () =>
					`expected NOT to be non-empty array\n` +
					`But received array with ${received.length} items`,
				pass: true
			};
		} else {
			if (!isArray) {
				return {
					message: () =>
						`expected non-empty array\n` +
						`Received: ${typeof received} - ${JSON.stringify(received)}`,
					pass: false
				};
			} else {
				return {
					message: () => `expected non-empty array\n` + `Received empty array`,
					pass: false
				};
			}
		}
	},

	/**
	 * Verify response is a successful 200 response with JSON body
	 *
	 * @example
	 * expect(response).toBeSuccessfulResponse();
	 */
	toBeSuccessfulResponse(response: Response) {
		const hasCorrectStatus = response.status === 200;
		const contentType = response.headers.get('Content-Type');
		const isJson = contentType?.includes('application/json') ?? false;

		const pass = hasCorrectStatus && isJson;

		if (pass) {
			return {
				message: () =>
					`expected NOT to be successful JSON response\n` +
					`But received:\n` +
					`  status: ${response.status}\n` +
					`  content-type: ${contentType}`,
				pass: true
			};
		} else {
			const issues: string[] = [];
			if (!hasCorrectStatus) issues.push(`status was ${response.status}, expected 200`);
			if (!isJson)
				issues.push(`content-type was "${contentType}", expected to include "application/json"`);

			return {
				message: () =>
					`expected successful JSON response\n` +
					`Issues:\n  - ${issues.join('\n  - ')}\n` +
					`Received:\n` +
					`  status: ${response.status}\n` +
					`  content-type: ${contentType}`,
				pass: false
			};
		}
	}
});
