/**
 * Fetch with timeout utility for server-side requests
 * Prevents server load functions from hanging indefinitely
 */

import { TIMEOUTS } from '$lib/config/constants';

/**
 * Fetches a resource with a timeout
 * @param input - URL or Request object
 * @param init - Fetch options
 * @param timeout - Timeout in milliseconds (default: 8 seconds)
 * @returns Response promise that rejects if timeout is reached
 * @throws AbortError if the request times out
 */
export async function fetchWithTimeout(
	input: RequestInfo | URL,
	init?: RequestInit,
	timeout: number = TIMEOUTS.SERVER_FETCH_TIMEOUT
): Promise<Response> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(input, {
			...init,
			signal: init?.signal || controller.signal
		});
		clearTimeout(timeoutId);
		return response;
	} catch (error) {
		clearTimeout(timeoutId);
		throw error;
	}
}
