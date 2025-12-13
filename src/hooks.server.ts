/**
 * Server-side hooks for SvelteKit
 * Includes rate limiting and Supabase Auth
 */

import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { Logger } from '$lib/server/utils/logger';
import { createSupabaseServerClient } from '$lib/supabase/server';

const logger = new Logger({ component: 'ServerHooks' });

interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxRequests: number;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Prevent memory exhaustion by limiting the number of rate limit entries
const MAX_RATE_LIMIT_ENTRIES = 10000;

const RATE_LIMITS: Record<string, RateLimitConfig> = {
	'/api/markets': { windowMs: 60000, maxRequests: 100 },
	'/api/events': { windowMs: 60000, maxRequests: 100 },
	default: { windowMs: 60000, maxRequests: 60 }
};

function getClientId(request: Request): string {
	const forwardedFor = request.headers.get('x-forwarded-for');
	const realIp = request.headers.get('x-real-ip');
	const cfConnectingIp = request.headers.get('cf-connecting-ip');

	return (
		cfConnectingIp || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : '') || 'unknown'
	);
}

function getRateLimitConfig(pathname: string): RateLimitConfig {
	if (RATE_LIMITS[pathname]) {
		return RATE_LIMITS[pathname];
	}

	for (const [route, config] of Object.entries(RATE_LIMITS)) {
		if (route !== 'default' && pathname.startsWith(route)) {
			return config;
		}
	}

	return RATE_LIMITS.default;
}

function isRateLimited(clientId: string, pathname: string): boolean {
	// Trigger cleanup if store gets too large
	if (rateLimitStore.size > MAX_RATE_LIMIT_ENTRIES) {
		logger.warn(`Rate limit store exceeded ${MAX_RATE_LIMIT_ENTRIES} entries, forcing cleanup`);
		cleanupRateLimitStore();
	}

	const config = getRateLimitConfig(pathname);
	const key = `${clientId}:${pathname}`;
	const now = Date.now();

	const record = rateLimitStore.get(key);

	if (!record || now > record.resetTime) {
		rateLimitStore.set(key, {
			count: 1,
			resetTime: now + config.windowMs
		});
		return false;
	}

	record.count++;

	if (record.count > config.maxRequests) {
		return true;
	}

	return false;
}

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

// Runs every 5 minutes to clean expired rate limit entries
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

const supabaseHandle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createSupabaseServerClient(event);

	/**
	 * Unlike getSession(), getUser() sends a request to the Supabase Auth server
	 * every time to revalidate the Auth token. This is important for security
	 * because the session from getSession() comes from cookies and could be spoofed.
	 *
	 * For performance, we only do this for API routes that need auth.
	 * The layout uses getSession() which is fine for non-sensitive UI rendering.
	 */
	const {
		data: { user },
		error: authError
	} = await event.locals.supabase.auth.getUser();

	if (!authError && user) {
		event.locals.user = {
			userId: user.id,
			email: user.email || '',
			walletAddress: '' // Will be fetched from database when needed
		};
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const rateLimitHandle: Handle = async ({ event, resolve }) => {
	const { url, request } = event;

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
						'Retry-After': '60'
					}
				}
			);
		}
	}

	const response = await resolve(event);

	response.headers.set(
		'Content-Security-Policy',
		"default-src 'self'; " +
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
			"style-src 'self' 'unsafe-inline'; " +
			"img-src 'self' data: https:; " +
			"font-src 'self' data:; " +
			"connect-src 'self' https://gamma-api.polymarket.com https://data-api.polymarket.com https://clob.polymarket.com https://*.supabase.co; " +
			"object-src 'none'; " +
			"base-uri 'self';"
	);

	return response;
};

export const handle = sequence(supabaseHandle, rateLimitHandle);
