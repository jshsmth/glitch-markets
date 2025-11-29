/**
 * Server-side hooks for SvelteKit
 * Includes rate limiting and JWT authentication
 */

import type { Handle } from '@sveltejs/kit';
import { Logger } from '$lib/server/utils/logger';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { DYNAMIC_ENVIRONMENT_ID } from '$env/static/private';

const logger = new Logger({ component: 'ServerHooks' });

const JWKS = createRemoteJWKSet(
	new URL(`https://app.dynamic.xyz/api/v0/sdk/${DYNAMIC_ENVIRONMENT_ID}/.well-known/jwks`)
);

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

let cleanupInterval: NodeJS.Timeout | null = null;

if (cleanupInterval) {
	clearInterval(cleanupInterval);
}

cleanupInterval = setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

async function verifyJWT(request: Request): Promise<{
	userId: string;
	walletAddress: string;
	email: string;
} | null> {
	const authHeader = request.headers.get('authorization');

	if (!authHeader?.startsWith('Bearer ')) {
		return null;
	}

	const token = authHeader.slice(7);

	try {
		const { payload } = await jwtVerify(token, JWKS, {
			algorithms: ['RS256']
		});

		const verifiedCredentials = payload.verified_credentials as
			| Array<{ address?: string }>
			| undefined;

		return {
			userId: payload.sub as string,
			walletAddress: (verifiedCredentials?.[0]?.address || payload.wallet_address) as string,
			email: payload.email as string
		};
	} catch (error) {
		logger.warn('JWT verification failed', { error });
		return null;
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const { url, request } = event;

	if (
		url.pathname.startsWith('/api/auth/') ||
		url.pathname.startsWith('/api/polymarket/') ||
		url.pathname.startsWith('/api/wallet/') ||
		url.pathname.startsWith('/api/user/')
	) {
		const user = await verifyJWT(request);
		if (user) {
			event.locals.user = user;
		}
	}

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
			"connect-src 'self' https://gamma-api.polymarket.com https://data-api.polymarket.com https://clob.polymarket.com https://app.dynamic.xyz https://app.dynamicauth.com https://*.dynamic.xyz https://*.dynamicauth.com wss://ws-subscriptions-clob.polymarket.com; " +
			"frame-src 'self' https://app.dynamicauth.com https://*.dynamicauth.com; " +
			"object-src 'none'; " +
			"base-uri 'self';"
	);

	return response;
};
