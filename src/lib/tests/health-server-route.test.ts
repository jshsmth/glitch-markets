/**
 * Integration tests for /api/health server route
 * Tests against real Polymarket APIs
 */

import { describe, it, expect } from 'vitest';

// Import the GET handler
const { GET } = await import('../../routes/api/health/+server');

describe('GET /api/health', () => {
	it('returns 200 when services are healthy', async () => {
		const response = await GET();
		const data = await response.json();

		// Should return 200 if services are up (most likely case)
		// or 503 if services are down
		expect([200, 503]).toContain(response.status);

		// Response structure should match HealthResponse
		expect(data).toHaveProperty('status');
		expect(data).toHaveProperty('timestamp');
		expect(data).toHaveProperty('services');
		expect(data.services).toHaveProperty('gamma');
		expect(data.services).toHaveProperty('data');

		// Status should be one of the valid values
		expect(['ok', 'degraded', 'down']).toContain(data.status);

		// Service statuses should be valid
		expect(['ok', 'down']).toContain(data.services.gamma.status);
		expect(['ok', 'down']).toContain(data.services.data.status);

		// Response times should be numbers or null
		if (data.services.gamma.responseTime !== null) {
			expect(typeof data.services.gamma.responseTime).toBe('number');
			expect(data.services.gamma.responseTime).toBeGreaterThanOrEqual(0);
		}

		if (data.services.data.responseTime !== null) {
			expect(typeof data.services.data.responseTime).toBe('number');
			expect(data.services.data.responseTime).toBeGreaterThanOrEqual(0);
		}
	});

	it('includes timestamp in ISO 8601 format', async () => {
		const response = await GET();
		const data = await response.json();

		expect(data.timestamp).toBeDefined();
		expect(typeof data.timestamp).toBe('string');

		// Verify it's a valid ISO 8601 date
		const date = new Date(data.timestamp);
		expect(date.toISOString()).toBe(data.timestamp);

		// Timestamp should be recent (within last 10 seconds)
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		expect(diff).toBeLessThan(10000);
	});

	it('sets no-cache headers', async () => {
		const response = await GET();

		const cacheControl = response.headers.get('Cache-Control');
		expect(cacheControl).toBeDefined();
		expect(cacheControl).toContain('no-store');
		expect(cacheControl).toContain('no-cache');
		expect(cacheControl).toContain('must-revalidate');

		const pragma = response.headers.get('Pragma');
		expect(pragma).toBe('no-cache');

		const expires = response.headers.get('Expires');
		expect(expires).toBe('0');
	});

	it('completes in reasonable time', async () => {
		const startTime = Date.now();
		await GET();
		const duration = Date.now() - startTime;

		// Should complete in <6s (includes 5s timeout per service)
		expect(duration).toBeLessThan(6000);
	});

	it('status matches HTTP status code', async () => {
		const response = await GET();
		const data = await response.json();

		if (data.status === 'ok') {
			expect(response.status).toBe(200);
		} else {
			// degraded or down
			expect(response.status).toBe(503);
		}
	});

	it('overall status reflects individual service statuses', async () => {
		const response = await GET();
		const data = await response.json();

		const gammaOk = data.services.gamma.status === 'ok';
		const dataOk = data.services.data.status === 'ok';

		if (gammaOk && dataOk) {
			expect(data.status).toBe('ok');
		} else if (!gammaOk && !dataOk) {
			expect(data.status).toBe('down');
		} else {
			expect(data.status).toBe('degraded');
		}
	});
});
