/**
 * Server-side hooks for SvelteKit
 * Includes rate limiting to protect against abuse
 */

import type { Handle } from '@sveltejs/kit';
import { Logger } from '$lib/server/utils/logger';

const logger = new Logger({ component: 'ServerHooks' });

// Rate limiting configuration
interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Max requests per window
}

// In-memory store for rate limiting (use Redis in production for multi-instance deploys)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Different rate limits for different route types
const RATE_LIMITS: Record<string, RateLimitConfig> = {
	'/api/markets': { windowMs: 60000, maxRequests: 100 }, // 100 requests per minute
	'/api/events': { windowMs: 60000, maxRequests: 100 }, // 100 requests per minute
	default: { windowMs: 60000, maxRequests: 60 } // 60 requests per minute for all other routes
};

/**
 * Get client identifier from request
 * Uses IP address, with fallback to forwarded headers
 */
function getClientId(request: Request): string {
	// Try various headers that might contain the client IP
	const forwardedFor = request.headers.get('x-forwarded-for');
	const realIp = request.headers.get('x-real-ip');
	const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare

	return (
		cfConnectingIp || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : '') || 'unknown'
	);
}

/**
 * Get rate limit config for a given pathname
 */
function getRateLimitConfig(pathname: string): RateLimitConfig {
	// Check for exact matches first
	if (RATE_LIMITS[pathname]) {
		return RATE_LIMITS[pathname];
	}

	// Check for prefix matches
	for (const [route, config] of Object.entries(RATE_LIMITS)) {
		if (route !== 'default' && pathname.startsWith(route)) {
			return config;
		}
	}

	return RATE_LIMITS.default;
}

/**
 * Check if request should be rate limited
 * Returns true if request should be blocked
 */
function isRateLimited(clientId: string, pathname: string): boolean {
	const config = getRateLimitConfig(pathname);
	const key = `${clientId}:${pathname}`;
	const now = Date.now();

	const record = rateLimitStore.get(key);

	if (!record || now > record.resetTime) {
		// First request or window expired - create new record
		rateLimitStore.set(key, {
			count: 1,
			resetTime: now + config.windowMs
		});
		return false;
	}

	// Increment count
	record.count++;

	// Check if limit exceeded
	if (record.count > config.maxRequests) {
		return true;
	}

	return false;
}

/**
 * Clean up expired rate limit records periodically
 * This prevents memory leaks from abandoned client IDs
 */
function cleanupRateLimitStore(): void {
	const now = Date.now();
	let cleaned = 0;

	for (const [key, record] of rateLimitStore.entries()) {
		if (now > record.resetTime) {
			rateLimitStore.delete(key);
			cleaned++;
		}
	}

	if (cleaned > 0) {
		logger.info(`Cleaned up ${cleaned} expired rate limit records`);
	}
}

// Clean up every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

/**
 * Main request handler with rate limiting
 */
export const handle: Handle = async ({ event, resolve }) => {
	const { url, request } = event;

	// Only rate limit API routes
	if (url.pathname.startsWith('/api/')) {
		const clientId = getClientId(request);

		if (isRateLimited(clientId, url.pathname)) {
			logger.warn('Rate limit exceeded', { clientId, pathname: url.pathname });

			return new Response(
				JSON.stringify({
					error: 'RATE_LIMIT_EXCEEDED',
					message: 'Too many requests. Please try again later.',
					statusCode: 429
				}),
				{
					status: 429,
					headers: {
						'Content-Type': 'application/json',
						'Retry-After': '60' // Suggest retry after 60 seconds
					}
				}
			);
		}
	}

	const response = await resolve(event);
	return response;
};
