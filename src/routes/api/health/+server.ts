/**
 * SvelteKit server route for health check endpoint
 * GET /api/health
 *
 * Checks the health of upstream Polymarket APIs (Gamma and Data)
 * Returns overall health status with individual service response times
 */

import { json } from '@sveltejs/kit';
import { Logger } from '$lib/server/utils/logger.js';

const logger = new Logger({ component: 'HealthRoute' });

// Upstream API URLs
// Note: Gamma API doesn't have a dedicated health endpoint, so we check /markets with limit=1
const GAMMA_API_URL = 'https://gamma-api.polymarket.com/markets?limit=1';
const DATA_API_URL = 'https://data-api.polymarket.com/';
const TIMEOUT_MS = 5000;

/**
 * Health status for an individual service
 */
interface ServiceHealth {
	status: 'ok' | 'down';
	responseTime: number | null;
}

/**
 * Overall health check response
 */
interface HealthResponse {
	status: 'ok' | 'degraded' | 'down';
	timestamp: string;
	services: {
		gamma: ServiceHealth;
		data: ServiceHealth;
	};
}

/**
 * Checks health of a single upstream service
 *
 * @param url - The URL to check
 * @param name - Service name for logging
 * @returns ServiceHealth object with status and response time
 */
async function checkService(url: string, name: string): Promise<ServiceHealth> {
	const startTime = Date.now();

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

		const response = await fetch(url, {
			method: 'GET',
			signal: controller.signal,
			headers: { Accept: 'application/json' }
		});

		clearTimeout(timeoutId);
		const responseTime = Date.now() - startTime;

		if (response.ok) {
			const data = await response.json();
			// Data API returns {"data":"OK"}, Gamma API returns array of markets
			const isHealthy = data?.data === 'OK' || (Array.isArray(data) && data.length >= 0);
			if (isHealthy) {
				return { status: 'ok', responseTime };
			}
		}

		logger.warn(`Service ${name} returned unexpected response`, {
			status: response.status,
			responseTime
		});

		return { status: 'down', responseTime };
	} catch (error) {
		const responseTime = Date.now() - startTime;

		logger.error(`Service ${name} health check failed`, error, { responseTime });

		return { status: 'down', responseTime: responseTime < TIMEOUT_MS ? responseTime : null };
	}
}

/**
 * GET handler for /api/health
 * Checks health of upstream Polymarket APIs and returns status
 */
export async function GET() {
	const startTime = Date.now();

	try {
		const [gammaHealth, dataHealth] = await Promise.all([
			checkService(GAMMA_API_URL, 'gamma'),
			checkService(DATA_API_URL, 'data')
		]);

		const allOk = gammaHealth.status === 'ok' && dataHealth.status === 'ok';
		const allDown = gammaHealth.status === 'down' && dataHealth.status === 'down';

		const overallStatus: 'ok' | 'degraded' | 'down' = allOk ? 'ok' : allDown ? 'down' : 'degraded';

		const response: HealthResponse = {
			status: overallStatus,
			timestamp: new Date().toISOString(),
			services: {
				gamma: gammaHealth,
				data: dataHealth
			}
		};

		const duration = Date.now() - startTime;

		logger.info('Health check completed', {
			status: overallStatus,
			duration,
			gamma: gammaHealth.responseTime,
			data: dataHealth.responseTime
		});

		const statusCode = overallStatus === 'ok' ? 200 : 503;

		return json(response, {
			status: statusCode,
			headers: {
				// No caching - health status should be real-time
				'Cache-Control': 'no-store, no-cache, must-revalidate',
				Pragma: 'no-cache',
				Expires: '0'
			}
		});
	} catch (error) {
		// Catch-all for unexpected errors (should be rare)
		logger.error('Unexpected error in health check', error);

		const response: HealthResponse = {
			status: 'down',
			timestamp: new Date().toISOString(),
			services: {
				gamma: { status: 'down', responseTime: null },
				data: { status: 'down', responseTime: null }
			}
		};

		return json(response, { status: 503 });
	}
}
