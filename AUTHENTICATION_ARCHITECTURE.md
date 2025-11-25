# Authentication System Architecture

**Project**: Glitch Markets
**Last Updated**: 2025-11-25
**Approach**: Simplified Polymarket Integration

This document describes the authentication system integrating Dynamic Wallet SDK with Polymarket CLOB API authentication.

> **⚠️ Important Update (2025-11-25):**
>
> - Added `@dynamic-labs-sdk/evm` package requirement (needed for Viem wallet client)
> - Fixed JWKS endpoint URL to include environment ID: `https://app.dynamic.xyz/api/v0/sdk/${ENV_ID}/.well-known/jwks`
> - All code examples updated with correct implementation details

---

## Table of Contents

- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [Key Implementation Steps](#key-implementation-steps)
- [Frontend Components](#frontend-components)
- [Backend Components](#backend-components)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Security Considerations](#security-considerations)
- [Implementation Checklist](#implementation-checklist)

---

## Overview

The authentication system uses Dynamic.xyz for user authentication and embedded MPC wallets. Users sign a one-time message to authorize their Polymarket proxy wallet, which generates CLOB API credentials that are stored for future trades.

**Key Features**:

- Multiple authentication methods (email + OTP, social login)
- Non-custodial MPC wallets for users (auto-created)
- One-time Polymarket authorization signature
- Secure CLOB API credential storage
- JWT-based API authentication
- No complex delegation infrastructure needed

**Note**: Branded wallets (MetaMask, Phantom, etc.) disabled for now - can be added later.

**Why This Approach**:

- ✅ Much simpler than wallet delegation
- ✅ Standard Polymarket authentication flow
- ✅ User signs once, trades forever
- ✅ No webhook handlers or key share encryption needed
- ✅ Follows Polymarket best practices

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (SvelteKit)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  1. User Authentication Flow                                         │   │
│  │                                                                       │   │
│  │  ┌────────────┐    ┌──────────────┐                                 │   │
│  │  │   Email    │───▶│  Social      │                                 │   │
│  │  │   + OTP    │    │  (Google,    │                                 │   │
│  │  └────────────┘    │   Twitter)   │                                 │   │
│  │                    └──────────────┘                                  │   │
│  │                           │                                           │   │
│  │                           ▼                                           │   │
│  │         ┌─────────────────────────────────────────┐                  │   │
│  │         │  Dynamic User Created with Embedded     │                  │   │
│  │         │  Wallet (Auto-Created via Dashboard)    │                  │   │
│  │         │                                          │                  │   │
│  │         │  Dashboard: "Create on Sign up" ✓       │                  │   │
│  │         └───────────────┬─────────────────────────┘                  │   │
│  └────────────────────────────┼─────────────────────────────────────────┘   │
│                               │                                              │
│                               │ Send JWT to backend                          │
│                               │                                              │
│  ┌────────────────────────────▼─────────────────────────────────────────┐   │
│  │  2. User Registration in YOUR Database                               │   │
│  │                                                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │  POST /api/auth/register                                     │   │   │
│  │  │                                                               │   │   │
│  │  │  Backend verifies JWT → Extracts user info                   │   │   │
│  │  │  → Creates/updates user in YOUR database                     │   │   │
│  │  │                                                               │   │   │
│  │  │  Store: userId, email, walletAddress, createdAt              │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                               │                                      │   │
│  │                               ▼                                      │   │
│  │              ┌────────────────────────────┐                          │   │
│  │              │  User exists in database   │                          │   │
│  │              └────────────┬───────────────┘                          │   │
│  └────────────────────────────┼──────────────────────────────────────────   │
│                               │                                              │
│  ┌────────────────────────────▼─────────────────────────────────────────┐   │
│  │  3. Polymarket Authorization (ONE-TIME)                              │   │
│  │     (Only available AFTER user is registered in your database)       │   │
│  │                                                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │  User clicks "Enable Trading"                                │   │   │
│  │  │                                                               │   │   │
│  │  │  // Get wallet client from Dynamic                           │   │   │
│  │  │  const walletClient = await getWalletClient();               │   │   │
│  │  │                                                               │   │   │
│  │  │  // Sign Polymarket authorization message                    │   │   │
│  │  │  const message = "I authorize Glitch Markets...";            │   │   │
│  │  │  const signature = await walletClient.signMessage({          │   │   │
│  │  │    message                                                    │   │   │
│  │  │  });                                                          │   │   │
│  │  │                                                               │   │   │
│  │  │  // Send to backend                                          │   │   │
│  │  │  await fetch('/api/polymarket/register', {                   │   │   │
│  │  │    method: 'POST',                                           │   │   │
│  │  │    headers: {                                                │   │   │
│  │  │      'Authorization': `Bearer ${dynamicClient.token}`        │   │   │
│  │  │    },                                                         │   │   │
│  │  │    body: JSON.stringify({                                    │   │   │
│  │  │      signature,                                              │   │   │
│  │  │      walletAddress                                           │   │   │
│  │  │    })                                                         │   │   │
│  │  │  });                                                          │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  4. Client State Management                                          │   │
│  │                                                                       │   │
│  │  ┌──────────────────────────────────────┐                           │   │
│  │  │  • dynamicClient.isSignedIn()         │                           │   │
│  │  │  • dynamicClient.user                 │                           │   │
│  │  │  • dynamicClient.token (JWT)          │                           │   │
│  │  │  • getWalletAccounts()                │                           │   │
│  │  │  • getBalance()                       │                           │   │
│  │  └──────────────────────────────────────┘                           │   │
│  └───────────────────────────────────────────────────────────────────────   │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      │ HTTP Requests
                                      │ Authorization: Bearer <JWT>
                                      │
┌─────────────────────────────────────▼───────────────────────────────────────┐
│                         BACKEND (SvelteKit Server)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  4. JWT Verification (hooks.server.ts)                               │   │
│  │                                                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │  import { jwtVerify, createRemoteJWKSet } from 'jose';       │   │   │
│  │  │                                                               │   │   │
│  │  │  // JWKS auto-fetches and caches public keys                │   │   │
│  │  │  const JWKS = createRemoteJWKSet(                            │   │   │
│  │  │    new URL('https://app.dynamic.xyz/.well-known/jwks')      │   │   │
│  │  │  );                                                           │   │   │
│  │  │                                                               │   │   │
│  │  │  // Verify JWT from Authorization header                    │   │   │
│  │  │  const token = event.request.headers                         │   │   │
│  │  │                 .get('authorization')?.split(' ')[1];        │   │   │
│  │  │  const { payload } = await jwtVerify(token, JWKS, {          │   │   │
│  │  │    algorithms: ['RS256']                                     │   │   │
│  │  │  });                                                          │   │   │
│  │  │                                                               │   │   │
│  │  │  // Store user info in event.locals                         │   │   │
│  │  │  event.locals.user = {                                       │   │   │
│  │  │    userId: payload.sub,                                      │   │   │
│  │  │    walletAddress: payload.wallet_address,                    │   │   │
│  │  │    email: payload.email                                      │   │   │
│  │  │  };                                                           │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────────────────────   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  5. Polymarket Registration Endpoint                                 │   │
│  │     POST /api/polymarket/register                                    │   │
│  │                                                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │  export async function POST({ request, locals }) {           │   │   │
│  │  │    const { signature, walletAddress } = await request.json();│   │   │
│  │  │    const userId = locals.user.userId;                        │   │   │
│  │  │                                                               │   │   │
│  │  │    // 1. Register with Polymarket CLOB                       │   │   │
│  │  │    const response = await fetch(                             │   │   │
│  │  │      'https://clob.polymarket.com/auth/api-key',             │   │   │
│  │  │      {                                                        │   │   │
│  │  │        method: 'POST',                                       │   │   │
│  │  │        headers: { 'Content-Type': 'application/json' },      │   │   │
│  │  │        body: JSON.stringify({                                │   │   │
│  │  │          address: walletAddress,                             │   │   │
│  │  │          signature: signature,                               │   │   │
│  │  │          timestamp: Date.now()                               │   │   │
│  │  │        })                                                     │   │   │
│  │  │      }                                                        │   │   │
│  │  │    );                                                         │   │   │
│  │  │                                                               │   │   │
│  │  │    const { apiKey, secret, passphrase } =                    │   │   │
│  │  │             await response.json();                           │   │   │
│  │  │                                                               │   │   │
│  │  │    // 2. Store credentials in database (encrypted)           │   │   │
│  │  │    await db.insert(polymarketCredentials).values({           │   │   │
│  │  │      userId,                                                 │   │   │
│  │  │      walletAddress,                                          │   │   │
│  │  │      encryptedApiKey: encrypt(apiKey),                       │   │   │
│  │  │      encryptedSecret: encrypt(secret),                       │   │   │
│  │  │      encryptedPassphrase: encrypt(passphrase),               │   │   │
│  │  │      createdAt: new Date()                                   │   │   │
│  │  │    });                                                        │   │   │
│  │  │                                                               │   │   │
│  │  │    return json({ success: true });                           │   │   │
│  │  │  }                                                            │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────────────────────   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW COMPLETE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  User is now authenticated and registered with Polymarket!                   │
│                                                                               │
│  ✅ Dynamic account created                                                  │
│  ✅ Embedded wallet auto-created                                             │
│  ✅ User record in YOUR database                                             │
│  ✅ Polymarket CLOB credentials stored (encrypted)                           │
│                                                                               │
│  Ready for trading! (Trading implementation is separate)                     │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE (PostgreSQL)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Table: users                                                        │   │
│  │                                                                       │   │
│  │  - id: text (primary key, from Dynamic)                              │   │
│  │  - email: text                                                       │   │
│  │  - wallet_address: text (not null)                                   │   │
│  │  - created_at: timestamp                                             │   │
│  │  - last_login_at: timestamp                                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Table: polymarket_credentials                                       │   │
│  │                                                                       │   │
│  │  - id: uuid (primary key)                                            │   │
│  │  - user_id: text (unique, references users.id)                       │   │
│  │  - wallet_address: text                                              │   │
│  │  - encrypted_api_key: text (AES-256 encrypted)                       │   │
│  │  - encrypted_secret: text (AES-256 encrypted)                        │   │
│  │  - encrypted_passphrase: text (AES-256 encrypted)                    │   │
│  │  - created_at: timestamp                                             │   │
│  │  - last_used_at: timestamp                                           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENVIRONMENT VARIABLES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  # Dynamic Configuration (Client)                                            │
│  PUBLIC_DYNAMIC_ENVIRONMENT_ID="your-environment-id"                         │
│                                                                               │
│  # Dynamic Configuration (Server)                                            │
│  DYNAMIC_ENVIRONMENT_ID="your-environment-id"                                │
│                                                                               │
│  # Encryption Keys (for storing Polymarket credentials)                      │
│  POLYMARKET_ENCRYPTION_KEY="32-byte-key-for-aes-256"                         │
│                                                                               │
│  # Polymarket Configuration                                                  │
│  POLYMARKET_CLOB_URL="https://clob.polymarket.com"                           │
│  POLYMARKET_GAMMA_API_URL="https://gamma-api.polymarket.com"                 │
│                                                                               │
│  # Database                                                                  │
│  DATABASE_URL="postgres://root:password@localhost:5432/local"                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Implementation Steps

### 1. Install Required Packages

```bash
# Client-side
npm install @dynamic-labs-sdk/client @dynamic-labs-sdk/evm

# Server-side JWT verification (NO node-evm package needed!)
npm install jose

# Already have viem for wallet client operations
```

**Packages explained:**

- `@dynamic-labs-sdk/client` - Main SDK for authentication, user management, wallet accounts
- `@dynamic-labs-sdk/evm` - Viem wallet client integration (provides `createWalletClientForWalletAccount`)
- `jose` - Modern JWT verification library (alternative to jsonwebtoken + jwks-rsa)
- `viem` - Already installed for blockchain operations

### 2. Frontend Setup

**Important**: Enable "Create on Sign up" in your Dynamic dashboard. Embedded wallets are created automatically when users authenticate.

Create Dynamic provider wrapper in `src/routes/+layout.svelte`:

```svelte
<script lang="ts">
	import { createDynamicClient } from '@dynamic-labs-sdk/client';
	import { browser } from '$app/environment';

	let dynamicClient;

	if (browser) {
		dynamicClient = createDynamicClient({
			environmentId: import.meta.env.PUBLIC_DYNAMIC_ENVIRONMENT_ID,
			metadata: {
				name: 'Glitch Markets',
				url: 'https://glitch-markets.com',
				iconUrl: 'https://glitch-markets.com/icon.png'
			}
		});
	}
</script>

{#if browser && dynamicClient}
	<DynamicProvider client={dynamicClient}>
		<slot />
	</DynamicProvider>
{:else}
	<slot />
{/if}
```

### 3. Backend Setup

#### JWT Verification in `src/hooks.server.ts`

```typescript
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Create JWKS client that automatically fetches and caches public keys
// IMPORTANT: Replace ${DYNAMIC_ENVIRONMENT_ID} with your actual environment ID
const JWKS = createRemoteJWKSet(
	new URL(
		`https://app.dynamic.xyz/api/v0/sdk/${process.env.DYNAMIC_ENVIRONMENT_ID}/.well-known/jwks`
	)
);

export async function handle({ event, resolve }) {
	// Extract JWT from Authorization header
	const authHeader = event.request.headers.get('authorization');

	if (authHeader?.startsWith('Bearer ')) {
		const token = authHeader.slice(7);

		try {
			// Verify JWT with jose (handles key fetching, caching, and verification)
			const { payload } = await jwtVerify(token, JWKS, {
				algorithms: ['RS256']
			});

			// Store user info in locals
			event.locals.user = {
				userId: payload.sub as string,
				walletAddress: payload.wallet_address as string,
				email: payload.email as string
			};
		} catch (error) {
			console.error('JWT verification failed:', error);
		}
	}

	return resolve(event);
}
```

#### User Registration Endpoint

Create `src/routes/api/auth/register/+server.ts`:

```typescript
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST({ locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { userId, email, walletAddress } = locals.user;

	// Create or update user in your database
	const existingUser = await db.query.users.findFirst({
		where: eq(users.id, userId)
	});

	if (existingUser) {
		// Update last login
		await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
	} else {
		// Create new user
		await db.insert(users).values({
			id: userId,
			email,
			walletAddress,
			createdAt: new Date(),
			lastLoginAt: new Date()
		});
	}

	return json({
		success: true,
		user: { userId, email, walletAddress }
	});
}
```

#### Polymarket Registration Endpoint

Create `src/routes/api/polymarket/register/+server.ts`:

```typescript
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { polymarketCredentials } from '$lib/server/db/schema';
import { encryptWithAES } from '$lib/server/utils/crypto';

export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { signature, walletAddress } = await request.json();
	const userId = locals.user.userId;

	// Check if already registered
	const existing = await db.query.polymarketCredentials.findFirst({
		where: eq(polymarketCredentials.userId, userId)
	});

	if (existing) {
		return json({ error: 'Already registered' }, { status: 400 });
	}

	// Register with Polymarket CLOB
	const response = await fetch(`${process.env.POLYMARKET_CLOB_URL}/auth/api-key`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			address: walletAddress,
			signature: signature,
			timestamp: Date.now()
		})
	});

	if (!response.ok) {
		return json({ error: 'Failed to register with Polymarket' }, { status: 500 });
	}

	const { apiKey, secret, passphrase } = await response.json();

	// Store encrypted credentials
	await db.insert(polymarketCredentials).values({
		userId,
		walletAddress,
		encryptedApiKey: encryptWithAES(apiKey),
		encryptedSecret: encryptWithAES(secret),
		encryptedPassphrase: encryptWithAES(passphrase),
		createdAt: new Date()
	});

	return json({ success: true });
}
```

---

## Frontend Components

### Polymarket Authorization Component

Create `src/lib/components/PolymarketAuth.svelte`:

```svelte
<script lang="ts">
	import { createWalletClientForWalletAccount } from '@dynamic-labs-sdk/evm/viem';
	import { dynamicClient } from '$lib/stores/auth'; // Your Dynamic client store

	let isRegistering = $state(false);
	let isRegistered = $state(false);
	let error = $state<string | null>(null);

	async function registerWithPolymarket() {
		isRegistering = true;
		error = null;

		try {
			// Get the user's wallet account
			const walletAccounts = dynamicClient.getWalletAccounts();
			if (!walletAccounts.length) {
				throw new Error('No wallet found');
			}

			const walletAccount = walletAccounts[0];
			const walletAddress = walletAccount.address;

			// Create Viem wallet client
			const walletClient = await createWalletClientForWalletAccount({
				walletAccount
			});

			// Create authorization message
			const message = `I authorize Glitch Markets to trade on my behalf.\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;

			// Request user signature
			const signature = await walletClient.signMessage({ message });

			// Send to backend
			const response = await fetch('/api/polymarket/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${dynamicClient.token}`
				},
				body: JSON.stringify({ signature, walletAddress })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Registration failed');
			}

			isRegistered = true;
		} catch (err) {
			error = err.message;
		} finally {
			isRegistering = false;
		}
	}

	// Check if already registered on mount
	async function checkRegistration() {
		try {
			const response = await fetch('/api/polymarket/status', {
				headers: {
					Authorization: `Bearer ${dynamicClient.token}`
				}
			});

			if (response.ok) {
				const data = await response.json();
				isRegistered = data.registered;
			}
		} catch (err) {
			console.error('Failed to check registration status:', err);
		}
	}

	$effect(() => {
		if (dynamicClient.isSignedIn()) {
			checkRegistration();
		}
	});
</script>

<div class="polymarket-auth">
	{#if isRegistered}
		<div class="success">✓ Ready to trade on Polymarket</div>
	{:else}
		<button onclick={registerWithPolymarket} disabled={isRegistering}>
			{isRegistering ? 'Authorizing...' : 'Enable Polymarket Trading'}
		</button>
	{/if}

	{#if error}
		<div class="error">{error}</div>
	{/if}
</div>

<style>
	.polymarket-auth {
		padding: 1rem;
	}

	button {
		background: var(--color-primary);
		color: white;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.success {
		color: var(--color-success);
		font-weight: 500;
	}

	.error {
		color: var(--color-error);
		margin-top: 0.5rem;
	}
</style>
```

---

## Backend Components

### Polymarket Trading Service (For Later - Not Part of Auth Flow)

**Note**: This is for actual trading operations and is NOT part of the authentication flow. You'll implement this when you work on trading features.

The trading service will use the stored Polymarket credentials to create/cancel orders. For reference, here's what it would look like:

<details>
<summary>Click to expand: Polymarket Trading Service (implement later)</summary>

Create `src/lib/server/services/polymarket-trading-service.ts`:

```typescript
import { db } from '$lib/server/db';
import { polymarketCredentials } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { decryptWithAES } from '$lib/server/utils/crypto';
import crypto from 'node:crypto';

interface OrderParams {
	tokenID: string;
	price: number;
	side: 'BUY' | 'SELL';
	size: number;
}

/**
 * Create HMAC signature for Polymarket CLOB API
 */
function createClobSignature(params: {
	secret: string;
	timestamp: number;
	method: string;
	path: string;
	body?: unknown;
}): string {
	const { secret, timestamp, method, path, body } = params;

	const bodyStr = body ? JSON.stringify(body) : '';
	const message = `${timestamp}${method}${path}${bodyStr}`;

	return crypto
		.createHmac('sha256', Buffer.from(secret, 'base64'))
		.update(message)
		.digest('base64');
}

/**
 * Get user's Polymarket credentials from database
 */
async function getUserCredentials(userId: string) {
	const creds = await db.query.polymarketCredentials.findFirst({
		where: eq(polymarketCredentials.userId, userId)
	});

	if (!creds) {
		throw new Error('User not registered with Polymarket');
	}

	return {
		apiKey: decryptWithAES(creds.encryptedApiKey),
		secret: decryptWithAES(creds.encryptedSecret),
		passphrase: decryptWithAES(creds.encryptedPassphrase),
		walletAddress: creds.walletAddress
	};
}

/**
 * Create an order on Polymarket
 */
export async function createOrder(userId: string, orderParams: OrderParams) {
	const credentials = await getUserCredentials(userId);

	const timestamp = Date.now();
	const path = '/order';
	const signature = createClobSignature({
		secret: credentials.secret,
		timestamp,
		method: 'POST',
		path,
		body: orderParams
	});

	const response = await fetch(`${process.env.POLYMARKET_CLOB_URL}${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'POLY-API-KEY': credentials.apiKey,
			'POLY-SIGNATURE': signature,
			'POLY-TIMESTAMP': timestamp.toString(),
			'POLY-PASSPHRASE': credentials.passphrase
		},
		body: JSON.stringify(orderParams)
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(`Order creation failed: ${error.message}`);
	}

	return response.json();
}

/**
 * Get user's open orders
 */
export async function getOpenOrders(userId: string) {
	const credentials = await getUserCredentials(userId);

	const timestamp = Date.now();
	const path = '/orders';
	const signature = createClobSignature({
		secret: credentials.secret,
		timestamp,
		method: 'GET',
		path
	});

	const response = await fetch(`${process.env.POLYMARKET_CLOB_URL}${path}`, {
		method: 'GET',
		headers: {
			'POLY-API-KEY': credentials.apiKey,
			'POLY-SIGNATURE': signature,
			'POLY-TIMESTAMP': timestamp.toString(),
			'POLY-PASSPHRASE': credentials.passphrase
		}
	});

	if (!response.ok) {
		throw new Error('Failed to fetch orders');
	}

	return response.json();
}

/**
 * Cancel an order
 */
export async function cancelOrder(userId: string, orderId: string) {
	const credentials = await getUserCredentials(userId);

	const timestamp = Date.now();
	const path = `/order/${orderId}`;
	const signature = createClobSignature({
		secret: credentials.secret,
		timestamp,
		method: 'DELETE',
		path
	});

	const response = await fetch(`${process.env.POLYMARKET_CLOB_URL}${path}`, {
		method: 'DELETE',
		headers: {
			'POLY-API-KEY': credentials.apiKey,
			'POLY-SIGNATURE': signature,
			'POLY-TIMESTAMP': timestamp.toString(),
			'POLY-PASSPHRASE': credentials.passphrase
		}
	});

	if (!response.ok) {
		throw new Error('Failed to cancel order');
	}

	return response.json();
}
```

</details>

### Encryption Utilities

Create `src/lib/server/utils/crypto.ts`:

```typescript
import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.POLYMARKET_ENCRYPTION_KEY!, 'hex');

export function encryptWithAES(text: string): string {
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

	let encrypted = cipher.update(text, 'utf8', 'hex');
	encrypted += cipher.final('hex');

	const authTag = cipher.getAuthTag();

	return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptWithAES(encrypted: string): string {
	const [ivHex, authTagHex, encryptedText] = encrypted.split(':');

	const iv = Buffer.from(ivHex, 'hex');
	const authTag = Buffer.from(authTagHex, 'hex');
	const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

	decipher.setAuthTag(authTag);

	let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
	decrypted += decipher.final('utf8');

	return decrypted;
}
```

---

## Database Schema

Add to `src/lib/server/db/schema.ts`:

```typescript
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

// Main users table - created BEFORE Polymarket registration
export const users = pgTable('users', {
	id: text('id').primaryKey(), // Dynamic user ID
	email: text('email'),
	walletAddress: text('wallet_address').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	lastLoginAt: timestamp('last_login_at').notNull().defaultNow()
});

// Polymarket credentials - requires user to exist first
export const polymarketCredentials = pgTable('polymarket_credentials', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => users.id),
	walletAddress: text('wallet_address').notNull(),
	encryptedApiKey: text('encrypted_api_key').notNull(),
	encryptedSecret: text('encrypted_secret').notNull(),
	encryptedPassphrase: text('encrypted_passphrase').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	lastUsedAt: timestamp('last_used_at')
});
```

Run migrations:

```bash
npm run db:generate
npm run db:push
```

---

## Environment Variables

Update `.env`:

```bash
# Dynamic Configuration (Client)
PUBLIC_DYNAMIC_ENVIRONMENT_ID="your-environment-id"

# Dynamic Configuration (Server)
DYNAMIC_ENVIRONMENT_ID="your-environment-id"

# Encryption Keys (for storing Polymarket credentials)
# Generate with: node -e "console.log(crypto.randomBytes(32).toString('hex'))"
POLYMARKET_ENCRYPTION_KEY="your-32-byte-hex-key"

# Polymarket Configuration
POLYMARKET_CLOB_URL="https://clob.polymarket.com"
POLYMARKET_GAMMA_API_URL="https://gamma-api.polymarket.com"

# Database
DATABASE_URL="postgres://root:mysecretpassword@localhost:5432/local"
```

Update `.env.example`:

```bash
# Dynamic Configuration (Client)
PUBLIC_DYNAMIC_ENVIRONMENT_ID="your-environment-id"

# Dynamic Configuration (Server)
DYNAMIC_ENVIRONMENT_ID="your-environment-id"

# Encryption Keys
POLYMARKET_ENCRYPTION_KEY="generate-with-crypto-randombytes"

# Polymarket Configuration
POLYMARKET_CLOB_URL="https://clob.polymarket.com"
POLYMARKET_GAMMA_API_URL="https://gamma-api.polymarket.com"

# Database
DATABASE_URL="postgres://root:mysecretpassword@localhost:5432/local"
```

---

## Security Considerations

### 1. Encryption at Rest

All Polymarket credentials **MUST** be encrypted using AES-256-GCM before storing in the database:

```typescript
// Generate encryption key (do this once):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. JWT Verification

Always verify JWT signatures using public keys from Dynamic's JWKS endpoint:

- Use `jose` library for modern, secure JWT handling
- Automatic JWKS fetching and caching
- Use RS256 algorithm
- Built-in expiration checking
- Works in edge environments (Cloudflare Workers, Vercel Edge, etc.)

**Note**: Dynamic stores JWT in localStorage by default. You can optionally configure `accessMode: 'cookies'` for HTTP-only cookies later for better security.

### 3. HTTPS Only

- All communication must use HTTPS in production
- Use `vite-plugin-mkcert` for local development HTTPS
- Configure CSP headers to allow Dynamic's iframe: `frame-src https://app.dynamicauth.com`

### 4. Key Rotation

Implement a key rotation strategy for encryption keys:

- Rotate `POLYMARKET_ENCRYPTION_KEY` periodically (e.g., every 90 days)
- Store multiple key versions
- Re-encrypt data with new keys during rotation

### 5. Rate Limiting

Already implemented in `hooks.server.ts`, ensure:

- API endpoints have appropriate rate limits
- Failed authentication attempts are logged and monitored
- Implement per-user rate limits for trading operations

### 6. Database Security

- Use parameterized queries (Drizzle handles this)
- Never log sensitive data (API keys, secrets, passphrases)
- Restrict database access to necessary operations only
- Use connection pooling with timeouts

### 7. Error Handling

Never expose sensitive information in error messages:

```typescript
// Bad
throw new Error(`Failed to decrypt API key: ${encryptedApiKey}`);

// Good
throw new Error('Failed to decrypt credentials');
```

### 8. Audit Logging

Log all sensitive operations:

- Polymarket registration events
- Order creation/cancellation
- Authentication failures
- Unusual access patterns

### 9. Credential Validation

Before using credentials, verify they're still valid:

```typescript
async function validateCredentials(userId: string): Promise<boolean> {
	try {
		// Make a simple authenticated request to Polymarket
		const orders = await getOpenOrders(userId);
		return true;
	} catch (error) {
		// Credentials may be invalid or expired
		return false;
	}
}
```

### 10. User Privacy

- Only store necessary credentials
- Allow users to revoke/delete their Polymarket connection
- Implement data export functionality (GDPR compliance)

---

## Implementation Checklist

### Phase 1: Setup

- [ ] Install Dynamic client SDK: `@dynamic-labs-sdk/client`
- [ ] Install Dynamic EVM extensions: `@dynamic-labs-sdk/evm`
- [ ] Install JWT library: `jose`
- [ ] Create Dynamic account and get environment ID
- [ ] Set up environment variables (including `DYNAMIC_ENVIRONMENT_ID`)
- [ ] Enable embedded wallets in Dynamic dashboard
- [ ] Enable "Create on Sign up" option
- [ ] Configure supported networks (Polygon for Polymarket)
- [ ] Generate encryption key for credentials storage

### Phase 2: Frontend

- [ ] Create Dynamic client wrapper in `+layout.svelte`
- [ ] Implement authentication UI component
- [ ] Enable email authentication in Dynamic dashboard
- [ ] Enable social authentication in Dynamic dashboard (Google, Twitter, etc.)
- [ ] Disable branded wallets in Dynamic dashboard (for now)
- [ ] Create Polymarket authorization component
- [ ] Implement signature request flow
- [ ] Add registration status checking
- [ ] Handle authentication state management

### Phase 3: Backend

- [ ] Add JWT verification to `hooks.server.ts`
- [ ] Create database schema for Polymarket credentials
- [ ] Run database migrations
- [ ] Implement encryption utilities (AES-256-GCM)
- [ ] Create Polymarket registration endpoint
- [ ] Implement credential storage (encrypted)
- [ ] Add error handling and logging
- [ ] Create protected API endpoints

### Phase 4: Polymarket Integration

- [ ] Research Polymarket CLOB API authentication
- [ ] Implement HMAC signature generation
- [ ] Create trading service functions
- [ ] Test order creation flow
- [ ] Implement order cancellation
- [ ] Add order status tracking
- [ ] Handle Polymarket API errors
- [ ] Test with Polymarket testnet (if available)

### Phase 5: Security

- [ ] Implement encryption at rest for credentials
- [ ] Set up HTTPS for local development
- [ ] Configure CSP headers for Dynamic iframe
- [ ] Implement key rotation strategy
- [ ] Add audit logging for sensitive operations
- [ ] Test credential validation
- [ ] Review and fix security vulnerabilities
- [ ] Add rate limiting for trading operations

### Phase 6: Testing

- [ ] Write unit tests for crypto utilities
- [ ] Test JWT verification logic
- [ ] Test encryption/decryption functions
- [ ] Integration tests for auth flow
- [ ] Test Polymarket registration
- [ ] Test order creation and cancellation
- [ ] Test error scenarios
- [ ] Load testing for concurrent users

### Phase 7: Deployment

- [ ] Set production environment variables
- [ ] Deploy database migrations
- [ ] Set up monitoring and alerting
- [ ] Configure rate limiting
- [ ] Deploy to production
- [ ] Smoke test authentication flow
- [ ] Test Polymarket integration end-to-end
- [ ] Monitor logs for errors

---

## Flow Summary

### Simple 4-Step Process:

1. **User Authenticates** → Dynamic creates user + embedded wallet automatically (email or social login)
2. **Create Local User** → Your backend creates/updates user in YOUR database
3. **User Signs Authorization** → One-time signature for Polymarket (requires step 2)
4. **Backend Stores Credentials** → Encrypted CLOB API credentials stored in database

**Authentication is now complete!** User can now access protected routes and is ready for trading (trading implementation is separate work).

### Authentication Options Available:

- ✅ **Email + OTP** - Passwordless email authentication
- ✅ **Social Login** - Google, Twitter, Discord, etc.
- ❌ **Branded Wallets** - Disabled for now (MetaMask, Phantom, etc. - can add later)

### Why User Creation Comes First:

**Dynamic manages their users**, but YOU need your own user records for:

- Associating Polymarket credentials with users
- Storing user preferences and settings
- Foreign key relationships in your database
- User management and analytics

### Why This is Better:

- ✅ **Simpler**: No delegation webhooks or key share management
- ✅ **Standard**: Follows Polymarket's recommended authentication flow
- ✅ **Secure**: Credentials encrypted at rest, user controls authorization
- ✅ **Efficient**: User signs once, trades forever
- ✅ **Less Code**: ~70% less complexity than delegation approach

---

## Additional Resources

- [Dynamic.xyz Documentation](https://www.dynamic.xyz/docs)
- [Dynamic Wallet Reference](./.claude/dynamic-wallet-reference.md)
- [Polymarket API Reference](./.claude/polymarket-api-reference.md)
- [Polymarket CLOB API Docs](https://docs.polymarket.com/)
- [Viem Documentation](https://viem.sh)
- [JWT.io Debugger](https://jwt.io)

---

## Support

For questions or issues:

1. Check Dynamic documentation: https://www.dynamic.xyz/docs
2. Check Polymarket documentation: https://docs.polymarket.com
3. Review this architecture document
4. Check existing code in `src/lib/server/services/`
5. Consult team members or create GitHub issue
